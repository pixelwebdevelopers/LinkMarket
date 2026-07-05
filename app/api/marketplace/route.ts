import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ListingType } from "@prisma/client";
import { getSetting } from "@/lib/settings";
import { requireUser, AuthError } from "@/lib/authz";

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
  const q = searchParams.get("q")?.trim();
  const country = searchParams.get("country");
  const sortBy = searchParams.get("sortBy") ?? "price_asc";
  const favorites = searchParams.get("favorites");

  if (favorites !== null && favorites.trim() === "") {
    return NextResponse.json({
      listings: [],
      total: 0,
      page,
      totalPages: 1,
    });
  }

  const orderBy = (() => {
    switch (sortBy) {
      case "price_asc":
      case "price_desc":
        return { createdAt: "desc" as const };
      case "dr_desc": return { metrics: { domainRating: "desc" as const } };
      case "traffic_desc": return { metrics: { organicTraffic: "desc" as const } };
      default: return { createdAt: "desc" as const };
    }
  })();

  const where = {
    status: "APPROVED" as const,
    listings: {
      some: {
        isActive: true,
        ...(type && { type }),
      },
    },
    ...(favorites && { id: { in: favorites.split(",") } }),
    ...(q && { url: { contains: q, mode: "insensitive" as const } }),
    ...(niche && niche !== "All Niches" && { niche: { equals: niche } }),
    ...(language && language !== "All Languages" && { language: { equals: language } }),
    ...(country && { country: { equals: country } }),
    metrics: {
      domainRating: { gte: minDR, lte: maxDR },
      organicTraffic: { gte: minTraffic },
    },
  };

  const [page1, total, globalCommission] = await Promise.all([
    db.site.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        metrics: true,
        owner: { select: { role: true, defaultCommissionCents: true } },
        listings: {
          where: {
            isActive: true,
            ...(type && { type }),
          },
        },
      },
    }),
    db.site.count({ where }),
    getSetting("globalCommissionCents"),
  ]);

  const minPriceCents = Math.round(minPrice * 100);
  const maxPriceCents = Math.round(maxPrice * 100);

  const augmented = page1.map((site) => {
    const ownerIsAdmin = site.owner.role === "ADMIN";
    let commissionCents: number;
    if (ownerIsAdmin) {
      commissionCents = 0;
    } else if (site.commissionCentsOverride !== null && site.commissionCentsOverride !== undefined) {
      commissionCents = site.commissionCentsOverride;
    } else if (site.owner.defaultCommissionCents !== null && site.owner.defaultCommissionCents !== undefined) {
      commissionCents = site.owner.defaultCommissionCents;
    } else {
      commissionCents = globalCommission;
    }

    const listings = site.listings.map((l) => {
      const finalPriceCents = ownerIsAdmin ? l.basePriceCents : l.basePriceCents + commissionCents;
      return {
        ...l,
        finalPriceCents,
        commissionCentsApplied: commissionCents,
      };
    });

    return {
      ...site,
      listings,
    };
  });

  // Apply price filter in-memory on the page slice.
  const filtered = augmented.filter((site) => {
    if (site.listings.length === 0) return false;
    return site.listings.some(
      (l) => l.finalPriceCents >= minPriceCents && l.finalPriceCents <= maxPriceCents
    );
  });

  // If sorting by price, sort by the minimum price of the site's available listings.
  if (sortBy === "price_asc") {
    filtered.sort((a, b) => {
      const aMin = Math.min(...a.listings.map((l) => l.finalPriceCents));
      const bMin = Math.min(...b.listings.map((l) => l.finalPriceCents));
      return aMin - bMin;
    });
  } else if (sortBy === "price_desc") {
    filtered.sort((a, b) => {
      const aMax = Math.max(...a.listings.map((l) => l.finalPriceCents));
      const bMax = Math.max(...b.listings.map((l) => l.finalPriceCents));
      return bMax - aMax;
    });
  }

  const sanitized = filtered.map((site) => {
    const siteCopy = { ...site } as Record<string, unknown>;
    delete siteCopy.owner;
    return siteCopy;
  });

  return NextResponse.json({
    listings: sanitized,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
