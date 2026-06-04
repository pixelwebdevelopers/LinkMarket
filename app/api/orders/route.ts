import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/authz";
import { priceListing } from "@/lib/commission";
import { notify, notifyAdmins } from "@/lib/notifications";
import { getSetting } from "@/lib/settings";

/**
 * GET /api/orders — list orders scoped by role:
 *   - ADMIN:    all orders
 *   - RESELLER: orders where fulfillerId = me OR customerId = me
 *   - CUSTOMER: orders where customerId = me
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    const where: any = {};
    if (user.role === "ADMIN") {
      // no scope
    } else if (user.role === "RESELLER") {
      where.OR = [{ fulfillerId: user.id }, { customerId: user.id }];
    } else {
      where.customerId = user.id;
    }
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          listing: { include: { site: true } },
          customer: { select: { id: true, name: true, email: true } },
          fulfiller: { select: { id: true, name: true, email: true, role: true } },
          dispute: { select: { id: true, status: true } },
        },
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/orders — create a PENDING_PAYMENT order with snapshot pricing.
 * Returns { id, ... } and the caller should then POST to /api/checkout/session.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { listingId, targetUrl, anchorText, notes, contentBody } = await req.json();

    if (!listingId || !targetUrl || !anchorText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await db.listing.findUnique({
      where: { id: listingId, isActive: true },
      include: { site: { include: { owner: true } } },
    });
    if (!listing || listing.site.status !== "APPROVED") {
      return NextResponse.json({ error: "Listing not found or unavailable" }, { status: 404 });
    }

    // Resellers can't order their own listings.
    if (listing.site.ownerId === user.id) {
      return NextResponse.json({ error: "You cannot order your own listing" }, { status: 400 });
    }

    // Blacklist check
    const blacklisted = await db.blacklist.findUnique({
      where: { userId_siteId: { userId: user.id, siteId: listing.siteId } },
    });
    if (blacklisted) return NextResponse.json({ error: "This site is in your blacklist" }, { status: 400 });

    const split = await priceListing(listing.id);

    const order = await db.order.create({
      data: {
        customerId: user.id,
        fulfillerId: listing.site.ownerId,
        listingId,
        status: "PENDING_PAYMENT",
        pricePaidCents: split.customerPriceCents,
        adminCommissionCents: split.adminCommissionCents,
        resellerEarningCents: split.resellerEarningCents,
        commissionPctSnapshot: split.commissionPct,
        anchorText,
        targetUrl,
        notes,
        contentBody,
      },
    });

    // Pre-notify fulfiller that an order is being placed (final paid notification comes via webhook)
    const notifyAdmin = await getSetting("notifyAdminOnNewOrder");
    if (notifyAdmin) {
      await notifyAdmins({
        type: "ORDER_CREATED",
        title: "New order placed",
        body: `An order on ${listing.site.name} for $${(split.customerPriceCents / 100).toFixed(2)} is awaiting payment.`,
        link: `/admin/orders/${order.id}`,
      });
    }
    await notify({
      userId: user.id,
      type: "ORDER_CREATED",
      title: "Order created — complete payment",
      body: "Your order is reserved. Complete payment to send it to the publisher.",
      link: `/orders/${order.id}`,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
