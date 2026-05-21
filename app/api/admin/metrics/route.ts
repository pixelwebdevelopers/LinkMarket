import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET all sites for metrics update
export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sites = await db.site.findMany({
    include: { metrics: true, publisher: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sites);
}

// PATCH: Update metrics for a site
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { siteId, domainRating, domainAuthority, organicTraffic, referringDomains, spamScore } =
    await req.json();

  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const metrics = await db.siteMetrics.upsert({
    where: { siteId },
    create: {
      siteId,
      domainRating: domainRating ?? 0,
      domainAuthority: domainAuthority ?? 0,
      organicTraffic: organicTraffic ?? 0,
      referringDomains: referringDomains ?? 0,
      spamScore: spamScore ?? 0,
      updatedById: session.user.id,
      updatedAt: new Date(),
    },
    update: {
      domainRating: domainRating ?? 0,
      domainAuthority: domainAuthority ?? 0,
      organicTraffic: organicTraffic ?? 0,
      referringDomains: referringDomains ?? 0,
      spamScore: spamScore ?? 0,
      updatedById: session.user.id,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(metrics);
}
