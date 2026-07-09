import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authz";
import { notifyAdmins, notify } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { sanitizeInput } from "@/lib/security";

/**
 * GET /api/reseller/sites — list current user's sites.
 * Available to both RESELLER (their own) and ADMIN (admin's own sites).
 */
export async function GET() {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const sites = await db.site.findMany({
      where: { ownerId: user.id },
      include: { metrics: true, listings: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sites);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/reseller/sites — submit a new site.
 * Reseller sites start as PENDING and need admin approval before going live.
 * Admin sites are auto-APPROVED.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const body = sanitizeInput(await req.json());
    const { url, name, description, language, country, niche, exampleUrl, listings } = body;

    if (!url || !name || !niche) {
      return NextResponse.json({ error: "URL, name, and niche are required" }, { status: 400 });
    }

    const existing = await db.site.findUnique({ where: { url } });
    if (existing) return NextResponse.json({ error: "Site URL already registered" }, { status: 409 });

    const isAdmin = user.role === "ADMIN";

interface ListingInput {
  type: "GUEST_POST" | "NICHE_EDIT";
  price: string;
  turnaroundDays?: string;
  doFollow?: boolean;
  includesContent?: boolean;
  wordCount?: string;
  extraNotes?: string;
}

    const site = await db.site.create({
      data: {
        ownerId: user.id,
        url,
        name,
        description,
        language: language ?? "English",
        country: country ?? "US",
        niche,
        exampleUrl,
        status: isAdmin ? "APPROVED" : "PENDING",
        approvedAt: isAdmin ? new Date() : null,
        approvedById: isAdmin ? user.id : null,
        metrics: { create: {} },
        listings: listings?.length
          ? {
              create: listings.map((l: ListingInput) => ({
                type: l.type,
                basePriceCents: Math.round(parseFloat(l.price) * 100),
                turnaroundDays: parseInt(l.turnaroundDays ?? "3"),
                doFollow: l.doFollow ?? true,
                includesContent: l.includesContent ?? false,
                wordCount: l.wordCount ? parseInt(l.wordCount) : null,
                extraNotes: l.extraNotes,
                isActive: isAdmin, // active immediately if admin; resellers must wait for approval
              })),
            }
          : undefined,
      },
      include: { metrics: true, listings: true },
    });

    await logAudit({
      actorId: user.id,
      action: isAdmin ? "site.created_admin" : "site.submitted",
      targetType: "Site",
      targetId: site.id,
      metadata: { url, listingsCount: listings?.length ?? 0 },
    });

    if (!isAdmin) {
      await notifyAdmins({
        type: "SITE_SUBMITTED",
        title: "New site awaiting approval",
        body: `${user.email ?? "A reseller"} submitted ${name} (${url}).`,
        link: `/admin/sites/${site.id}`,
      });
      await notify({
        userId: user.id,
        type: "SITE_SUBMITTED",
        title: "Site submitted",
        body: "Your site is under review. We'll notify you within 48 hours.",
        link: "/reseller",
      });
    }

    return NextResponse.json(site, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
