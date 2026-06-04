import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Compute a reseller's available payout balance in cents.
 * Available = sum of RESELLER_EARNING entries from orders that are COMPLETED
 *           - sum of PAYOUT entries (already paid out or in-flight)
 *
 * In-flight = PayoutStatus REQUESTED or APPROVED (the ledger entry was already written
 * when the payout was requested, so it correctly reduces availability).
 */
export async function getResellerBalanceCents(resellerId: string): Promise<{
  availableCents: number;
  lifetimeEarnedCents: number;
  pendingCents: number; // earnings from orders not yet COMPLETED
  paidOutCents: number;
}> {
  const [earnings, payouts, pending] = await Promise.all([
    db.ledgerEntry.aggregate({
      where: { userId: resellerId, type: "RESELLER_EARNING" },
      _sum: { amountCents: true },
    }),
    db.ledgerEntry.aggregate({
      where: { userId: resellerId, type: "PAYOUT" },
      _sum: { amountCents: true },
    }),
    db.order.aggregate({
      where: {
        fulfillerId: resellerId,
        status: { in: ["PAID", "IN_PROGRESS", "CONTENT_NEEDED", "SUBMITTED", "PUBLISHED"] },
      },
      _sum: { resellerEarningCents: true },
    }),
  ]);

  const lifetimeEarnedCents = earnings._sum.amountCents ?? 0;
  // PAYOUT entries are stored as positive amounts (the credit-side); availability subtracts them
  const paidOutCents = payouts._sum.amountCents ?? 0;
  const pendingCents = pending._sum.resellerEarningCents ?? 0;

  return {
    availableCents: lifetimeEarnedCents - paidOutCents,
    lifetimeEarnedCents,
    pendingCents,
    paidOutCents,
  };
}

/**
 * Write the standard ledger entries for an order that just got paid.
 * - Admin gets ORDER_GROSS (full amount captured to admin's Stripe)
 * - If reseller-owned: ADMIN_COMMISSION (admin's net) + RESELLER_EARNING
 * - If admin-owned: just the gross is admin's net (no separate commission row needed)
 */
export async function writeOrderPaidLedger(orderId: string, tx?: Prisma.TransactionClient): Promise<void> {
  const client = tx ?? db;
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: { listing: { include: { site: { include: { owner: true } } } } },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const admin = await client.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("No admin user exists — cannot post ORDER_GROSS ledger entry");

  const ownerIsAdmin = order.listing.site.owner.role === "ADMIN";

  // 1) Always record the gross payment as a credit to the admin (money landed in admin's Stripe).
  await client.ledgerEntry.create({
    data: {
      userId: admin.id,
      type: "ORDER_GROSS",
      amountCents: order.pricePaidCents,
      orderId: order.id,
      description: `Order ${order.id} paid by customer`,
    },
  });

  if (!ownerIsAdmin) {
    // 2a) Admin's commission slice from a reseller's order
    if (order.adminCommissionCents > 0) {
      await client.ledgerEntry.create({
        data: {
          userId: admin.id,
          type: "ADMIN_COMMISSION",
          amountCents: order.adminCommissionCents,
          orderId: order.id,
          description: `Commission on order ${order.id}`,
        },
      });
    }
    // 2b) Reseller's earning slice — this is what accrues toward their payout balance
    if (order.resellerEarningCents > 0) {
      await client.ledgerEntry.create({
        data: {
          userId: order.fulfillerId,
          type: "RESELLER_EARNING",
          amountCents: order.resellerEarningCents,
          orderId: order.id,
          description: `Earning from order ${order.id}`,
        },
      });
    }
  }
}

/** Write a REFUND ledger entry, reversing what was credited. */
export async function writeOrderRefundedLedger(orderId: string, refundCents: number, tx?: Prisma.TransactionClient): Promise<void> {
  const client = tx ?? db;
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: { listing: { include: { site: { include: { owner: true } } } } },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const admin = await client.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("No admin user exists — cannot post REFUND ledger entry");

  const ownerIsAdmin = order.listing.site.owner.role === "ADMIN";

  // Negative entry against admin's gross
  await client.ledgerEntry.create({
    data: {
      userId: admin.id,
      type: "REFUND",
      amountCents: -refundCents,
      orderId: order.id,
      description: `Refund on order ${order.id}`,
    },
  });

  if (!ownerIsAdmin) {
    // Reverse the reseller earning so it no longer counts toward payout balance
    if (order.resellerEarningCents > 0) {
      await client.ledgerEntry.create({
        data: {
          userId: order.fulfillerId,
          type: "REFUND",
          amountCents: -order.resellerEarningCents,
          orderId: order.id,
          description: `Refund reverses earning from order ${order.id}`,
        },
      });
    }
  }
}
