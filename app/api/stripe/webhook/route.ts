import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { db } from "@/lib/db";
import { writeOrderPaidLedger, writeOrderRefundedLedger } from "@/lib/ledger";
import { notify, notifyAdmins } from "@/lib/notifications";
import { getSetting } from "@/lib/settings";
import type Stripe from "stripe";

// Stripe requires the raw body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[stripe webhook] signature verification failed", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        // ignore other events
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler failed", event.type, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("[stripe webhook] checkout.session.completed missing orderId metadata");
    return;
  }
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (paymentIntentId) {
    await db.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntentId },
    });
  }
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId;
  if (!orderId) {
    console.warn("[stripe webhook] payment_intent.succeeded missing orderId metadata");
    return;
  }

  const chargeId =
    typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null;

  // Atomic claim: only the call that flips PENDING_PAYMENT -> PAID proceeds.
  // Concurrent/duplicate webhook deliveries return updated.count === 0 and exit.
  const claim = await db.order.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntentId: pi.id,
      stripeChargeId: chargeId,
    },
  });
  if (claim.count === 0) {
    // Already processed (or order not found / in another terminal state).
    return;
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { listing: { include: { site: true } }, customer: true, fulfiller: true },
  });
  if (!order) return;

  await db.$transaction(async (tx) => {
    await writeOrderPaidLedger(order.id, tx);
  });

  // Notify the customer
  await notify({
    userId: order.customerId,
    type: "ORDER_PAID",
    title: "Payment received",
    body: `Your order on ${order.listing.site.name} has been paid. The publisher will start work shortly.`,
    link: `/orders/${order.id}`,
    email: true,
  });

  // Notify the fulfiller (admin or reseller)
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

  // Also notify admins if enabled and the fulfiller isn't already an admin
  const notifyAdmin = await getSetting("notifyAdminOnNewOrder");
  if (notifyAdmin && order.fulfiller.role !== "ADMIN") {
    await notifyAdmins({
      type: "ORDER_PAID",
      title: "New paid order on the platform",
      body: `Order ${order.id.slice(-8).toUpperCase()} placed by ${order.customer.email} for $${(order.pricePaidCents / 100).toFixed(2)}`,
      link: `/admin/orders/${order.id}`,
    });
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId;
  if (!orderId) return;
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING_PAYMENT") return;

  await db.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED" },
  });
  await notify({
    userId: order.customerId,
    type: "ORDER_PAYMENT_FAILED",
    title: "Payment failed",
    body: "Your payment did not go through. You can retry from the order page.",
    link: `/orders/${order.id}`,
    email: true,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;
  const order = await db.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { customer: true, fulfiller: true, listing: { include: { site: true } } },
  });
  if (!order) return;

  const refundCents = charge.amount_refunded ?? order.pricePaidCents;

  // Atomic claim of refundedAt — only one webhook call sets it. Other concurrent
  // / duplicate deliveries get count=0 and skip the notification. Ledger writing
  // is itself idempotent (checks for existing REFUND entries per order), so we
  // call it unconditionally — this also covers the case where some upstream code
  // (e.g. order PATCH or dispute resolve) marked refundedAt without writing the
  // ledger.
  const claim = await db.order.updateMany({
    where: { id: order.id, refundedAt: null },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundReason: charge.refunds?.data?.[0]?.reason ?? "stripe.refund",
    },
  });
  await writeOrderRefundedLedger(order.id, refundCents);

  // Only fire notifications the first time we observe the refund.
  if (claim.count === 0) return;

  await notify({
    userId: order.customerId,
    type: "ORDER_STATUS_CHANGED",
    title: "Order refunded",
    body: `A refund of $${(refundCents / 100).toFixed(2)} has been issued for your order on ${order.listing.site.name}.`,
    link: `/orders/${order.id}`,
    email: true,
  });
  if (order.fulfillerId !== order.customerId) {
    await notify({
      userId: order.fulfillerId,
      type: "ORDER_STATUS_CHANGED",
      title: "Order refunded",
      body: `Order ${order.id.slice(-8).toUpperCase()} has been refunded.`,
      link: `/orders/${order.id}`,
    });
  }
}
