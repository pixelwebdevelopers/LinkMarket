"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDomainFromUrl } from "@/lib/utils";
import { Globe, PlusCircle, CheckCircle } from "lucide-react";

const statusVariant: Record<string, any> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function SubmittedBanner() {
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted") === "true";
  if (!submitted) return null;
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 mb-6 animate-scale-in">
      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
      <div>
        <p className="font-semibold text-emerald-800 dark:text-emerald-200">Site submitted for review!</p>
        <p className="text-sm">We&apos;ll review it within 48 hours and notify you by email.</p>
      </div>
    </div>
  );
}

export default function ResellerSitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reseller/sites")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setSites(d);
        else setError(d?.error ?? "Failed to load sites");
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse h-64 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Sites</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Sites you've listed on the marketplace</p>
          </div>
          <Link href="/reseller/new">
            <Button size="sm">
              <PlusCircle className="h-4 w-4" /> Add Site
            </Button>
          </Link>
        </div>

        <Suspense>
          <SubmittedBanner />
        </Suspense>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {sites.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="font-semibold text-zinc-900 dark:text-white">No sites yet</p>
            <p className="text-sm mt-1 text-zinc-500">Submit your first site to start earning.</p>
            <Link href="/reseller/new">
              <Button className="mt-4">Submit a Site</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map((site: any) => (
              <div key={site.id} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 lift hover:border-indigo-500/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={statusVariant[site.status] ?? "default"}>{site.status}</Badge>
                      <span className="text-xs text-zinc-500">{site.niche}</span>
                      {site.rejectionReason && (
                        <span className="text-xs text-red-700 dark:text-red-400">Reason: {site.rejectionReason}</span>
                      )}
                    </div>
                    <h2 className="font-semibold text-zinc-900 dark:text-white">{getDomainFromUrl(site.url)}</h2>
                    {site.metrics && (
                      <div className="flex gap-4 mt-2 text-xs text-zinc-500 flex-wrap">
                        <span>DR: <strong className="text-zinc-700 dark:text-zinc-300">{site.metrics.domainRating}</strong></span>
                        <span>DA: <strong className="text-zinc-700 dark:text-zinc-300">{site.metrics.domainAuthority}</strong></span>
                        <span>Traffic: <strong className="text-zinc-700 dark:text-zinc-300">{site.metrics.organicTraffic?.toLocaleString()}</strong></span>
                        <span>RD: <strong className="text-zinc-700 dark:text-zinc-300">{site.metrics.referringDomains?.toLocaleString()}</strong></span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-zinc-500">{site.listings?.length ?? 0} packages</p>
                  </div>
                </div>

                {site.listings?.length > 0 && (
                  <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 grid sm:grid-cols-3 gap-3">
                    {site.listings.map((l: any) => (
                      <div key={l.id} className="bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300/50 dark:border-zinc-700/50 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {l.type.replace("_", " ")}
                          </span>
                          <span className="font-semibold text-zinc-900 dark:text-white text-sm">{formatCents(l.basePriceCents)}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          Base price (you earn). {l.turnaroundDays}d delivery · {l.doFollow ? "DoFollow" : "NoFollow"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
