import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma, OrderStatus } from "@prisma/client";
import { requireUser, AuthError } from "@/lib/authz";
import { priceListing } from "@/lib/commission";
import { notify, notifyAdmins } from "@/lib/notifications";
import { getSetting } from "@/lib/settings";
import { reconcileOrders } from "@/lib/payments";

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

    const roleScope = searchParams.get("roleScope");
    const where: Prisma.OrderWhereInput = {};
    if (user.role === "ADMIN") {
      if (roleScope === "customer") {
        where.customerId = user.id;
      } else if (roleScope === "admin_only" || roleScope === "reseller") {
        where.fulfillerId = user.id;
      } else if (roleScope === "reseller_only") {
        where.fulfillerId = { not: user.id };
      }
    } else if (user.role === "RESELLER") {
      if (roleScope === "customer") {
        where.customerId = user.id;
      } else if (roleScope === "reseller") {
        where.fulfillerId = user.id;
      } else {
        where.OR = [{ fulfillerId: user.id }, { customerId: user.id }];
      }
    } else {
      where.customerId = user.id;
    }

    // Verify-on-return safety net: before listing, sweep any PENDING_PAYMENT
    // orders in this user's scope and reconcile them against Stripe. This is
    // what catches a customer who paid but never returned to the order page —
    // the next time they (or an admin, who sees all orders) open a list, the
    // order settles. Bounded to the most recent pending orders to cap API use.
    const pending = await db.order.findMany({
      where: { ...where, status: "PENDING_PAYMENT" },
      select: { id: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    await reconcileOrders(pending.map((o) => o.id));

    if (status) where.status = status as OrderStatus;

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
    const { listingId, targetUrl, anchorText, notes, contentBody, documentUrl } = await req.json();

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
        commissionCentsSnapshot: split.commissionCents,
        anchorText,
        targetUrl,
        notes,
        contentBody,
        documentUrl,
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
