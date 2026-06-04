import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ListingType } from "@prisma/client";
import { getSetting } from "@/lib/settings";

/**
 * Public marketplace endpoint.
 * Returns listings with a *customer-facing* finalPriceCents applied
 * via the commission rules. Filters on `minPrice` / `maxPrice` apply
 * to the customer-facing price.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
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

  // We can't sort by computed final price at the DB layer cheaply,
  // so we sort by base price and post-filter / re-sort in memory when needed.
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

  // Pull a wider slice (3x limit) so we can apply commission-based price filter then page.
  const widePool = await db.listing.findMany({
    where,
    take: limit * 3,
    skip: 0,
    orderBy,
    include: {
      site: { include: { metrics: true, owner: { select: { role: true, defaultCommissionPct: true } } } },
    },
  });

  const globalPct = await getSetting("globalCommissionPct");

  const minPriceCents = Math.round(minPrice * 100);
  const maxPriceCents = Math.round(maxPrice * 100);

  type Augmented = (typeof widePool)[number] & {
    finalPriceCents: number;
    commissionPctApplied: number;
  };

  const augmented: Augmented[] = widePool.map((l) => {
    const ownerIsAdmin = l.site.owner.role === "ADMIN";
    let pct: number;
    if (ownerIsAdmin) pct = 0;
    else if (l.site.commissionPctOverride !== null && l.site.commissionPctOverride !== undefined) {
      pct = l.site.commissionPctOverride;
    } else if (l.site.owner.defaultCommissionPct !== null && l.site.owner.defaultCommissionPct !== undefined) {
      pct = l.site.owner.defaultCommissionPct;
    } else {
      pct = globalPct;
    }
    const finalPriceCents = ownerIsAdmin
      ? l.basePriceCents
      : l.basePriceCents + Math.round((l.basePriceCents * pct) / 100);
    return { ...l, finalPriceCents, commissionPctApplied: pct };
  });

  const filtered = augmented.filter(
    (l) => l.finalPriceCents >= minPriceCents && l.finalPriceCents <= maxPriceCents
  );

  // Re-sort by final price if that's what user asked for
  if (sortBy === "price_asc") filtered.sort((a, b) => a.finalPriceCents - b.finalPriceCents);
  if (sortBy === "price_desc") filtered.sort((a, b) => b.finalPriceCents - a.finalPriceCents);

  const total = await db.listing.count({ where });
  const start = skip;
  const pageSlice = filtered.slice(start, start + limit).map(stripOwnerPrivate);

  return NextResponse.json({
    listings: pageSlice,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// Don't leak owner role / commission settings to the marketplace consumer.
function stripOwnerPrivate<T extends { site: { owner: unknown } }>(l: T): Omit<T, "site"> & { site: Omit<T["site"], "owner"> } {
  const { owner, ...siteRest } = l.site as any;
  return { ...l, site: siteRest } as any;
}
