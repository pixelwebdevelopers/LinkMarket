import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { notifyAdmins, notify } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

class InsufficientFundsError extends Error {
  constructor(requested: number, available: number) {
    super(
      `Requested $${(requested / 100).toFixed(2)} but available is $${(available / 100).toFixed(2)}`
    );
  }
}

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

    const u = await db.user.findUnique({ where: { id: user.id }, select: { payoutThresholdCents: true } });
    const thresholdCents = u?.payoutThresholdCents ?? (await getSetting("payoutThresholdCents"));
    if (amount < thresholdCents) {
      return NextResponse.json(
        { error: `Minimum payout is $${(thresholdCents / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

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
      methodType: bank.methodType,
      paypalEmail: bank.paypalEmail,
      stripeEmail: bank.stripeEmail,
      accountNumber: bank.accountNumber,
      routingNumber: bank.routingNumber,
      iban: bank.iban,
      swift: bank.swift,
      bankName: bank.bankName,
      country: bank.country,
    };

    // Serializable transaction prevents two concurrent payout requests from each
    // observing the same balance and both succeeding (which would over-draw).
    // Postgres rejects the loser with a serialization failure — caller can retry.
    let payout: any;
    try {
      payout = await db.$transaction(
        async (tx) => {
          // Recompute available balance INSIDE the transaction
          const inside = await tx.ledgerEntry.aggregate({
            where: { userId: user.id, type: { in: ["RESELLER_EARNING", "REFUND", "PAYOUT"] } },
            _sum: { amountCents: true },
          });
          const availableCents = inside._sum.amountCents ?? 0;
          if (amount > availableCents) {
            throw new InsufficientFundsError(amount, availableCents);
          }
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
          await tx.ledgerEntry.create({
            data: {
              userId: user.id,
              type: "PAYOUT",
              amountCents: -amount, // debit — reduces available balance
              payoutId: created.id,
              description: `Payout requested ($${(amount / 100).toFixed(2)})`,
            },
          });
          return created;
        },
        { isolationLevel: "Serializable" }
      );
    } catch (err: any) {
      if (err instanceof InsufficientFundsError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      // Postgres serialization failure → tell caller to retry
      if (err?.code === "P2034" || /serialization|could not serialize/i.test(String(err))) {
        return NextResponse.json({ error: "Try again — another request was processing." }, { status: 409 });
      }
      throw err;
    }

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
