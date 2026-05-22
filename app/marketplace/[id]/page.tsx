import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatNumber, getDomainFromUrl, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OrderForm } from "@/components/marketplace/OrderForm";
import { ExternalLink, Shield, CheckCircle, Globe } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const typeLabels: Record<string, string> = {
  GUEST_POST: "Guest Post",
  NICHE_EDIT: "Niche Edit",
  TIER2: "Tier 2 Link",
};

export default async function ListingPage({ params }: Props) {
  const { id } = await params;

  const listing = await db.listing.findUnique({
    where: { id, isActive: true },
    include: {
      site: { include: { metrics: true } },
    },
  });

  if (!listing || listing.site.status !== "APPROVED") notFound();

  const { site, type, turnaroundDays, doFollow, includesContent, wordCount, extraNotes } = listing;
  const metrics = site.metrics;

  return (
    <div className="min-h-screen bg-zinc-950">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Site details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={type === "GUEST_POST" ? "info" : type === "NICHE_EDIT" ? "success" : "purple"}>
                {typeLabels[type] ?? type}
              </Badge>
              {doFollow && <Badge variant="success">DoFollow</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{getDomainFromUrl(site.url)}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> {site.language}</span>
              <span className="text-zinc-700">·</span>
              <span>{site.country}</span>
              <span className="text-zinc-700">·</span>
              <span>{site.niche}</span>
              <span className="text-zinc-700">·</span>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Visit site <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Metrics */}
          {metrics && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Domain Rating (DR)", value: metrics.domainRating },
                { label: "Domain Authority (DA)", value: metrics.domainAuthority },
                { label: "Organic Traffic", value: formatNumber(metrics.organicTraffic) },
                { label: "Referring Domains", value: formatNumber(metrics.referringDomains) },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{m.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{m.label}</p>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4 text-xs text-zinc-500 text-center pt-3 border-t border-zinc-800">
                Metrics last updated: {formatDate(metrics.updatedAt)}
              </div>
            </div>
          )}

          {site.description && (
            <div>
              <h2 className="font-semibold text-white mb-2">About This Site</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{site.description}</p>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-white mb-3">What&apos;s Included</h2>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                {type === "GUEST_POST" ? "Permanent guest post placement" : "Contextual niche edit"}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                {doFollow ? "DoFollow backlink" : "NoFollow backlink"}
              </li>
              {includesContent && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  Article writing included ({wordCount ?? 500}+ words)
                </li>
              )}
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                Delivery within {turnaroundDays} business days
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                12-month link replacement guarantee
              </li>
            </ul>
          </div>

          {extraNotes && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
              <strong className="text-amber-200">Publisher notes:</strong> {extraNotes}
            </div>
          )}

          {site.exampleUrl && (
            <div>
              <h2 className="font-semibold text-white mb-2">Example Link</h2>
              <a
                href={site.exampleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 break-all"
              >
                {site.exampleUrl} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          )}
        </div>

        {/* Right: Order form */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <OrderForm listing={listing} />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
