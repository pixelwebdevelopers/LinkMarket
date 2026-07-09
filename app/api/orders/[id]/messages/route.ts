import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { notify, notifyAdmins } from "@/lib/notifications";
import { sanitizeInput } from "@/lib/security";

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
    const reqBody = sanitizeInput(await req.json());
    const { body } = reqBody;
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

    if (user.role !== "ADMIN") {
      const emailMatch = body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = body.match(/(?:\+?\d[\s-()]*){7,15}\d/);
      if (emailMatch || phoneMatch) {
        const trigger = emailMatch ? `email (${emailMatch[0]})` : `phone number`;
        await notifyAdmins({
          type: "GENERIC",
          title: "Policy Violation Alert: Contact Info Shared",
          body: `User ${user.email} (order #${id.slice(-8).toUpperCase()}) tried to share contact details: ${trigger}. Message blocked: "${body.trim()}"`,
          link: `/admin/orders/${id}`,
          email: true,
        });

        return NextResponse.json(
          { error: "Sharing contact information (emails or phone numbers) is strictly prohibited on the chat. Your message has not been sent and the platform administrator has been notified." },
          { status: 400 }
        );
      }
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
