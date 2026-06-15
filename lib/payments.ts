import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { writeOrderPaidLedger } from "@/lib/ledger";
import { notify, notifyAdmins } from "@/lib/notifications";
import { getSetting } from "@/lib/settings";

/**
 * Mark an order PAID and run all downstream effects (ledger + notifications).
 *
 * This is the SINGLE source of truth for settling a payment. Both the Stripe
 * webhook and the verify-on-return reconciliation call it. It is fully
 * idempotent and concurrency-safe: the status flip is an atomic conditional
 * UPDATE (PENDING_PAYMENT -> PAID), so whoever wins the race does the work and
 * everyone else no-ops. Calling it twice for the same order never double-writes
 * the ledger or re-sends notifications.
 *
 * Returns true only if THIS call performed the settlement.
 */
export async function settleOrderPaid(
  orderId: string,
  opts: { paymentIntentId: string; chargeId?: string | null }
): Promise<boolean> {
  // Atomic claim — only the transition PENDING_PAYMENT -> PAID proceeds.
  const claim = await db.order.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntentId: opts.paymentIntentId,
      stripeChargeId: opts.chargeId ?? null,
    },
  });
  if (claim.count === 0) return false; // already settled, or not in a payable state

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { listing: { include: { site: true } }, customer: true, fulfiller: true },
  });
  if (!order) return false;

  // Ledger: admin commission + reseller earning. writeOrderPaidLedger is itself
  // idempotent (checks for existing entries), so this is safe under any retry.
  await db.$transaction(async (tx) => {
    await writeOrderPaidLedger(order.id, tx);
  });

  // Notify the customer.
  await notify({
    userId: order.customerId,
    type: "ORDER_PAID",
    title: "Payment received",
    body: `Your order on ${order.listing.site.name} has been paid. The publisher will start work shortly.`,
    link: `/orders/${order.id}`,
    email: true,
  });

  // Notify the fulfiller (admin or reseller).
  if (order.fulfillerId !== order.customerId) {
    await notify({
      userId: order.fulfillerId,
      type: "ORDER_PAID",
      title: "New paid order",
      body: `Order ${order.id.slice(-8).toUpperCase()} for ${order.listing.site.name} has been paid and is ready to fulfill.`,
      link: `/orders/${order.id}`,
      email: true,
    });
  }

  // Notify admins if enabled and the fulfiller isn't already an admin.
  const notifyAdmin = await getSetting("notifyAdminOnNewOrder");
  if (notifyAdmin && order.fulfiller.role !== "ADMIN") {
    await notifyAdmins({
      type: "ORDER_PAID",
      title: "New paid order on the platform",
      body: `Order ${order.id.slice(-8).toUpperCase()} placed by ${order.customer.email} for $${(order.pricePaidCents / 100).toFixed(2)}`,
      link: `/admin/orders/${order.id}`,
    });
  }

  return true;
}

/**
 * Verify-on-return reconciliation.
 *
 * Pulls the live payment state from Stripe for a single PENDING_PAYMENT order
 * and settles it if Stripe says it's paid. This is what makes the system
 * webhook-optional: every time an order (or list) is viewed, any pending order
 * is reconciled against Stripe, so a payment can't stay "stuck" just because
 * the customer closed the tab.
 *
 * Never throws — on any error it logs and leaves the order untouched, so the
 * surrounding request always succeeds.
 *
 * Returns true if this call settled the order.
 */
export async function reconcileOrderPayment(orderId: string): Promise<boolean> {
  if (!isStripeConfigured()) return false;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, stripeCheckoutSessionId: true, stripePaymentIntentId: true },
  });

  // Only pending orders that actually reached Stripe are reconcilable.
  if (!order || order.status !== "PENDING_PAYMENT") return false;
  if (!order.stripePaymentIntentId && !order.stripeCheckoutSessionId) return false;

  try {
    let paid = false;
    let paymentIntentId: string | undefined;
    let chargeId: string | null = null;

    if (order.stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      if (pi.status === "succeeded") {
        paid = true;
        paymentIntentId = pi.id;
        chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null;
      }
    } else if (order.stripeCheckoutSessionId) {
      const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId, {
        expand: ["payment_intent"],
      });
      if (session.payment_status === "paid") {
        const pi = session.payment_intent;
        if (typeof pi === "string") {
          paymentIntentId = pi;
        } else if (pi) {
          paymentIntentId = pi.id;
          chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null;
        }
        paid = Boolean(paymentIntentId);
      }
    }

    if (paid && paymentIntentId) {
      return await settleOrderPaid(order.id, { paymentIntentId, chargeId });
    }
  } catch (err) {
    console.error("[reconcile] failed for order", orderId, err);
  }
  return false;
}

/**
 * Reconcile a batch of orders in parallel. Used by list endpoints to sweep any
 * pending orders currently in view. Bounded by the caller (e.g. one page of
 * results) to keep Stripe API usage in check. Never throws.
 */
export async function reconcileOrders(orderIds: string[]): Promise<void> {
  if (orderIds.length === 0 || !isStripeConfigured()) return;
  await Promise.allSettled(orderIds.map((id) => reconcileOrderPayment(id)));
}
