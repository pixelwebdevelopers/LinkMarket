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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
            <h1 className="text-2xl font-bold text-gray-900">{getDomainFromUrl(site.url)}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> {site.language}</span>
              <span>·</span>
              <span>{site.country}</span>
              <span>·</span>
              <span>{site.niche}</span>
              <span>·</span>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-600 hover:underline"
              >
                Visit site <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Metrics */}
          {metrics && (
            <div className="bg-gray-50 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Domain Rating (DR)", value: metrics.domainRating },
                { label: "Domain Authority (DA)", value: metrics.domainAuthority },
                { label: "Organic Traffic", value: formatNumber(metrics.organicTraffic) },
                { label: "Referring Domains", value: formatNumber(metrics.referringDomains) },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4 text-xs text-gray-400 text-center pt-2 border-t border-gray-200">
                Metrics last updated: {formatDate(metrics.updatedAt)}
              </div>
            </div>
          )}

          {site.description && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">About This Site</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{site.description}</p>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-gray-900 mb-3">What&apos;s Included</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                {type === "GUEST_POST" ? "Permanent guest post placement" : "Contextual niche edit"}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                {doFollow ? "DoFollow backlink" : "NoFollow backlink"}
              </li>
              {includesContent && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  Article writing included ({wordCount ?? 500}+ words)
                </li>
              )}
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                Delivery within {turnaroundDays} business days
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500 shrink-0" />
                12-month link replacement guarantee
              </li>
            </ul>
          </div>

          {extraNotes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <strong>Publisher notes:</strong> {extraNotes}
            </div>
          )}

          {site.exampleUrl && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Example Link</h2>
              <a
                href={site.exampleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                {site.exampleUrl} <ExternalLink className="h-3.5 w-3.5" />
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
  );
}
