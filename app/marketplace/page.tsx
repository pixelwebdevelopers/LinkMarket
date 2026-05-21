"use client";

import { useEffect, useState, useCallback } from "react";
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
  { value: "TIER2", label: "Tier 2" },
];

interface Filters {
  type: string; niche: string; language: string;
  minDR: string; maxDR: string; minPrice: string; maxPrice: string;
  minTraffic: string; sortBy: string;
}
const defaultFilters: Filters = { type:"", niche:"", language:"", minDR:"", maxDR:"", minPrice:"", maxPrice:"", minTraffic:"", sortBy:"price_asc" };

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const fetchListings = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20", sortBy: f.sortBy });
    if (f.type) params.set("type", f.type);
    if (f.niche && f.niche !== "All Niches") params.set("niche", f.niche);
    if (f.language && f.language !== "All Languages") params.set("language", f.language);
    if (f.minDR) params.set("minDR", f.minDR);
    if (f.maxDR) params.set("maxDR", f.maxDR);
    if (f.minPrice) params.set("minPrice", f.minPrice);
    if (f.maxPrice) params.set("maxPrice", f.maxPrice);
    if (f.minTraffic) params.set("minTraffic", f.minTraffic);
    const res = await fetch(`/api/marketplace?${params}`);
    const data = await res.json();
    setListings(data.listings ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, []);

  useEffect(() => { fetchListings(filters, page); }, [filters, page, fetchListings]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }
  function resetFilters() { setFilters(defaultFilters); setPage(1); }
  const hasActiveFilters = Object.entries(filters).some(([k, v]) => v !== "" && k !== "sortBy");

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-1">Link Marketplace</h1>
          <p className="text-zinc-400 text-sm">
            {total > 0 ? <>{total.toLocaleString()} listings available</> : "Browse curated publisher listings"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Type tabs */}
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map((t) => (
                <button key={t.value} onClick={() => updateFilter("type", t.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150",
                    filters.type === t.value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              <select value={filters.sortBy} onChange={(e) => updateFilter("sortBy", e.target.value)}
                className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Button variant={showFilters ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
              </Button>
              {hasActiveFilters && <Button variant="ghost" size="sm" onClick={resetFilters}><X className="h-4 w-4" /></Button>}
            </div>
          </div>

          {showFilters && (
            <div className="border-t border-zinc-800 pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <Select label="Niche" options={NICHES.map((n) => ({ value: n, label: n }))}
                value={filters.niche || "All Niches"} onChange={(e) => updateFilter("niche", e.target.value)} />
              <Select label="Language" options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                value={filters.language || "All Languages"} onChange={(e) => updateFilter("language", e.target.value)} />
              <Input label="Min DR" type="number" placeholder="0" value={filters.minDR} onChange={(e) => updateFilter("minDR", e.target.value)} />
              <Input label="Max DR" type="number" placeholder="100" value={filters.maxDR} onChange={(e) => updateFilter("maxDR", e.target.value)} />
              <Input label="Min Price" type="number" placeholder="$0" value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)} />
              <Input label="Max Price" type="number" placeholder="Any" value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} />
              <Input label="Min Traffic" type="number" placeholder="0" value={filters.minTraffic} onChange={(e) => updateFilter("minTraffic", e.target.value)} />
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">No listings found</p>
            <p className="text-zinc-500 text-sm mb-6">Try adjusting your filters or browse all listings</p>
            <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Previous</Button>
                <span className="text-sm text-zinc-400">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
