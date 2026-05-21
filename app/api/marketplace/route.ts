import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ListingType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  // Filters
  const type = searchParams.get("type") as ListingType | null;
  const niche = searchParams.get("niche");
  const minDR = parseFloat(searchParams.get("minDR") ?? "0");
  const maxDR = parseFloat(searchParams.get("maxDR") ?? "100");
  const minPrice = parseFloat(searchParams.get("minPrice") ?? "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "99999");
  const minTraffic = parseInt(searchParams.get("minTraffic") ?? "0");
  const language = searchParams.get("language");
  const country = searchParams.get("country");
  const sortBy = searchParams.get("sortBy") ?? "price_asc";

  const orderBy = (() => {
    switch (sortBy) {
      case "price_asc": return { price: "asc" as const };
      case "price_desc": return { price: "desc" as const };
      case "dr_desc": return { site: { metrics: { domainRating: "desc" as const } } };
      case "traffic_desc": return { site: { metrics: { organicTraffic: "desc" as const } } };
      default: return { price: "asc" as const };
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
    price: { gte: minPrice, lte: maxPrice },
  };

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        site: {
          include: { metrics: true },
        },
      },
    }),
    db.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
