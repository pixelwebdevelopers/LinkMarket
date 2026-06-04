import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/authz";
import { notify } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import type { OrderStatus } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        listing: { include: { site: { include: { metrics: true, owner: { select: { id: true, name: true, role: true } } } } } },
        customer: { select: { id: true, name: true, email: true } },
        fulfiller: { select: { id: true, name: true, email: true, role: true } },
        dispute: true,
        messages: { include: { sender: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const allowed =
      user.role === "ADMIN" ||
      order.customerId === user.id ||
      order.fulfillerId === user.id;
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// State transitions allowed per role.
// Status order in the happy path: PAID -> IN_PROGRESS -> SUBMITTED -> PUBLISHED -> COMPLETED
const transitions: Record<OrderStatus, { allowedNext: OrderStatus[]; roles: ("ADMIN" | "RESELLER" | "CUSTOMER" | "FULFILLER")[] }> = {
  PENDING_PAYMENT: { allowedNext: ["CANCELLED"], roles: ["CUSTOMER", "ADMIN"] },
  PAID: { allowedNext: ["IN_PROGRESS", "CONTENT_NEEDED", "REJECTED"], roles: ["FULFILLER", "ADMIN"] },
  IN_PROGRESS: { allowedNext: ["SUBMITTED", "CONTENT_NEEDED"], roles: ["FULFILLER", "ADMIN"] },
  CONTENT_NEEDED: { allowedNext: ["IN_PROGRESS", "SUBMITTED"], roles: ["FULFILLER", "ADMIN"] },
  SUBMITTED: { allowedNext: ["PUBLISHED", "IN_PROGRESS"], roles: ["FULFILLER", "ADMIN"] },
  PUBLISHED: { allowedNext: ["COMPLETED", "DISPUTED"], roles: ["CUSTOMER", "ADMIN"] },
  COMPLETED: { allowedNext: [], roles: [] },
  CANCELLED: { allowedNext: [], roles: [] },
  REJECTED: { allowedNext: [], roles: [] },
  DISPUTED: { allowedNext: [], roles: [] },
  REFUNDED: { allowedNext: [], roles: [] },
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { status, articleUrl, contentBody, notes, anchorText, targetUrl } = await req.json();

    const order = await db.order.findUnique({ where: { id }, include: { listing: true } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isFulfiller = order.fulfillerId === user.id;
    const isCustomer = order.customerId === user.id;
    const isAdmin = user.role === "ADMIN";

    // Allow content edits by customer only while order isn't in flight
    if ((contentBody !== undefined || notes !== undefined || anchorText !== undefined || targetUrl !== undefined) && isCustomer) {
      if (!["PENDING_PAYMENT", "PAID", "CONTENT_NEEDED"].includes(order.status)) {
        return NextResponse.json({ error: "Cannot edit content at this stage" }, { status: 409 });
      }
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (contentBody !== undefined && (isCustomer || isAdmin)) dataToUpdate.contentBody = contentBody;
    if (notes !== undefined && (isCustomer || isAdmin)) dataToUpdate.notes = notes;
    if (anchorText !== undefined && (isCustomer || isAdmin)) dataToUpdate.anchorText = anchorText;
    if (targetUrl !== undefined && (isCustomer || isAdmin)) dataToUpdate.targetUrl = targetUrl;
    if (articleUrl !== undefined && (isFulfiller || isAdmin)) dataToUpdate.articleUrl = articleUrl;

    if (status) {
      const rule = transitions[order.status as OrderStatus];
      if (!rule.allowedNext.includes(status)) {
        return NextResponse.json(
          { error: `Cannot move from ${order.status} to ${status}` },
          { status: 409 }
        );
      }
      const roleOk =
        (rule.roles.includes("ADMIN") && isAdmin) ||
        (rule.roles.includes("FULFILLER") && isFulfiller) ||
        (rule.roles.includes("CUSTOMER") && isCustomer);
      if (!roleOk) return NextResponse.json({ error: "You cannot perform that transition" }, { status: 403 });

      dataToUpdate.status = status;
      if (status === "IN_PROGRESS" && !order.acceptedAt) dataToUpdate.acceptedAt = new Date();
      if (status === "SUBMITTED") dataToUpdate.submittedAt = new Date();
      if (status === "PUBLISHED") dataToUpdate.publishedAt = new Date();
      if (status === "COMPLETED") dataToUpdate.completedAt = new Date();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await db.order.update({ where: { id }, data: dataToUpdate });

    if (status) {
      await logAudit({
        actorId: user.id,
        action: `order.status_changed`,
        targetType: "Order",
        targetId: id,
        metadata: { from: order.status, to: status },
      });
      // Notify the other party
      const otherUserId = isCustomer ? order.fulfillerId : order.customerId;
      if (otherUserId && otherUserId !== user.id) {
        await notify({
          userId: otherUserId,
          type: "ORDER_STATUS_CHANGED",
          title: `Order status: ${String(status).replace("_", " ").toLowerCase()}`,
          body: `Order ${id.slice(-8).toUpperCase()} is now ${status}.`,
          link: `/orders/${id}`,
        });
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
