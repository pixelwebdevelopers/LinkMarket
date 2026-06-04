import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { getResellerBalanceCents } from "@/lib/ledger";
import { getSetting } from "@/lib/settings";
import { notifyAdmins, notify } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

// GET — reseller's own payout history
export async function GET() {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const payouts = await db.payout.findMany({
      where: { resellerId: user.id },
      orderBy: { requestedAt: "desc" },
      include: { bankAccount: { select: { label: true, bankName: true } } },
    });
    return NextResponse.json(payouts);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — request a payout. Amount required (cents); must be <= availableCents
// and at least the threshold. Snapshots bank details.
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("RESELLER");
    const { amountCents, bankAccountId, notes } = await req.json();

    const amount = Number(amountCents);
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "amountCents must be a positive integer" }, { status: 400 });
    }

    const balance = await getResellerBalanceCents(user.id);
    if (amount > balance.availableCents) {
      return NextResponse.json(
        { error: `Requested $${(amount / 100).toFixed(2)} but available is $${(balance.availableCents / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    const u = await db.user.findUnique({ where: { id: user.id }, select: { payoutThresholdCents: true } });
    const thresholdCents = u?.payoutThresholdCents ?? (await getSetting("payoutThresholdCents"));
    if (amount < thresholdCents) {
      return NextResponse.json(
        { error: `Minimum payout is $${(thresholdCents / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    // Bank account is required (unless we want to allow "request without bank")
    const bank = bankAccountId
      ? await db.bankAccount.findFirst({ where: { id: bankAccountId, userId: user.id } })
      : await db.bankAccount.findFirst({ where: { userId: user.id, isDefault: true } });
    if (!bank) {
      return NextResponse.json(
        { error: "Add a bank account before requesting a payout" },
        { status: 400 }
      );
    }

    const bankSnapshot = {
      label: bank.label,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      routingNumber: bank.routingNumber,
      iban: bank.iban,
      swift: bank.swift,
      bankName: bank.bankName,
      country: bank.country,
    };

    const payout = await db.$transaction(async (tx) => {
      const created = await tx.payout.create({
        data: {
          resellerId: user.id,
          bankAccountId: bank.id,
          amountCents: amount,
          status: "REQUESTED",
          bankSnapshot: bankSnapshot as any,
          notes: notes ?? null,
        },
      });
      // Write a PAYOUT ledger entry NOW so the available balance reflects pending payouts.
      // (The amount is stored positive; getResellerBalanceCents subtracts ALL payout entries.)
      await tx.ledgerEntry.create({
        data: {
          userId: user.id,
          type: "PAYOUT",
          amountCents: amount,
          payoutId: created.id,
          description: `Payout requested ($${(amount / 100).toFixed(2)})`,
        },
      });
      return created;
    });

    await logAudit({
      actorId: user.id,
      action: "payout.requested",
      targetType: "Payout",
      targetId: payout.id,
      metadata: { amountCents: amount },
    });
    await notifyAdmins({
      type: "PAYOUT_REQUESTED",
      title: "Payout request",
      body: `${user.email ?? "A reseller"} requested a payout of $${(amount / 100).toFixed(2)}.`,
      link: `/admin/payouts/${payout.id}`,
    });
    await notify({
      userId: user.id,
      type: "PAYOUT_REQUESTED",
      title: "Payout requested",
      body: `Your payout request for $${(amount / 100).toFixed(2)} was submitted. You'll be notified when it's processed.`,
      link: "/reseller/earnings",
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
