"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { formatNumber, getDomainFromUrl } from "@/lib/utils";
import { ExternalLink, Star, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Listing {
  id: string;
  type: string;
  basePriceCents: number;
  finalPriceCents: number;
  turnaroundDays: number;
  doFollow: boolean;
  includesContent: boolean;
  wordCount?: number | null;
  extraNotes?: string | null;
}

interface ListingCardProps {
  site: {
    id: string;
    url: string;
    name: string;
    niche: string;
    language: string;
    country: string;
    exampleUrl?: string | null;
    description?: string | null;
    metrics?: {
      domainRating: number;
      domainAuthority: number;
      organicTraffic: number;
      referringDomains: number;
      spamScore: number;
    } | null;
    listings: Listing[];
  };
}

function formatCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

const getCountryDisplay = (codeOrName: string) => {
  const norm = codeOrName.trim().toUpperCase();
  const map: Record<string, { name: string; flag: string }> = {
    US: { name: "United States", flag: "🇺🇸" },
    USA: { name: "United States", flag: "🇺🇸" },
    "UNITED STATES": { name: "United States", flag: "🇺🇸" },
    GB: { name: "United Kingdom", flag: "🇬🇧" },
    UK: { name: "United Kingdom", flag: "🇬🇧" },
    "UNITED KINGDOM": { name: "United Kingdom", flag: "🇬🇧" },
    CA: { name: "Canada", flag: "🇨🇦" },
    CANADA: { name: "Canada", flag: "🇨🇦" },
    AU: { name: "Australia", flag: "🇦🇺" },
    AUSTRALIA: { name: "Australia", flag: "🇦🇺" },
    DE: { name: "Germany", flag: "🇩🇪" },
    GERMANY: { name: "Germany", flag: "🇩🇪" },
    FR: { name: "France", flag: "🇫🇷" },
    FRANCE: { name: "France", flag: "🇫🇷" },
    ES: { name: "Spain", flag: "🇪🇸" },
    SPAIN: { name: "Spain", flag: "🇪🇸" },
    IT: { name: "Italy", flag: "🇮🇹" },
    ITALY: { name: "Italy", flag: "🇮🇹" },
    IN: { name: "India", flag: "🇮🇳" },
    INDIA: { name: "India", flag: "🇮🇳" },
  };
  return map[norm] ?? { name: codeOrName, flag: "🌐" };
};

const nicheColors: Record<string, string> = {
  Technology: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/20",
  Finance: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20",
  Health: "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20",
  Travel: "bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border-teal-500/20",
  Food: "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-500/20",
  Fashion: "bg-pink-500/10 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300 border-pink-500/20",
  Sports: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-500/20",
  Education: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-500/20",
  "News & Media": "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-500/20",
  Gaming: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/20",
  Parenting: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-500/20",
  Business: "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 border-violet-500/20",
};

export function ListingCard({ site }: ListingCardProps) {
  const metrics = site.metrics;
  const domain = getDomainFromUrl(site.url);
  const countryInfo = getCountryDisplay(site.country);

  const [isStarred, setIsStarred] = useState(false);
  useEffect(() => {
    try {
      const starred = localStorage.getItem(`starred-${site.id}`) === "true";
      setTimeout(() => {
        setIsStarred(starred);
      }, 0);
    } catch {
      // Ignore localStorage block
    }
  }, [site.id]);

  const toggleStar = () => {
    const next = !isStarred;
    setIsStarred(next);
    try {
      localStorage.setItem(`starred-${site.id}`, String(next));
    } catch {
      // Ignore localStorage block
    }
  };

  const gpListing = site.listings.find((l) => l.type === "GUEST_POST");
  const neListing = site.listings.find((l) => l.type === "NICHE_EDIT");

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border-b border-zinc-200/60 dark:border-zinc-800/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300">
      {/* 1. Portal (Site Name) */}
      <td className="px-4 py-3.5 font-medium min-w-[180px]">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleStar}
            className={cn(
              "p-1 rounded-lg transition-colors border",
              isStarred
                ? "border-amber-400 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            )}
          >
            <Star className={cn("h-3.5 w-3.5", isStarred && "fill-amber-500")} />
          </button>
          <span className="font-semibold text-zinc-950 dark:text-white">{domain}</span>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </td>

      {/* 2. Traffic */}
      <td className="px-4 py-3.5 font-semibold text-center tabular-nums">
        {metrics ? (
          <div className="inline-flex items-center gap-1">
            <span>{formatNumber(metrics.organicTraffic)}</span>
            <ArrowUpRight className="h-3 w-3 text-blue-500" />
          </div>
        ) : (
          "—"
        )}
      </td>

      {/* 3. DR */}
      <td className="px-4 py-3.5 text-center">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-bold border border-amber-500/20 flex items-center justify-center mx-auto tabular-nums">
          {metrics?.domainRating ?? "—"}
        </div>
      </td>

      {/* 4. Referring Domains (RD) */}
      <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-center tabular-nums">
        {metrics ? formatNumber(metrics.referringDomains) : "—"}
      </td>

      {/* 5. MOZ DA */}
      <td className="px-4 py-3.5 text-center">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold border border-blue-500/20 flex items-center justify-center mx-auto tabular-nums">
          {metrics?.domainAuthority ?? "—"}
        </div>
      </td>

      {/* 6. MOZ SS */}
      <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-center tabular-nums">
        {metrics ? `${metrics.spamScore}%` : "—"}
      </td>

      {/* 7. Category */}
      <td className="px-4 py-3.5">
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider",
          nicheColors[site.niche] ?? "bg-zinc-100 text-zinc-800 border-zinc-200"
        )}>
          {site.niche}
        </span>
      </td>

      {/* 8. Country */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="mr-1.5">{countryInfo.flag}</span>
        <span>{countryInfo.name}</span>
      </td>

      {/* 9. Guest Post Price & Buy Button */}
      <td className="px-4 py-3.5 text-right font-medium">
        {gpListing ? (
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
              {formatCents(gpListing.finalPriceCents)}
            </span>
            <Link href={`/marketplace/${gpListing.id}`}>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm transition-colors cursor-pointer">
                Buy Guest Post
              </button>
            </Link>
          </div>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-600 italic">Not Offered</span>
        )}
      </td>

      {/* 10. Niche Edit Price & Buy Button */}
      <td className="px-4 py-3.5 text-right font-medium">
        {neListing ? (
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
              {formatCents(neListing.finalPriceCents)}
            </span>
            <Link href={`/marketplace/${neListing.id}`}>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm transition-colors cursor-pointer">
                Buy Niche Edit
              </button>
            </Link>
          </div>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-600 italic">Not Offered</span>
        )}
      </td>
    </tr>
  );
}
