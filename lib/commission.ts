import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export interface CommissionResolution {
  pct: number;
  source: "site_override" | "reseller_default" | "global" | "admin_owned";
}

/**
 * Resolve the effective commission % for a given listing.
 * 3-tier precedence:
 *   1. Site.commissionPctOverride (if set)
 *   2. Owner (User).defaultCommissionPct (if reseller and set)
 *   3. Global setting
 * For admin-owned sites, commission is 0 (admin keeps everything).
 */
export async function resolveCommissionForListing(listingId: string): Promise<CommissionResolution> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { site: { include: { owner: true } } },
  });
  if (!listing) throw new Error(`Listing ${listingId} not found`);

  const owner = listing.site.owner;

  // Admin's own site: no commission split, admin keeps 100% of the customer price.
  if (owner.role === "ADMIN") {
    return { pct: 0, source: "admin_owned" };
  }

  if (listing.site.commissionPctOverride !== null && listing.site.commissionPctOverride !== undefined) {
    return { pct: listing.site.commissionPctOverride, source: "site_override" };
  }

  if (owner.defaultCommissionPct !== null && owner.defaultCommissionPct !== undefined) {
    return { pct: owner.defaultCommissionPct, source: "reseller_default" };
  }

  const global = await getSetting("globalCommissionPct");
  return { pct: global, source: "global" };
}

export interface PriceSplit {
  basePriceCents: number;
  commissionPct: number;
  adminCommissionCents: number;
  resellerEarningCents: number;
  customerPriceCents: number;
}

/**
 * Given a listing's base price and the effective commission %,
 * compute the customer-facing price and the split.
 * For admin-owned listings, the entire price is "admin commission" (admin's revenue),
 * and reseller earning is 0.
 */
export function computeSplit(
  basePriceCents: number,
  commissionPct: number,
  isAdminOwned: boolean
): PriceSplit {
  if (isAdminOwned) {
    return {
      basePriceCents,
      commissionPct: 0,
      adminCommissionCents: basePriceCents,
      resellerEarningCents: 0,
      customerPriceCents: basePriceCents,
    };
  }
  const commissionCents = Math.round((basePriceCents * commissionPct) / 100);
  const customerPriceCents = basePriceCents + commissionCents;
  return {
    basePriceCents,
    commissionPct,
    adminCommissionCents: commissionCents,
    resellerEarningCents: basePriceCents,
    customerPriceCents,
  };
}

/**
 * One-shot helper: resolve commission for a listing and return the price split.
 */
export async function priceListing(listingId: string): Promise<PriceSplit & { source: CommissionResolution["source"] }> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { site: { include: { owner: true } } },
  });
  if (!listing) throw new Error(`Listing ${listingId} not found`);

  const isAdminOwned = listing.site.owner.role === "ADMIN";
  const resolution = await resolveCommissionForListing(listingId);
  const split = computeSplit(listing.basePriceCents, resolution.pct, isAdminOwned);
  return { ...split, source: resolution.source };
}
