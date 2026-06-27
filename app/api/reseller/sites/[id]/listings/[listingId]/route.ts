import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

/**
 * PATCH /api/reseller/sites/[id]/listings/[listingId] — update a listing.
 * Reseller can edit: basePriceCents, turnaroundDays, doFollow, includesContent, wordCount, extraNotes, isActive.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const { id, listingId } = await params;
    const body = await req.json();

    // Verify site ownership
    const site = await db.site.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    // Verify listing belongs to this site
    const listing = await db.listing.findFirst({
      where: { id: listingId, siteId: id },
    });
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const dataToUpdate: Record<string, unknown> = {};

    if (body.price !== undefined) {
      const priceCents = Math.round(parseFloat(body.price) * 100);
      if (isNaN(priceCents) || priceCents <= 0) {
        return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
      }
      dataToUpdate.basePriceCents = priceCents;
    }
    if (body.turnaroundDays !== undefined) {
      const days = parseInt(body.turnaroundDays);
      if (isNaN(days) || days < 1) {
        return NextResponse.json({ error: "Turnaround must be at least 1 day" }, { status: 400 });
      }
      dataToUpdate.turnaroundDays = days;
    }
    if (body.doFollow !== undefined) dataToUpdate.doFollow = Boolean(body.doFollow);
    if (body.includesContent !== undefined) dataToUpdate.includesContent = Boolean(body.includesContent);
    if (body.wordCount !== undefined) {
      dataToUpdate.wordCount = body.wordCount ? parseInt(body.wordCount) || null : null;
    }
    if (body.extraNotes !== undefined) dataToUpdate.extraNotes = body.extraNotes || null;
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await db.listing.update({
      where: { id: listingId },
      data: dataToUpdate,
    });

    await logAudit({
      actorId: user.id,
      action: "listing.updated",
      targetType: "Listing",
      targetId: listingId,
      metadata: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/reseller/sites/[id]/listings/[listingId] — remove a listing.
 * Blocked if the listing has active (non-terminal) orders.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const { id, listingId } = await params;

    const site = await db.site.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const listing = await db.listing.findFirst({
      where: { id: listingId, siteId: id },
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: { notIn: ["COMPLETED", "CANCELLED", "REFUNDED", "REJECTED"] },
              },
            },
          },
        },
      },
    });
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    if (listing._count.orders > 0) {
      return NextResponse.json(
        { error: `This listing has ${listing._count.orders} active order(s). Deactivate it instead of deleting.` },
        { status: 409 }
      );
    }

    await db.listing.delete({ where: { id: listingId } });

    await logAudit({
      actorId: user.id,
      action: "listing.deleted",
      targetType: "Listing",
      targetId: listingId,
      metadata: { siteId: id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
