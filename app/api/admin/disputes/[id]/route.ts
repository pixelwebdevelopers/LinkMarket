import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { writeOrderRefundedLedger } from "@/lib/ledger";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            listing: { include: { site: true } },
            customer: { select: { id: true, name: true, email: true } },
            fulfiller: { select: { id: true, name: true, email: true } },
            messages: { include: { sender: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
          },
        },
        openedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(dispute);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Resolve a dispute.
 *   { action: "resolve_customer", resolution } -> issues full refund via Stripe (or marks REFUNDED if no Stripe)
 *   { action: "resolve_reseller", resolution } -> closes dispute in favor of seller, order returns to PUBLISHED
 *   { action: "withdraw", resolution }         -> marks WITHDRAWN, order returns to its prior status (PUBLISHED)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action, resolution } = await req.json();

    const dispute = await db.dispute.findUnique({ where: { id }, include: { order: true } });
    if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (["RESOLVED_CUSTOMER", "RESOLVED_RESELLER", "WITHDRAWN"].includes(dispute.status)) {
      return NextResponse.json({ error: `Dispute already ${dispute.status}` }, { status: 409 });
    }

    const order = dispute.order;

    if (action === "resolve_customer") {
      // Try Stripe refund (no-op in dev without keys).
      if (isStripeConfigured() && order.stripePaymentIntentId) {
        try {
          await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            reason: "requested_by_customer",
            metadata: { orderId: order.id, disputeId: id },
          });
        } catch (err: any) {
          console.error("[dispute] stripe refund failed", err);
          return NextResponse.json(
            { error: `Stripe refund failed: ${err.message ?? "unknown"}` },
            { status: 502 }
          );
        }
      }

      // Mark REFUNDED (atomic — only the first call wins) and write ledger (idempotent).
      // Webhook may run later and finds the state already set; its writeOrderRefundedLedger
      // call will be a no-op due to existing-entry checks.
      await db.order.updateMany({
        where: { id: order.id, refundedAt: null },
        data: { status: "REFUNDED", refundedAt: new Date(), refundReason: "dispute_resolved_customer" },
      });
      await writeOrderRefundedLedger(order.id, order.pricePaidCents);

      const updated = await db.dispute.update({
        where: { id },
        data: {
          status: "RESOLVED_CUSTOMER",
          resolution: resolution ?? null,
          resolvedById: admin.id,
          resolvedAt: new Date(),
        },
      });

      await logAudit({
        actorId: admin.id,
        action: "dispute.resolved_customer",
        targetType: "Dispute",
        targetId: id,
        metadata: { orderId: order.id, refundCents: order.pricePaidCents },
      });
      await notify({
        userId: order.customerId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute resolved in your favor",
        body: `Your order ${order.id.slice(-8).toUpperCase()} has been refunded.`,
        link: `/orders/${order.id}`,
        email: true,
      });
      if (order.fulfillerId !== order.customerId) {
        await notify({
          userId: order.fulfillerId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute resolved",
          body: `Order ${order.id.slice(-8).toUpperCase()} was refunded to the customer.`,
          link: `/orders/${order.id}`,
          email: true,
        });
      }
      return NextResponse.json(updated);
    }

    if (action === "resolve_reseller" || action === "withdraw") {
      const newDisputeStatus = action === "resolve_reseller" ? "RESOLVED_RESELLER" : "WITHDRAWN";
      const newOrderStatus = order.publishedAt ? "PUBLISHED" : "IN_PROGRESS";
      const updated = await db.$transaction(async (tx) => {
        const u = await tx.dispute.update({
          where: { id },
          data: {
            status: newDisputeStatus,
            resolution: resolution ?? null,
            resolvedById: admin.id,
            resolvedAt: new Date(),
          },
        });
        await tx.order.update({ where: { id: order.id }, data: { status: newOrderStatus } });
        return u;
      });

      await logAudit({
        actorId: admin.id,
        action: `dispute.${newDisputeStatus.toLowerCase()}`,
        targetType: "Dispute",
        targetId: id,
        metadata: { orderId: order.id },
      });
      await notify({
        userId: order.customerId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute closed",
        body:
          action === "resolve_reseller"
            ? "After review, your dispute was closed without a refund."
            : "Your dispute was withdrawn.",
        link: `/orders/${order.id}`,
        email: true,
      });
      if (order.fulfillerId !== order.customerId) {
        await notify({
          userId: order.fulfillerId,
          type: "DISPUTE_RESOLVED",
          title: "Dispute closed in your favor",
          body: `Order ${order.id.slice(-8).toUpperCase()} can now proceed normally.`,
          link: `/orders/${order.id}`,
          email: true,
        });
      }
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
