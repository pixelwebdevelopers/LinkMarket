import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export interface CommissionResolution {
  /** Effective commission amount in cents (flat — not a percentage). */
  commissionCents: number;
  source: "site_override" | "reseller_default" | "global" | "admin_owned";
}

/**
 * Resolve the effective commission (flat cents) for a listing.
 * 3-tier precedence:
 *   1. Site.commissionCentsOverride (if set)
 *   2. Owner (User).defaultCommissionCents (if reseller and set)
 *   3. Global setting (globalCommissionCents)
 * For admin-owned sites, commission is 0 (admin keeps the entire base price).
 */
export async function resolveCommissionForListing(listingId: string): Promise<CommissionResolution> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { site: { include: { owner: true } } },
  });
  if (!listing) throw new Error(`Listing ${listingId} not found`);

  const owner = listing.site.owner;

  if (owner.role === "ADMIN") {
    return { commissionCents: 0, source: "admin_owned" };
  }

  if (
    listing.site.commissionCentsOverride !== null &&
    listing.site.commissionCentsOverride !== undefined
  ) {
    return { commissionCents: listing.site.commissionCentsOverride, source: "site_override" };
  }

  if (owner.defaultCommissionCents !== null && owner.defaultCommissionCents !== undefined) {
    return { commissionCents: owner.defaultCommissionCents, source: "reseller_default" };
  }

  const global = await getSetting("globalCommissionCents");
  return { commissionCents: global, source: "global" };
}

export interface PriceSplit {
  basePriceCents: number;
  commissionCents: number;
  adminCommissionCents: number;
  resellerEarningCents: number;
  customerPriceCents: number;
}

/**
 * Given a listing's base price and the effective commission (cents),
 * compute the customer-facing price and the split.
 *   - Customer pays: base + commission
 *   - Admin keeps:   commission (always)
 *   - Reseller earns: base (always — they set base for what they want to earn)
 *   - For admin-owned: commission is 0, admin "earns" the base as their revenue.
 */
export function computeSplit(
  basePriceCents: number,
  commissionCents: number,
  isAdminOwned: boolean
): PriceSplit {
  if (isAdminOwned) {
    return {
      basePriceCents,
      commissionCents: 0,
      adminCommissionCents: basePriceCents,
      resellerEarningCents: 0,
      customerPriceCents: basePriceCents,
    };
  }
  const customerPriceCents = basePriceCents + commissionCents;
  return {
    basePriceCents,
    commissionCents,
    adminCommissionCents: commissionCents,
    resellerEarningCents: basePriceCents,
    customerPriceCents,
  };
}

/**
 * One-shot helper: resolve commission for a listing and return the price split.
 */
export async function priceListing(
  listingId: string
): Promise<PriceSplit & { source: CommissionResolution["source"] }> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { site: { include: { owner: true } } },
  });
  if (!listing) throw new Error(`Listing ${listingId} not found`);

  const isAdminOwned = listing.site.owner.role === "ADMIN";
  const resolution = await resolveCommissionForListing(listingId);
  const split = computeSplit(listing.basePriceCents, resolution.commissionCents, isAdminOwned);
  return { ...split, source: resolution.source };
}
