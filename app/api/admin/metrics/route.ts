import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function GET() {
  try {
    await requireAdmin();
    const sites = await db.site.findMany({
      include: { metrics: true, owner: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sites);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { siteId, domainRating, domainAuthority, organicTraffic, referringDomains, spamScore } =
      await req.json();
    if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

    const site = await db.site.findUnique({ where: { id: siteId }, select: { ownerId: true } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const metrics = await db.siteMetrics.upsert({
      where: { siteId },
      create: {
        siteId,
        domainRating: domainRating ?? 0,
        domainAuthority: domainAuthority ?? 0,
        organicTraffic: organicTraffic ?? 0,
        referringDomains: referringDomains ?? 0,
        spamScore: spamScore ?? 0,
        updatedById: admin.id,
        updatedAt: new Date(),
      },
      update: {
        domainRating: domainRating ?? 0,
        domainAuthority: domainAuthority ?? 0,
        organicTraffic: organicTraffic ?? 0,
        referringDomains: referringDomains ?? 0,
        spamScore: spamScore ?? 0,
        updatedById: admin.id,
        updatedAt: new Date(),
      },
    });

    await logAudit({
      actorId: admin.id,
      action: "site.metrics_updated",
      targetType: "Site",
      targetId: siteId,
      metadata: { domainRating, domainAuthority, organicTraffic, referringDomains, spamScore },
    });

    if (site.ownerId !== admin.id) {
      await notify({
        userId: site.ownerId,
        type: "SITE_METRIC_UPDATED",
        title: "Your site's metrics were updated",
        body: "An admin refreshed the DR/DA/traffic numbers for one of your sites.",
        link: "/reseller",
      });
    }

    return NextResponse.json(metrics);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
