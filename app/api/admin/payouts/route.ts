import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const payouts = await db.payout.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { requestedAt: "desc" },
      include: {
        reseller: { select: { id: true, name: true, email: true } },
        bankAccount: true,
      },
    });
    return NextResponse.json(payouts);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
