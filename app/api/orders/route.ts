import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where =
    session.user.role === "ADMIN"
      ? {}
      : session.user.role === "PUBLISHER"
      ? { listing: { site: { publisher: { userId: session.user.id } } } }
      : { buyerId: session.user.id };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        listing: { include: { site: true } },
        buyer: { select: { id: true, name: true, email: true } },
      },
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, targetUrl, anchorText, notes, contentBody } = await req.json();

  if (!listingId || !targetUrl || !anchorText) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const listing = await db.listing.findUnique({
    where: { id: listingId, isActive: true },
    include: { site: true },
  });

  if (!listing || listing.site.status !== "APPROVED") {
    return NextResponse.json({ error: "Listing not found or unavailable" }, { status: 404 });
  }

  // Check blacklist
  const blacklisted = await db.blacklist.findUnique({
    where: { userId_siteId: { userId: session.user.id, siteId: listing.siteId } },
  });
  if (blacklisted) {
    return NextResponse.json({ error: "This site is in your blacklist" }, { status: 400 });
  }

  const order = await db.order.create({
    data: {
      buyerId: session.user.id,
      listingId,
      targetUrl,
      anchorText,
      notes,
      contentBody,
      price: listing.price,
      status: "PENDING",
    },
  });

  return NextResponse.json(order, { status: 201 });
}
