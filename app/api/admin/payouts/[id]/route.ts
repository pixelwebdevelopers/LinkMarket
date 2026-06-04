import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const payout = await db.payout.findUnique({
      where: { id },
      include: { reseller: { select: { id: true, name: true, email: true } }, bankAccount: true },
    });
    if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(payout);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PATCH actions:
 *   { action: "approve" }                    -> REQUESTED -> APPROVED
 *   { action: "mark_paid", reference, notes } -> APPROVED|REQUESTED -> PAID
 *   { action: "reject", rejectionReason }    -> REQUESTED|APPROVED -> REJECTED + reverse ledger
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { action, reference, notes, rejectionReason } = body;

    const payout = await db.payout.findUnique({ where: { id } });
    if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (payout.status === "PAID" || payout.status === "REJECTED") {
      return NextResponse.json({ error: `Payout already ${payout.status}` }, { status: 409 });
    }

    if (action === "approve") {
      const updated = await db.payout.update({
        where: { id },
        data: { status: "APPROVED", approvedAt: new Date() },
      });
      await logAudit({ actorId: admin.id, action: "payout.approved", targetType: "Payout", targetId: id });
      await notify({
        userId: payout.resellerId,
        type: "PAYOUT_APPROVED",
        title: "Payout approved",
        body: `Your payout of $${(payout.amountCents / 100).toFixed(2)} has been approved and will be sent shortly.`,
        link: "/reseller/earnings",
        email: true,
      });
      return NextResponse.json(updated);
    }

    if (action === "mark_paid") {
      const updated = await db.payout.update({
        where: { id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          approvedAt: payout.approvedAt ?? new Date(),
          paidById: admin.id,
          reference: reference ?? null,
          notes: notes ?? payout.notes,
        },
      });
      await logAudit({
        actorId: admin.id,
        action: "payout.paid",
        targetType: "Payout",
        targetId: id,
        metadata: { reference },
      });
      await notify({
        userId: payout.resellerId,
        type: "PAYOUT_PAID",
        title: "Payout sent",
        body: `Your payout of $${(payout.amountCents / 100).toFixed(2)} has been marked as paid${reference ? ` (ref: ${reference})` : ""}.`,
        link: "/reseller/earnings",
        email: true,
      });
      return NextResponse.json(updated);
    }

    if (action === "reject") {
      // Reverse the PAYOUT ledger entry so the funds become available again.
      const updated = await db.$transaction(async (tx) => {
        const u = await tx.payout.update({
          where: { id },
          data: { status: "REJECTED", rejectionReason: rejectionReason ?? null },
        });
        await tx.ledgerEntry.create({
          data: {
            userId: payout.resellerId,
            type: "PAYOUT",
            amountCents: -payout.amountCents, // reverses earlier positive
            payoutId: payout.id,
            description: `Payout request rejected — funds restored`,
          },
        });
        return u;
      });
      await logAudit({
        actorId: admin.id,
        action: "payout.rejected",
        targetType: "Payout",
        targetId: id,
        metadata: { rejectionReason },
      });
      await notify({
        userId: payout.resellerId,
        type: "PAYOUT_REJECTED",
        title: "Payout rejected",
        body: rejectionReason ?? "Your payout request was rejected. Funds have been restored to your balance.",
        link: "/reseller/earnings",
        email: true,
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
