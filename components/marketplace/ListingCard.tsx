"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { formatNumber, getDomainFromUrl } from "@/lib/utils";
import { ExternalLink, Star, FileText, Pencil, Link2, Info, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: {
    id: string;
    type: string;
    basePriceCents: number;
    finalPriceCents: number;
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

export function ListingCard({ listing }: ListingCardProps) {
  const { site, type, finalPriceCents, doFollow } = listing;
  const metrics = site.metrics;
  const domain = getDomainFromUrl(site.url);
  const countryInfo = getCountryDisplay(site.country);

  const [isStarred, setIsStarred] = useState(false);
  useEffect(() => {
    try {
      const starred = localStorage.getItem(`starred-${listing.id}`) === "true";
      setIsStarred(starred);
    } catch (e) {}
  }, [listing.id]);

  const toggleStar = () => {
    const next = !isStarred;
    setIsStarred(next);
    try {
      localStorage.setItem(`starred-${listing.id}`, String(next));
    } catch (e) {}
  };

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border-b border-zinc-200/60 dark:border-zinc-800/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300">
      {/* 1. Portal */}
      <td className="px-4 py-3.5 font-medium min-w-[180px]">
        <div className="flex items-center gap-2">
          <Link
            href={`/marketplace/${listing.id}`}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            {domain}
          </Link>
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

      {/* 2. Country */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="mr-1.5">{countryInfo.flag}</span>
        <span>{countryInfo.name}</span>
      </td>

      {/* 3. Language */}
      <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
        {site.language}
      </td>

      {/* 4. Main Category */}
      <td className="px-4 py-3.5">
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider",
          nicheColors[site.niche] ?? "bg-zinc-100 text-zinc-800 border-zinc-200"
        )}>
          {site.niche}
        </span>
      </td>

      {/* 5. Also Accepting */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          {type === "GUEST_POST" ? (
            <span title="Accepts Guest Posts">
              <FileText className="h-3.5 w-3.5 text-blue-600/70" />
            </span>
          ) : (
            <span title="Accepts Niche Edits">
              <Pencil className="h-3.5 w-3.5 text-emerald-600/70" />
            </span>
          )}
          {doFollow && (
            <span title="DoFollow Links">
              <Link2 className="h-3.5 w-3.5 text-purple-600/70" />
            </span>
          )}
        </div>
      </td>

      {/* 6. Ahrefs DR */}
      <td className="px-4 py-3.5 text-center">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-bold border border-amber-500/20 flex items-center justify-center mx-auto tabular-nums">
          {metrics?.domainRating ?? "—"}
        </div>
      </td>

      {/* 7. Ahrefs Traffic */}
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

      {/* 8. Referring Domains */}
      <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-center tabular-nums">
        {metrics ? formatNumber(metrics.referringDomains) : "—"}
      </td>

      {/* 9. MOZ DA */}
      <td className="px-4 py-3.5 text-center">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold border border-blue-500/20 flex items-center justify-center mx-auto tabular-nums">
          {metrics?.domainAuthority ?? "—"}
        </div>
      </td>

      {/* 10. MOZ SS */}
      <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-center tabular-nums">
        {metrics ? `${metrics.spamScore}%` : "—"}
      </td>

      {/* 11. Price */}
      <td className="px-4 py-3.5 text-zinc-900 dark:text-white font-bold whitespace-nowrap text-right tabular-nums">
        From {formatCents(finalPriceCents)}
      </td>

      {/* 12. Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={toggleStar}
            className={cn(
              "p-1.5 rounded-lg border transition-colors",
              isStarred
                ? "border-amber-400 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            )}
          >
            <Star className={cn("h-3.5 w-3.5", isStarred && "fill-amber-500")} />
          </button>
          
          <Link href={`/marketplace/${listing.id}`}>
            <button className="flex items-center gap-1 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors">
              <Info className="h-3 w-3" />
              <span>Info</span>
            </button>
          </Link>

          <Link href={`/marketplace/${listing.id}`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition-colors">
              Offers
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );
}
