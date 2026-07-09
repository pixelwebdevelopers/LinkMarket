import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { notifyAdmins, notify } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { sanitizeInput } from "@/lib/security";

/**
 * Open a dispute on an order. Customer only.
 * Disputes can be opened only on orders that have been paid and not yet completed/cancelled/refunded.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = sanitizeInput(await req.json());
    const { reason } = body;
    if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
      return NextResponse.json({ error: "Please provide a clear reason (at least 10 characters)" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { listing: { include: { site: true } }, dispute: true, customer: true, fulfiller: true },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.customerId !== user.id) {
      return NextResponse.json({ error: "Only the customer can open a dispute" }, { status: 403 });
    }
    if (order.dispute) {
      return NextResponse.json({ error: "Order already has a dispute" }, { status: 409 });
    }
    const eligible = ["PAID", "IN_PROGRESS", "CONTENT_NEEDED", "SUBMITTED", "PUBLISHED"];
    if (!eligible.includes(order.status)) {
      return NextResponse.json({ error: `Cannot open dispute on a ${order.status} order` }, { status: 409 });
    }

    const dispute = await db.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: { orderId: id, openedById: user.id, reason: reason.trim(), status: "OPEN" },
      });
      await tx.order.update({
        where: { id },
        data: { status: "DISPUTED" },
      });
      return created;
    });

    await logAudit({
      actorId: user.id,
      action: "dispute.opened",
      targetType: "Order",
      targetId: id,
      metadata: { reason: reason.trim().slice(0, 200) },
    });
    await notifyAdmins({
      type: "ORDER_DISPUTED",
      title: "Dispute opened",
      body: `Order ${id.slice(-8).toUpperCase()} has been disputed by ${order.customer.email ?? "the customer"}.`,
      link: `/admin/orders/${id}`,
    });
    if (order.fulfillerId !== order.customerId) {
      await notify({
        userId: order.fulfillerId,
        type: "ORDER_DISPUTED",
        title: "Order disputed",
        body: `The customer opened a dispute on order ${id.slice(-8).toUpperCase()}. Funds are held until resolved.`,
        link: `/orders/${id}`,
        email: true,
      });
    }

    return NextResponse.json(dispute, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
