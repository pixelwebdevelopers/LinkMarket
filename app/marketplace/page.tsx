"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const NICHES = ["All Niches","Technology","Finance","Health","Travel","Food","Fashion","Sports","Education","Real Estate","SaaS","E-commerce","iGaming","Crypto","Marketing","Legal","Business"];
const LANGUAGES = ["All Languages","English","Spanish","French","German","Italian","Portuguese"];
const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "dr_desc", label: "DR: High → Low" },
  { value: "traffic_desc", label: "Traffic: High → Low" },
];
const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "GUEST_POST", label: "Guest Post" },
  { value: "NICHE_EDIT", label: "Niche Edit" },
];

interface Filters {
  type: string; niche: string; language: string;
  minDR: string; maxDR: string; minPrice: string; maxPrice: string;
  minTraffic: string; sortBy: string;
}
const defaultFilters: Filters = { type:"", niche:"", language:"", minDR:"", maxDR:"", minPrice:"", maxPrice:"", minTraffic:"", sortBy:"price_asc" };

interface ListingItem {
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
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const [prevFilters, setPrevFilters] = useState(filters);
  const [prevPage, setPrevPage] = useState(page);

  if (filters !== prevFilters || page !== prevPage) {
    setPrevFilters(filters);
    setPrevPage(page);
    setLoading(true);
  }

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20", sortBy: filters.sortBy });
      if (filters.type) params.set("type", filters.type);
      if (filters.niche && filters.niche !== "All Niches") params.set("niche", filters.niche);
      if (filters.language && filters.language !== "All Languages") params.set("language", filters.language);
      if (filters.minDR) params.set("minDR", filters.minDR);
      if (filters.maxDR) params.set("maxDR", filters.maxDR);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.minTraffic) params.set("minTraffic", filters.minTraffic);
      
      const res = await fetch(`/api/marketplace?${params}`);
      const data = await res.json();
      if (active) {
        setListings(data.listings ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [filters, page]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }
  function resetFilters() { setFilters(defaultFilters); setPage(1); }
  const hasActiveFilters = Object.entries(filters).some(([k, v]) => v !== "" && k !== "sortBy");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-10 py-5 px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Link Marketplace
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
              {total > 0 ? (
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-semibold">
                  {total.toLocaleString()} listings available
                </span>
              ) : (
                "Browse curated publisher listings"
              )}
            </p>
          </div>
          
          {/* Sorting and Filter Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
              className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl h-9.5 text-xs font-semibold px-4"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="rounded-xl h-9.5"
                title="Reset all filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Type selector tabs */}
        <div className="flex gap-1.5 p-1 bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl w-fit mb-6">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => updateFilter("type", t.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                filters.type === t.value
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm border border-zinc-200/40 dark:border-zinc-700/40"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters drawer panel */}
        {showFilters && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-6 shadow-xl shadow-zinc-900/5 dark:shadow-black/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 animate-scale-in">
            <Select
              label="Niche"
              options={NICHES.map((n) => ({ value: n, label: n }))}
              value={filters.niche || "All Niches"}
              onChange={(e) => updateFilter("niche", e.target.value)}
            />
            <Select
              label="Language"
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
              value={filters.language || "All Languages"}
              onChange={(e) => updateFilter("language", e.target.value)}
            />
            <Input
              label="Min DR"
              type="number"
              placeholder="0"
              value={filters.minDR}
              onChange={(e) => updateFilter("minDR", e.target.value)}
            />
            <Input
              label="Max DR"
              type="number"
              placeholder="100"
              value={filters.maxDR}
              onChange={(e) => updateFilter("maxDR", e.target.value)}
            />
            <Input
              label="Min Price"
              type="number"
              placeholder="$0"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
            />
            <Input
              label="Max Price"
              type="number"
              placeholder="Any"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
            />
            <Input
              label="Min Traffic"
              type="number"
              placeholder="0"
              value={filters.minTraffic}
              onChange={(e) => updateFilter("minTraffic", e.target.value)}
            />
          </div>
        )}

        {/* Tabular List View */}
        {loading ? (
          <div className="overflow-x-auto scrollbar-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Portal</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Also Accepting</th>
                  <th className="px-4 py-3 text-center">DR</th>
                  <th className="px-4 py-3 text-center">Traffic</th>
                  <th className="px-4 py-3 text-center">RD</th>
                  <th className="px-4 py-3 text-center">DA</th>
                  <th className="px-4 py-3 text-center">SS</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-200/60 dark:border-zinc-800/60">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-4 py-4.5">
                        <div className="h-4 bg-zinc-100 dark:bg-zinc-800/80 rounded animate-pulse w-full max-w-[80px]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-900/5">
            <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-950 dark:text-white font-semibold text-lg mb-2">No listings found</p>
            <p className="text-zinc-500 text-sm mb-6">Try adjusting your filters or browse all listings</p>
            <Button variant="outline" onClick={resetFilters} className="rounded-xl">Reset Filters</Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/5 dark:shadow-black/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3">Portal</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Also Accepting</th>
                    <th className="px-4 py-3 text-center">DR</th>
                    <th className="px-4 py-3 text-center">Traffic</th>
                    <th className="px-4 py-3 text-center">RD</th>
                    <th className="px-4 py-3 text-center">DA</th>
                    <th className="px-4 py-3 text-center">SS</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl"
                >
                  ← Previous
                </Button>
                <span className="text-xs font-semibold text-zinc-500">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl"
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
