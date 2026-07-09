import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { sanitizeInput } from "@/lib/security";

/**
 * GET /api/reseller/sites/[id] — get a single site owned by current user.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const { id } = await params;

    const site = await db.site.findFirst({
      where: { id, ownerId: user.id },
      include: { metrics: true, listings: true },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    return NextResponse.json(site);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/reseller/sites/[id] — update own site details.
 * Resellers can update: name, description, exampleUrl, language, country.
 * Niche and URL changes are NOT allowed (would need admin re-approval).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const { id } = await params;
    const body = sanitizeInput(await req.json());

    const site = await db.site.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true, status: true },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const ALLOWED_FIELDS = ["name", "description", "exampleUrl", "language", "country"] as const;
    const dataToUpdate: Record<string, unknown> = {};

    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) {
        dataToUpdate[key] = typeof body[key] === "string" ? body[key].trim() || null : body[key];
      }
    }

    // Name is required
    if (dataToUpdate.name === null || dataToUpdate.name === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await db.site.update({
      where: { id },
      data: dataToUpdate,
      include: { metrics: true, listings: true },
    });

    await logAudit({
      actorId: user.id,
      action: "site.updated_by_owner",
      targetType: "Site",
      targetId: id,
      metadata: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
