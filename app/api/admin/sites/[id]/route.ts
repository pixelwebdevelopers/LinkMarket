import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import type { SiteStatus } from "@prisma/client";

/** GET — full site detail (for edit modal pre-population). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const site = await db.site.findUnique({
      where: { id },
      include: {
        metrics: true,
        listings: true,
        owner: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { listings: true } },
      },
    });
    if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(site);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const EDITABLE_FIELDS = [
  "name",
  "url",
  "description",
  "language",
  "country",
  "niche",
  "exampleUrl",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status, rejectionReason, commissionCentsOverride, listings, ...rest } = body;

    const site = await db.site.findUnique({ where: { id }, select: { ownerId: true, name: true } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    // Handle listings update first
    let updatedListings = false;
    if (listings && Array.isArray(listings)) {
      const keepIds = listings.filter((l: any) => l.id).map((l: any) => l.id);
      await db.listing.deleteMany({
        where: {
          siteId: id,
          id: { notIn: keepIds }
        }
      });

      for (const l of listings) {
        const priceCents = Math.round(parseFloat(l.price) * 100);
        if (isNaN(priceCents) || priceCents <= 0) {
          return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
        }
        if (l.id) {
          await db.listing.update({
            where: { id: l.id },
            data: {
              basePriceCents: priceCents,
              turnaroundDays: parseInt(l.turnaroundDays ?? 3),
              doFollow: l.doFollow ?? true,
              includesContent: l.includesContent ?? false,
              wordCount: l.wordCount ? parseInt(l.wordCount) : null,
              extraNotes: l.extraNotes ?? null,
              isActive: l.isActive ?? true,
            }
          });
        } else {
          await db.listing.create({
            data: {
              siteId: id,
              type: l.type,
              basePriceCents: priceCents,
              turnaroundDays: parseInt(l.turnaroundDays ?? 3),
              doFollow: l.doFollow ?? true,
              includesContent: l.includesContent ?? false,
              wordCount: l.wordCount ? parseInt(l.wordCount) : null,
              extraNotes: l.extraNotes ?? null,
              isActive: l.isActive ?? true,
            }
          });
        }
      }
      updatedListings = true;
    }

    const dataToUpdate: Record<string, unknown> = {};

    // Status transitions
    if (status) {
      const valid: SiteStatus[] = ["APPROVED", "REJECTED", "PENDING", "SUSPENDED"];
      if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      dataToUpdate.status = status;
      if (status === "APPROVED") {
        dataToUpdate.approvedAt = new Date();
        dataToUpdate.approvedById = admin.id;
        dataToUpdate.rejectionReason = null;
      }
      if (status === "REJECTED") {
        dataToUpdate.rejectionReason = rejectionReason ?? null;
      }
    }

    // Commission override
    if (commissionCentsOverride !== undefined) {
      if (commissionCentsOverride === null) dataToUpdate.commissionCentsOverride = null;
      else {
        const v = Number(commissionCentsOverride);
        if (!Number.isInteger(v) || v < 0) {
          return NextResponse.json(
            { error: "commissionCentsOverride must be a non-negative integer (cents)" },
            { status: 400 }
          );
        }
        dataToUpdate.commissionCentsOverride = v;
      }
    }

    // Generic field edits (name, url, niche, language, country, description, exampleUrl)
    for (const key of EDITABLE_FIELDS) {
      if (rest[key] !== undefined) {
        if (key === "url" && typeof rest.url === "string" && rest.url.trim()) {
          // Check for unique URL conflict
          const dup = await db.site.findFirst({
            where: { url: rest.url.trim(), NOT: { id } },
            select: { id: true },
          });
          if (dup) return NextResponse.json({ error: "Another site already uses that URL" }, { status: 409 });
        }
        dataToUpdate[key] = typeof rest[key] === "string" ? rest[key].trim() || null : rest[key];
      }
    }
    // Required fields can't be set to empty
    if (dataToUpdate.url === null) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    if (dataToUpdate.name === null) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (dataToUpdate.niche === null) return NextResponse.json({ error: "Niche is required" }, { status: 400 });

    if (Object.keys(dataToUpdate).length === 0 && !updatedListings) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    let updated;
    if (Object.keys(dataToUpdate).length > 0) {
      updated = await db.site.update({
        where: { id },
        data: {
          ...dataToUpdate,
          ...(status === "APPROVED" && {
            listings: { updateMany: { where: {}, data: { isActive: true } } },
          }),
          ...(status && ["REJECTED", "SUSPENDED"].includes(status) && {
            listings: { updateMany: { where: {}, data: { isActive: false } } },
          }),
        },
        include: { listings: true, metrics: true, owner: { select: { id: true, name: true, email: true, role: true } } },
      });
    } else {
      updated = await db.site.findUnique({
        where: { id },
        include: { listings: true, metrics: true, owner: { select: { id: true, name: true, email: true, role: true } } },
      });
    }

    await logAudit({
      actorId: admin.id,
      action: status ? `site.${String(status).toLowerCase()}` : "site.updated",
      targetType: "Site",
      targetId: id,
      metadata: dataToUpdate,
    });

    if (status === "APPROVED" && site.ownerId !== admin.id) {
      await notify({
        userId: site.ownerId,
        type: "SITE_APPROVED",
        title: "Your site was approved",
        body: `${site.name} is now live on the marketplace.`,
        link: "/reseller",
        email: true,
      });
    }
    if (status === "REJECTED" && site.ownerId !== admin.id) {
      await notify({
        userId: site.ownerId,
        type: "SITE_REJECTED",
        title: "Your site was rejected",
        body: rejectionReason
          ? `Reason: ${rejectionReason}`
          : "An admin rejected your site. Contact support for details.",
        link: "/reseller",
        email: true,
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE — remove a site.
 *   - If the site has any orders (through its listings), blocks unless ?force=1 is passed.
 *   - With ?force=1: cascades through listings; orders remain (Order.listingId is RESTRICT
 *     in schema) → in that case it errors and asks admin to suspend instead.
 *   - Recommended path: Suspend (status=SUSPENDED), don't delete sites with orders.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "1";

    const site = await db.site.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true } },
        listings: { select: { id: true, _count: { select: { orders: true } } } },
      },
    });
    if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalOrders = site.listings.reduce((acc, l) => acc + l._count.orders, 0);

    if (totalOrders > 0 && !force) {
      return NextResponse.json(
        {
          error: `This site has ${totalOrders} order(s). Suspending is recommended over delete to preserve order history. Pass ?force=1 to delete anyway (will be refused if orders prevent cascade).`,
          totalOrders,
        },
        { status: 409 }
      );
    }

    try {
      await db.site.delete({ where: { id } });
    } catch (err: any) {
      // Prisma P2003 = foreign key constraint failed (orders block listing/site delete)
      if (err?.code === "P2003") {
        return NextResponse.json(
          {
            error: "Cannot delete — this site has orders that reference its listings. Suspend the site instead.",
          },
          { status: 409 }
        );
      }
      throw err;
    }

    await logAudit({
      actorId: admin.id,
      action: "site.deleted",
      targetType: "Site",
      targetId: id,
      metadata: { url: site.url, name: site.name, force },
    });

    if (site.owner.id !== admin.id) {
      await notify({
        userId: site.owner.id,
        type: "GENERIC",
        title: "Your site was removed",
        body: `An admin removed ${site.name} (${site.url}) from the platform.`,
        link: "/reseller",
        email: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
