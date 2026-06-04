import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const disputes = await db.dispute.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, email: true } },
            fulfiller: { select: { id: true, name: true, email: true } },
            listing: { include: { site: true } },
          },
        },
        openedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(disputes);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
