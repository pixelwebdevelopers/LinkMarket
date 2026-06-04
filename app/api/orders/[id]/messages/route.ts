import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const order = await db.order.findUnique({ where: { id }, select: { customerId: true, fulfillerId: true } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (
      user.role !== "ADMIN" &&
      order.customerId !== user.id &&
      order.fulfillerId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await db.orderMessage.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, email: true, role: true } } },
    });
    return NextResponse.json(messages);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { body } = await req.json();
    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }
    if (body.length > 4000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { customer: { select: { id: true, email: true } }, fulfiller: { select: { id: true, email: true } } },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (
      user.role !== "ADMIN" &&
      order.customerId !== user.id &&
      order.fulfillerId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await db.orderMessage.create({
      data: { orderId: id, senderId: user.id, body: body.trim() },
      include: { sender: { select: { id: true, name: true, email: true, role: true } } },
    });

    // Notify the other party
    const otherUserId = user.id === order.customerId ? order.fulfillerId : order.customerId;
    if (otherUserId && otherUserId !== user.id) {
      await notify({
        userId: otherUserId,
        type: "NEW_MESSAGE",
        title: "New order message",
        body: body.trim().slice(0, 140),
        link: `/orders/${id}`,
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
