import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { sanitizeInput } from "@/lib/security";

/**
 * GET /api/reseller/sites/[id]/listings — list all listings for a site owned by the current user.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const { id } = await params;

    const site = await db.site.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const listings = await db.listing.findMany({
      where: { siteId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(listings);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/reseller/sites/[id]/listings — add a new listing to a site.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const { id } = await params;
    const body = sanitizeInput(await req.json());

    const site = await db.site.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true, status: true },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const { type, price, turnaroundDays, doFollow, includesContent, wordCount, extraNotes } = body;

    if (!type || !price) {
      return NextResponse.json({ error: "Type and price are required" }, { status: 400 });
    }
    if (!["GUEST_POST", "NICHE_EDIT"].includes(type)) {
      return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
    }

    const priceCents = Math.round(parseFloat(price) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    }

    // Check for duplicate type on the same site
    const existing = await db.listing.findFirst({
      where: { siteId: id, type },
    });
    if (existing) {
      return NextResponse.json({ error: `A ${type.replace("_", " ")} listing already exists for this site` }, { status: 409 });
    }

    const isAdmin = user.role === "ADMIN";
    const listing = await db.listing.create({
      data: {
        siteId: id,
        type,
        basePriceCents: priceCents,
        turnaroundDays: parseInt(turnaroundDays ?? "3") || 3,
        doFollow: doFollow ?? true,
        includesContent: includesContent ?? false,
        wordCount: wordCount ? parseInt(wordCount) : null,
        extraNotes: extraNotes ?? null,
        isActive: isAdmin || site.status === "APPROVED",
      },
    });

    await logAudit({
      actorId: user.id,
      action: "listing.created",
      targetType: "Listing",
      targetId: listing.id,
      metadata: { siteId: id, type, priceCents },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
