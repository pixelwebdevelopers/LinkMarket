import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, getDomainFromUrl } from "@/lib/utils";
import { ExternalLink, Globe, CheckCircle, ArrowRight, FileText } from "lucide-react";

interface ListingCardProps {
  listing: {
    id: string;
    type: string;
    price: number;
    turnaroundDays: number;
    doFollow: boolean;
    includesContent: boolean;
    wordCount?: number | null;
    site: {
      url: string;
      name: string;
      niche: string;
      language: string;
      country: string;
      exampleUrl?: string | null;
      metrics?: {
        domainRating: number;
        domainAuthority: number;
        organicTraffic: number;
        referringDomains: number;
        spamScore: number;
      } | null;
    };
  };
}

const typeConfig: Record<string, { label: string; variant: "info" | "success" | "purple" }> = {
  GUEST_POST: { label: "Guest Post", variant: "info" },
  NICHE_EDIT: { label: "Niche Edit", variant: "success" },
  TIER2: { label: "Tier 2", variant: "purple" },
};

export function ListingCard({ listing }: ListingCardProps) {
  const { site, type, price, turnaroundDays, doFollow, includesContent } = listing;
  const metrics = site.metrics;
  const tc = typeConfig[type] ?? { label: type, variant: "default" };
  const domain = getDomainFromUrl(site.url);

  return (
    <div className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-500/30 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <Badge variant={tc.variant}>{tc.label}</Badge>
            {doFollow && <Badge variant="success">DoFollow</Badge>}
            {includesContent && <Badge variant="default">Content Included</Badge>}
          </div>
          <h3 className="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition-colors">
            {domain}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{site.niche} · {site.country}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">{formatCurrency(price)}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{turnaroundDays}d delivery</p>
        </div>
      </div>

      {/* Metrics */}
      {metrics ? (
        <div className="grid grid-cols-4 gap-2 bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/50">
          {[
            { label: "DR", value: metrics.domainRating },
            { label: "DA", value: metrics.domainAuthority },
            { label: "Traffic", value: formatNumber(metrics.organicTraffic) },
            { label: "RD", value: formatNumber(metrics.referringDomains) },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-xs text-zinc-500 mb-0.5">{m.label}</p>
              <p className="font-bold text-white text-sm">{m.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-14 bg-zinc-800/40 rounded-xl border border-zinc-700/30 flex items-center justify-center">
          <p className="text-xs text-zinc-600">Metrics pending</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{site.language}</span>
          {site.exampleUrl && (
            <a href={site.exampleUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
              <ExternalLink className="h-3 w-3" /> Example
            </a>
          )}
        </div>
        <Link href={`/marketplace/${listing.id}`}>
          <Button size="sm" className="gap-1.5">
            Order <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
