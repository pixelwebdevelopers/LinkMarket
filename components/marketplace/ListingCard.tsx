import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, getDomainFromUrl } from "@/lib/utils";
import { ExternalLink, ArrowRight } from "lucide-react";

interface ListingCardProps {
  listing: {
    id: string;
    type: string;
    basePriceCents: number;
    finalPriceCents: number; // commission-adjusted, what the customer pays
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

function formatCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

const typeConfig: Record<string, { label: string; variant: "info" | "success" }> = {
  GUEST_POST: { label: "Guest Post", variant: "info" },
  NICHE_EDIT: { label: "Niche Edit", variant: "success" },
};

export function ListingCard({ listing }: ListingCardProps) {
  const { site, type, finalPriceCents, turnaroundDays, doFollow, includesContent } = listing;
  const metrics = site.metrics;
  const tc = typeConfig[type] ?? { label: type, variant: "info" as const };
  const domain = getDomainFromUrl(site.url);

  const metricCells = [
    { label: "DR", value: metrics?.domainRating ?? "—" },
    { label: "DA", value: metrics?.domainAuthority ?? "—" },
    { label: "Traffic", value: metrics ? formatNumber(metrics.organicTraffic) : "—" },
    { label: "Refs", value: metrics ? formatNumber(metrics.referringDomains) : "—" },
  ];

  return (
    <article
      className="group bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 sm:px-5 py-4 hover:border-indigo-500/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200
                 flex flex-col gap-3
                 md:grid md:grid-cols-[minmax(0,1fr)_repeat(4,64px)_110px_100px] md:gap-5 md:items-center"
    >
      {/* Site column */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-zinc-200 dark:border-zinc-800 grid place-items-center text-xs font-bold text-indigo-700 dark:text-indigo-400 shrink-0">
          {domain.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              {domain}
            </h3>
            <Badge variant={tc.variant} className="hidden lg:inline-flex">{tc.label}</Badge>
            {doFollow && <Badge variant="success" className="hidden lg:inline-flex">DoFollow</Badge>}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            {site.niche} · {site.country} · {site.language}
            {site.exampleUrl && (
              <>
                {" · "}
                <a
                  href={site.exampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-0.5 transition-colors"
                >
                  Example <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Mobile-only badge + content row */}
      <div className="flex flex-wrap gap-1.5 md:hidden">
        <Badge variant={tc.variant}>{tc.label}</Badge>
        {doFollow && <Badge variant="success">DoFollow</Badge>}
        {includesContent && <Badge variant="default">Content Included</Badge>}
      </div>

      {/* Mobile-only metric strip */}
      <div className="grid grid-cols-4 gap-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-xl px-2 py-2 md:hidden">
        {metricCells.map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-[9px] uppercase tracking-wide text-zinc-500 font-semibold">{m.label}</p>
            <p className="font-bold text-zinc-900 dark:text-white text-xs tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Desktop metric columns */}
      {metricCells.map((m) => (
        <div key={m.label} className="hidden md:block text-center">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm tabular-nums">{m.value}</p>
        </div>
      ))}

      {/* Price */}
      <div className="flex md:block items-baseline justify-between md:text-right">
        <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-none tabular-nums">
          {formatCents(finalPriceCents)}
        </p>
        <p className="text-[10px] text-zinc-500 md:mt-1">{turnaroundDays}d delivery</p>
      </div>

      {/* CTA */}
      <Link href={`/marketplace/${listing.id}`} className="block">
        <Button size="sm" className="w-full gap-1.5">
          View <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </article>
  );
}
