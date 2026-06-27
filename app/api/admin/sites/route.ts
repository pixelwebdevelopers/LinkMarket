import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/authz";

/**
 * GET /api/admin/sites — list ALL sites with metrics, listings, and owner info.
 * Used by the admin Sites management panel.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status && ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
      where.status = status;
    }

    const sites = await db.site.findMany({
      where,
      include: {
        metrics: true,
        listings: true,
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sites);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
