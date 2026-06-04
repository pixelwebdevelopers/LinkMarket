"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { BarChart2, Users, Globe, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";

export default function AdminPage() {
  const { data: session } = useSession();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics").then((r) => r.json()).then((d) => { setSites(d); setLoading(false); });
  }, []);

  async function updateSiteStatus(siteId: string, status: string) {
    setUpdating(siteId);
    const res = await fetch(`/api/admin/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setSites((prev) => prev.map((s) => s.id === siteId ? { ...s, status: updated.status } : s));
    setUpdating(null);
  }

  const pending = sites.filter((s) => s.status === "PENDING");
  const approved = sites.filter((s) => s.status === "APPROVED");
  const role = session?.user?.role;

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 max-w-6xl mx-auto px-4 py-10 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {role === "ADMIN" ? "Admin Panel" : "Admin Panel"}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Manage resellers, sites and metrics</p>
          </div>
          <Link href="/admin/metrics">
            <Button variant="outline" size="sm"><BarChart2 className="h-4 w-4" /> Update Metrics</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Sites", value: sites.length, icon: Globe, color: "text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
            { label: "Pending Review", value: pending.length, icon: Clock, color: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
            { label: "Approved Sites", value: approved.length, icon: CheckCircle, color: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
            { label: "Owners", value: new Set(sites.map((s) => s.ownerId)).size, icon: Users, color: "text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-white text-lg mb-4 flex items-center gap-2">
              Pending Reviews
              <span className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-center font-bold">{pending.length}</span>
            </h2>
            <div className="space-y-3">
              {pending.map((site) => (
                <div key={site.id} className="bg-zinc-100 dark:bg-zinc-900 border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="warning">Pending Review</Badge>
                        <span className="text-xs text-zinc-500">{site.niche} · {site.language}</span>
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white">{getDomainFromUrl(site.url)}</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Submitted: {formatDate(site.createdAt)} · {site.owner?.email} ({site.owner?.role})
                      </p>
                      {site.description && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{site.description}</p>}
                      <div className="flex gap-4 mt-3">
                        <a href={site.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-700 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                          <ExternalLink className="h-3 w-3" /> Visit site
                        </a>
                        {site.exampleUrl && (
                          <a href={site.exampleUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-700 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            <ExternalLink className="h-3 w-3" /> Example link
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="success" onClick={() => updateSiteStatus(site.id, "APPROVED")} loading={updating === site.id}>
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => updateSiteStatus(site.id, "REJECTED")} loading={updating === site.id}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All sites table */}
        <div>
          <h2 className="font-bold text-zinc-900 dark:text-white text-lg mb-4">All Sites</h2>
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  {["Site", "Niche", "DR", "Traffic", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sites.map((site) => (
                  <tr key={site.id} className="hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{getDomainFromUrl(site.url)}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{site.niche}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{site.metrics?.domainRating ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{site.metrics?.organicTraffic?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={site.status === "APPROVED" ? "success" : site.status === "PENDING" ? "warning" : "danger"}>
                        {site.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {site.status !== "APPROVED" && (
                          <button onClick={() => updateSiteStatus(site.id, "APPROVED")}
                            className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">Approve</button>
                        )}
                        {site.status === "APPROVED" && (
                          <button onClick={() => updateSiteStatus(site.id, "SUSPENDED")}
                            className="text-xs text-red-700 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors">Suspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
