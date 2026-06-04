import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, getDomainFromUrl } from "@/lib/utils";
import { ExternalLink, Globe, ArrowRight } from "lucide-react";

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
    <div className="group bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-4 sm:gap-6 hover:border-indigo-500/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200">
      {/* Left: domain + meta + badges */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <Badge variant={tc.variant}>{tc.label}</Badge>
          {doFollow && <Badge variant="success">DoFollow</Badge>}
          {includesContent && <Badge variant="default">Content Included</Badge>}
        </div>
        <h3 className="font-bold text-zinc-900 dark:text-white text-base truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
          {domain}
        </h3>
        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
          <span>{site.niche}</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span>{site.country}</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{site.language}</span>
          {site.exampleUrl && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <a
                href={site.exampleUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" /> Example
              </a>
            </>
          )}
        </div>
      </div>

      {/* Middle: metrics */}
      {metrics ? (
        <div className="hidden md:flex items-center gap-5 shrink-0">
          {[
            { label: "DR", value: metrics.domainRating },
            { label: "DA", value: metrics.domainAuthority },
            { label: "Traffic", value: formatNumber(metrics.organicTraffic) },
            { label: "RD", value: formatNumber(metrics.referringDomains) },
          ].map((m) => (
            <div key={m.label} className="text-center min-w-[3rem]">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-0.5">{m.label}</p>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">{m.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="hidden md:block text-xs text-zinc-400 dark:text-zinc-600 shrink-0">
          Metrics pending
        </div>
      )}

      {/* Right: price + CTA */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="text-right">
          <p className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white leading-tight">{formatCurrency(price)}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{turnaroundDays}d delivery</p>
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
