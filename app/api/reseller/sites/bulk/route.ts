import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireRole, AuthError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";
import { parseCsvRecords } from "@/lib/csv";
import { getDomainFromUrl } from "@/lib/utils";

export const runtime = "nodejs";

type RowAction = "created" | "updated" | "skipped" | "error";
interface RowResult {
  row: number;
  url: string;
  action: RowAction;
  message?: string;
}

/** The canonical headers we document in the downloadable template. */
export const BULK_HEADERS = [
  "url",
  "name",
  "niche",
  "description",
  "language",
  "country",
  "example_url",
  "dr",
  "da",
  "traffic",
  "referring_domains",
  "spam_score",
  "guest_post_price",
  "guest_post_turnaround",
  "niche_edit_price",
  "niche_edit_turnaround",
] as const;

function num(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v.replace(/[$,]/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function priceToCents(v: string | undefined): number | undefined {
  const n = num(v);
  return n === undefined ? undefined : Math.round(n * 100);
}

function normalizeUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/**
 * POST /api/reseller/sites/bulk { csv: string }
 * Bulk create/update sites, their metrics, and Guest Post /
 * Niche Edit listing prices. Restricted to ADMIN users only.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN");
    const isAdmin = true;

    const { csv } = await req.json();
    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });
    }

    const { headers, records } = parseCsvRecords(csv);
    if (!headers.includes("url")) {
      return NextResponse.json(
        { error: "CSV must include a 'url' column. Download the template for the expected format." },
        { status: 400 }
      );
    }
    if (records.length === 0) {
      return NextResponse.json({ error: "No data rows found in the CSV" }, { status: 400 });
    }
    if (records.length > 1000) {
      return NextResponse.json({ error: "Too many rows — please import 1000 or fewer at a time" }, { status: 400 });
    }

    const results: RowResult[] = [];
    let created = 0;
    let updated = 0;
    let pendingCreated = 0;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowNum = i + 2; // +1 for header, +1 for 1-based
      const url = normalizeUrl(rec.url ?? "");

      if (!url) {
        results.push({ row: rowNum, url: "", action: "error", message: "Missing url" });
        continue;
      }

      try {
        const existing = await db.site.findUnique({ where: { url }, select: { id: true, ownerId: true, status: true } });

        // Build optional metric updates (only set fields actually provided).
        const metric: Record<string, number> = {};
        const dr = num(rec.dr); if (dr !== undefined) metric.domainRating = dr;
        const da = num(rec.da); if (da !== undefined) metric.domainAuthority = da;
        const traffic = num(rec.traffic); if (traffic !== undefined) metric.organicTraffic = Math.round(traffic);
        const refs = num(rec.referring_domains); if (refs !== undefined) metric.referringDomains = Math.round(refs);
        const spam = num(rec.spam_score); if (spam !== undefined) metric.spamScore = spam;

        const gpCents = priceToCents(rec.guest_post_price);
        const gpDays = num(rec.guest_post_turnaround);
        const neCents = priceToCents(rec.niche_edit_price);
        const neDays = num(rec.niche_edit_turnaround);

        if (existing) {
          const siteStatus = existing.status;
          const listingActive = isAdmin || siteStatus === "APPROVED";

          await db.$transaction(async (tx) => {
            // Update only provided scalar fields.
            const siteData: Record<string, unknown> = {};
            if (rec.name?.trim()) siteData.name = rec.name.trim();
            if (rec.niche?.trim()) siteData.niche = rec.niche.trim();
            if (rec.description?.trim()) siteData.description = rec.description.trim();
            if (rec.language?.trim()) siteData.language = rec.language.trim();
            if (rec.country?.trim()) siteData.country = rec.country.trim();
            if (rec.example_url?.trim()) siteData.exampleUrl = rec.example_url.trim();
            if (Object.keys(siteData).length) {
              await tx.site.update({ where: { id: existing.id }, data: siteData });
            }

            if (Object.keys(metric).length) {
              await tx.siteMetrics.upsert({
                where: { siteId: existing.id },
                create: { siteId: existing.id, ...metric, updatedById: user.id },
                update: { ...metric, updatedById: user.id, updatedAt: new Date() },
              });
            }

            await upsertListing(tx, existing.id, "GUEST_POST", gpCents, gpDays, listingActive);
            await upsertListing(tx, existing.id, "NICHE_EDIT", neCents, neDays, listingActive);
          });

          updated++;
          results.push({ row: rowNum, url, action: "updated" });
        } else {
          // Creating a new site requires niche.
          if (!rec.niche?.trim()) {
            results.push({ row: rowNum, url, action: "error", message: "New sites require a niche" });
            continue;
          }
          const siteName = rec.name?.trim() || getDomainFromUrl(url);
          const listingActive = isAdmin;

          await db.$transaction(async (tx) => {
            const site = await tx.site.create({
              data: {
                ownerId: user.id,
                url,
                name: siteName,
                niche: rec.niche.trim(),
                description: rec.description?.trim() || null,
                language: rec.language?.trim() || "English",
                country: rec.country?.trim() || "US",
                exampleUrl: rec.example_url?.trim() || null,
                status: isAdmin ? "APPROVED" : "PENDING",
                approvedAt: isAdmin ? new Date() : null,
                approvedById: isAdmin ? user.id : null,
                metrics: { create: { ...metric, updatedById: user.id } },
              },
            });
            await upsertListing(tx, site.id, "GUEST_POST", gpCents, gpDays, listingActive);
            await upsertListing(tx, site.id, "NICHE_EDIT", neCents, neDays, listingActive);
          });

          created++;
          if (!isAdmin) pendingCreated++;
          results.push({ row: rowNum, url, action: "created" });
        }
      } catch (rowErr) {
        console.error(`[bulk] row ${rowNum}`, rowErr);
        results.push({ row: rowNum, url, action: "error", message: "Failed to import this row" });
      }
    }

    await logAudit({
      actorId: user.id,
      action: "site.bulk_import",
      targetType: "Site",
      metadata: { created, updated, total: records.length },
    });

    // Let admins know new reseller sites are awaiting review.
    if (pendingCreated > 0) {
      await notifyAdmins({
        type: "SITE_SUBMITTED",
        title: `${pendingCreated} site${pendingCreated === 1 ? "" : "s"} awaiting approval`,
        body: `${user.email ?? "A reseller"} bulk-imported ${pendingCreated} new site${pendingCreated === 1 ? "" : "s"}.`,
        link: `/admin/sites`,
      });
    }

    const skipped = results.filter((r) => r.action === "skipped").length;
    const errors = results.filter((r) => r.action === "error").length;

    return NextResponse.json({
      summary: { total: records.length, created, updated, skipped, errors },
      results,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[bulk import]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Create or update a listing of the given type for a site. If no price is
 * supplied we leave any existing listing untouched (we never auto-delete).
 */
async function upsertListing(
  tx: Prisma.TransactionClient,
  siteId: string,
  type: "GUEST_POST" | "NICHE_EDIT",
  basePriceCents: number | undefined,
  turnaroundDays: number | undefined,
  isActive: boolean
) {
  if (basePriceCents === undefined && turnaroundDays === undefined) return;

  const existing = await tx.listing.findFirst({ where: { siteId, type } });

  if (existing) {
    const data: Record<string, unknown> = {};
    if (basePriceCents !== undefined) data.basePriceCents = basePriceCents;
    if (turnaroundDays !== undefined) data.turnaroundDays = Math.round(turnaroundDays);
    if (Object.keys(data).length) {
      await tx.listing.update({ where: { id: existing.id }, data });
    }
  } else if (basePriceCents !== undefined) {
    // Only create a brand-new listing when we actually have a price.
    await tx.listing.create({
      data: {
        siteId,
        type,
        basePriceCents,
        turnaroundDays: turnaroundDays !== undefined ? Math.round(turnaroundDays) : 3,
        isActive,
      },
    });
  }
}
