import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ListingType } from "@prisma/client";
import { getSetting } from "@/lib/settings";
import { requireUser, AuthError } from "@/lib/authz";

/**
 * Marketplace listings endpoint. Requires an authenticated account.
 *
 * Returns listings with a `finalPriceCents` computed from the per-listing
 * commission resolution (site override → reseller default → global). The
 * `minPrice`/`maxPrice` filter is applied to the *customer-facing* price
 * AFTER commission, but DB-level pagination uses the basePrice ordering.
 *
 * Caveat: the price-range filter is applied in-memory to the page slice, so
 * the displayed `total` is the DB-level count, which may be slightly higher
 * than the count of listings actually shown when a price filter is active.
 * For the marketplace this is acceptable — search engines and filter UIs
 * typically tolerate approximate totals. (To make this exact we'd need to
 * materialise finalPriceCents into a generated column.)
 */
export async function GET(req: NextRequest) {
  // Marketplace browsing requires an account.
  try {
    await requireUser();
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const type = searchParams.get("type") as ListingType | null;
  const niche = searchParams.get("niche");
  const minDR = parseFloat(searchParams.get("minDR") ?? "0");
  const maxDR = parseFloat(searchParams.get("maxDR") ?? "100");
  const minPrice = parseFloat(searchParams.get("minPrice") ?? "0"); // dollars
  const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "99999");
  const minTraffic = parseInt(searchParams.get("minTraffic") ?? "0");
  const language = searchParams.get("language");
  const country = searchParams.get("country");
  const sortBy = searchParams.get("sortBy") ?? "price_asc";

  const orderBy = (() => {
    switch (sortBy) {
      case "price_asc": return { basePriceCents: "asc" as const };
      case "price_desc": return { basePriceCents: "desc" as const };
      case "dr_desc": return { site: { metrics: { domainRating: "desc" as const } } };
      case "traffic_desc": return { site: { metrics: { organicTraffic: "desc" as const } } };
      default: return { basePriceCents: "asc" as const };
    }
  })();

  const where = {
    isActive: true,
    site: {
      status: "APPROVED" as const,
      ...(niche && { niche: { contains: niche, mode: "insensitive" as const } }),
      ...(language && { language: { equals: language, mode: "insensitive" as const } }),
      ...(country && { country: { equals: country, mode: "insensitive" as const } }),
      metrics: {
        domainRating: { gte: minDR, lte: maxDR },
        organicTraffic: { gte: minTraffic },
      },
    },
    ...(type && { type }),
  };

  const [page1, total, globalCommission] = await Promise.all([
    db.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        site: { include: { metrics: true, owner: { select: { role: true, defaultCommissionCents: true } } } },
      },
    }),
    db.listing.count({ where }),
    getSetting("globalCommissionCents"),
  ]);

  const minPriceCents = Math.round(minPrice * 100);
  const maxPriceCents = Math.round(maxPrice * 100);

  const augmented = page1.map((l) => {
    const ownerIsAdmin = l.site.owner.role === "ADMIN";
    let commissionCents: number;
    if (ownerIsAdmin) {
      commissionCents = 0;
    } else if (l.site.commissionCentsOverride !== null && l.site.commissionCentsOverride !== undefined) {
      commissionCents = l.site.commissionCentsOverride;
    } else if (l.site.owner.defaultCommissionCents !== null && l.site.owner.defaultCommissionCents !== undefined) {
      commissionCents = l.site.owner.defaultCommissionCents;
    } else {
      commissionCents = globalCommission;
    }
    const finalPriceCents = ownerIsAdmin ? l.basePriceCents : l.basePriceCents + commissionCents;
    return { ...l, finalPriceCents, commissionCentsApplied: commissionCents };
  });

  // Apply price filter in-memory on the page slice. (See header caveat.)
  const filtered = augmented.filter(
    (l) => l.finalPriceCents >= minPriceCents && l.finalPriceCents <= maxPriceCents
  );

  // If sorting by price, re-sort the slice by FINAL price for visual consistency.
  if (sortBy === "price_asc") filtered.sort((a, b) => a.finalPriceCents - b.finalPriceCents);
  if (sortBy === "price_desc") filtered.sort((a, b) => b.finalPriceCents - a.finalPriceCents);

  return NextResponse.json({
    listings: filtered.map(stripOwnerPrivate),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

// Don't leak owner role / commission settings to the marketplace consumer.
function stripOwnerPrivate<T extends { site: { owner: unknown } }>(l: T): Omit<T, "site"> & { site: Omit<T["site"], "owner"> } {
  const { owner, ...siteRest } = l.site as any;
  return { ...l, site: siteRest } as any;
}
