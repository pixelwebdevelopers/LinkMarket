import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      listing: { include: { site: { include: { metrics: true } } } },
      buyer: { select: { id: true, name: true, email: true } },
      transaction: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isPublisher =
    session.user.role === "PUBLISHER"
      ? await db.publisher.findFirst({
          where: {
            userId: session.user.id,
            sites: { some: { listings: { some: { id: order.listingId } } } },
          },
        })
      : null;

  if (
    order.buyerId !== session.user.id &&
    session.user.role !== "ADMIN" &&
    !isPublisher
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, articleUrl } = await req.json();

  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowedStatuses = Object.values(OrderStatus);
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await db.order.update({
    where: { id },
    data: {
      status,
      ...(articleUrl && { articleUrl }),
    },
  });

  return NextResponse.json(updated);
}
