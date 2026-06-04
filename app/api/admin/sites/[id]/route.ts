import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import type { SiteStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { status, rejectionReason, commissionPctOverride } = await req.json();

    const site = await db.site.findUnique({ where: { id }, select: { ownerId: true, name: true } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const dataToUpdate: Record<string, unknown> = {};

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

    if (commissionPctOverride !== undefined) {
      if (commissionPctOverride === null) dataToUpdate.commissionPctOverride = null;
      else {
        const v = Number(commissionPctOverride);
        if (!Number.isFinite(v) || v < 0 || v > 200) {
          return NextResponse.json({ error: "commissionPctOverride must be 0–200" }, { status: 400 });
        }
        dataToUpdate.commissionPctOverride = v;
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await db.site.update({
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
      include: { listings: true },
    });

    await logAudit({
      actorId: admin.id,
      action: `site.${status ? String(status).toLowerCase() : "updated"}`,
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
