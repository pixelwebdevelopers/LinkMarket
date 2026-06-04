import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/authz";
import { getResellerBalanceCents } from "@/lib/ledger";
import { getSetting } from "@/lib/settings";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const balance = await getResellerBalanceCents(user.id);

    // Effective threshold = user override or global
    const u = await db.user.findUnique({ where: { id: user.id }, select: { payoutThresholdCents: true } });
    const thresholdCents = u?.payoutThresholdCents ?? (await getSetting("payoutThresholdCents"));

    const recentLedger = await db.ledgerEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { order: { include: { listing: { include: { site: true } } } } },
    });

    return NextResponse.json({ ...balance, thresholdCents, recentLedger });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
