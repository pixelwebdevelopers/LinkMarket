"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { Save, CheckCircle } from "lucide-react";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";

export default function AdminMetricsPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then((data) => {
        setSites(data);
        const initial: Record<string, any> = {};
        data.forEach((site: any) => {
          initial[site.id] = {
            domainRating: site.metrics?.domainRating ?? 0,
            domainAuthority: site.metrics?.domainAuthority ?? 0,
            organicTraffic: site.metrics?.organicTraffic ?? 0,
            referringDomains: site.metrics?.referringDomains ?? 0,
            spamScore: site.metrics?.spamScore ?? 0,
          };
        });
        setMetrics(initial);
        setLoading(false);
      });
  }, []);

  function updateMetric(siteId: string, field: string, value: string) {
    setMetrics((prev) => ({
      ...prev,
      [siteId]: { ...prev[siteId], [field]: parseFloat(value) || 0 },
    }));
  }

  async function saveSite(siteId: string) {
    setSaving(siteId);
    await fetch("/api/admin/metrics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, ...metrics[siteId] }),
    });
    setSaving(null);
    setSaved(siteId);
    setTimeout(() => setSaved(null), 2000);
  }

  const filtered = sites.filter((s) =>
    getDomainFromUrl(s.url).toLowerCase().includes(search.toLowerCase()) ||
    s.niche?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <PageContainer>
      <div className="h-96 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
    </PageContainer>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Update site metrics"
        description={`Refresh DR, DA, traffic and referring domains. ${sites.length} sites total.`}
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by domain or niche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((site) => (
          <div key={site.id} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-white text-sm">{getDomainFromUrl(site.url)}</span>
                  <Badge
                    variant={
                      site.status === "APPROVED" ? "success" :
                      site.status === "PENDING" ? "warning" : "danger"
                    }
                  >
                    {site.status}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {site.niche} · {site.language} ·{" "}
                  {site.metrics?.updatedAt
                    ? `Last updated: ${formatDate(site.metrics.updatedAt)}`
                    : "Never updated"}
                </p>
              </div>
              <Button
                size="sm"
                variant={saved === site.id ? "secondary" : "primary"}
                onClick={() => saveSite(site.id)}
                loading={saving === site.id}
              >
                {saved === site.id ? (
                  <><CheckCircle className="h-4 w-4" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4" /> Save</>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { key: "domainRating", label: "DR (0-100)" },
                { key: "domainAuthority", label: "DA (0-100)" },
                { key: "organicTraffic", label: "Organic Traffic" },
                { key: "referringDomains", label: "Ref. Domains" },
                { key: "spamScore", label: "Spam Score (0-17)" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-zinc-500 mb-1">{field.label}</label>
                  <input
                    type="number"
                    value={metrics[site.id]?.[field.key] ?? 0}
                    onChange={(e) => updateMetric(site.id, field.key, e.target.value)}
                    className="w-full rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-zinc-200 dark:focus:bg-zinc-800 transition-all duration-200"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
