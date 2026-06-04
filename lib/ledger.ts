import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Ledger semantics
 * ─────────────────
 * Every entry is a signed amount on a user account.
 *   positive = credit (money owed TO the user)
 *   negative = debit  (money owed BY the user / reduces balance)
 *
 * Reseller's available payout balance =
 *   sum of ALL entries on their account (RESELLER_EARNING + REFUND + PAYOUT)
 *
 * Sign conventions for each LedgerEntryType:
 *   RESELLER_EARNING : + on COMPLETED          (reseller earned their slice)
 *   REFUND           : - on customer refund    (claws back what was credited)
 *   PAYOUT           : - on payout REQUESTED   (reserves funds; balance drops)
 *                    : + on payout REJECTED    (returns funds; balance restored)
 *   ORDER_GROSS      : + on admin's account when payment lands (gross revenue)
 *
 * Earnings are credited only when the order COMPLETES (customer marks Completed
 * or auto-completes). Before that, the money sits as "pending" — visible but not
 * spendable. This prevents resellers from cashing out before delivering.
 */

export async function getResellerBalanceCents(resellerId: string): Promise<{
  availableCents: number;
  lifetimeEarnedCents: number;
  pendingCents: number; // earnings from orders not yet COMPLETED
  paidOutCents: number;
}> {
  const [allEntries, earningsOnly, pending, paidPayouts] = await Promise.all([
    db.ledgerEntry.aggregate({
      where: { userId: resellerId, type: { in: ["RESELLER_EARNING", "REFUND", "PAYOUT"] } },
      _sum: { amountCents: true },
    }),
    db.ledgerEntry.aggregate({
      where: { userId: resellerId, type: "RESELLER_EARNING" },
      _sum: { amountCents: true },
    }),
    db.order.aggregate({
      where: {
        fulfillerId: resellerId,
        status: { in: ["PAID", "IN_PROGRESS", "CONTENT_NEEDED", "SUBMITTED", "PUBLISHED"] },
      },
      _sum: { resellerEarningCents: true },
    }),
    db.payout.aggregate({
      where: { resellerId, status: "PAID" },
      _sum: { amountCents: true },
    }),
  ]);

  return {
    // Available = sum of every signed entry on this reseller's account
    availableCents: allEntries._sum.amountCents ?? 0,
    // Lifetime credits earned (positive entries only)
    lifetimeEarnedCents: earningsOnly._sum.amountCents ?? 0,
    // Money locked in in-flight orders (not yet completed)
    pendingCents: pending._sum.resellerEarningCents ?? 0,
    // Successfully paid-out total (from Payout records, not ledger)
    paidOutCents: paidPayouts._sum.amountCents ?? 0,
  };
}

/**
 * Called when an order's payment is captured (status PENDING_PAYMENT -> PAID).
 * Only writes ORDER_GROSS on the admin account so we can track total gross
 * revenue landing in Stripe. Reseller earnings are NOT credited yet — they're
 * pending until COMPLETED.
 */
export async function writeOrderPaidLedger(orderId: string, tx?: Prisma.TransactionClient): Promise<void> {
  const client = tx ?? db;
  const order = await client.order.findUnique({
    where: { id: orderId },
    select: { id: true, pricePaidCents: true },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const admin = await client.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) {
    console.error("[ledger] no admin user — cannot post ORDER_GROSS for", orderId);
    return;
  }

  // Idempotent: skip if ORDER_GROSS already exists for this order
  const existing = await client.ledgerEntry.findFirst({
    where: { orderId: order.id, type: "ORDER_GROSS" },
    select: { id: true },
  });
  if (existing) return;

  await client.ledgerEntry.create({
    data: {
      userId: admin.id,
      type: "ORDER_GROSS",
      amountCents: order.pricePaidCents,
      orderId: order.id,
      description: `Order ${order.id} paid by customer`,
    },
  });
}

/**
 * Called when an order COMPLETES (customer marks completed or auto-complete).
 * Credits the reseller's earning slice. Idempotent.
 *
 * Admin-owned listings: nothing extra to write — admin already got ORDER_GROSS
 * and the order is fulfilled by themselves.
 */
export async function writeOrderCompletedLedger(orderId: string, tx?: Prisma.TransactionClient): Promise<void> {
  const client = tx ?? db;
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: { listing: { include: { site: { include: { owner: { select: { role: true } } } } } } },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const ownerIsAdmin = order.listing.site.owner.role === "ADMIN";
  if (ownerIsAdmin || order.resellerEarningCents <= 0) return;

  const existing = await client.ledgerEntry.findFirst({
    where: { orderId: order.id, userId: order.fulfillerId, type: "RESELLER_EARNING" },
    select: { id: true },
  });
  if (existing) return;

  await client.ledgerEntry.create({
    data: {
      userId: order.fulfillerId,
      type: "RESELLER_EARNING",
      amountCents: order.resellerEarningCents,
      orderId: order.id,
      description: `Earning from completed order ${order.id}`,
    },
  });
}

/**
 * Called when an order is refunded (any reason). Writes:
 *   - REFUND on admin = -refundCents (reverses ORDER_GROSS)
 *   - REFUND on reseller = -resellerEarningCents (ONLY if the earning was
 *     previously credited; if the order never completed there's nothing to reverse)
 * Idempotent.
 */
export async function writeOrderRefundedLedger(
  orderId: string,
  refundCents: number,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx ?? db;
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: { listing: { include: { site: { include: { owner: { select: { role: true } } } } } } },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const admin = await client.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) {
    console.error("[ledger] no admin — cannot post REFUND for", orderId);
    return;
  }

  // Idempotent on admin's side
  const existingAdminRefund = await client.ledgerEntry.findFirst({
    where: { orderId: order.id, userId: admin.id, type: "REFUND" },
    select: { id: true },
  });
  if (!existingAdminRefund) {
    await client.ledgerEntry.create({
      data: {
        userId: admin.id,
        type: "REFUND",
        amountCents: -refundCents,
        orderId: order.id,
        description: `Refund on order ${order.id}`,
      },
    });
  }

  const ownerIsAdmin = order.listing.site.owner.role === "ADMIN";
  if (!ownerIsAdmin && order.resellerEarningCents > 0) {
    // Only reverse the reseller's earning if it was actually credited (i.e. order
    // had previously completed). If they were never credited, no reversal needed.
    const existingEarning = await client.ledgerEntry.findFirst({
      where: { orderId: order.id, userId: order.fulfillerId, type: "RESELLER_EARNING" },
      select: { id: true },
    });
    const existingResellerRefund = await client.ledgerEntry.findFirst({
      where: { orderId: order.id, userId: order.fulfillerId, type: "REFUND" },
      select: { id: true },
    });
    if (existingEarning && !existingResellerRefund) {
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
