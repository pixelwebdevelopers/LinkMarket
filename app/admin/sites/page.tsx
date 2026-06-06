"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { StatCard } from "@/components/panel/StatCard";
import { EmptyState } from "@/components/panel/EmptyState";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { Globe, PlusCircle, CheckCircle, XCircle, ExternalLink, Pencil, X } from "lucide-react";

interface Site {
  id: string;
  url: string;
  name: string;
  niche: string;
  language: string;
  country: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  exampleUrl: string | null;
  description: string | null;
  commissionPctOverride: number | null;
  createdAt: string;
  metrics: any;
  owner: { id: string; name: string | null; email: string; role: string };
}

type Filter = "all" | "pending" | "approved" | "rejected" | "suspended" | "admin" | "reseller";

export default function AdminSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<Site | null>(null);
  const [rejectFor, setRejectFor] = useState<Site | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/metrics");
    const data = await res.json();
    setSites(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = sites;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          getDomainFromUrl(s.url).toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.niche.toLowerCase().includes(q) ||
          s.owner.email.toLowerCase().includes(q)
      );
    }
    if (filter === "pending") list = list.filter((s) => s.status === "PENDING");
    else if (filter === "approved") list = list.filter((s) => s.status === "APPROVED");
    else if (filter === "rejected") list = list.filter((s) => s.status === "REJECTED");
    else if (filter === "suspended") list = list.filter((s) => s.status === "SUSPENDED");
    else if (filter === "admin") list = list.filter((s) => s.owner.role === "ADMIN");
    else if (filter === "reseller") list = list.filter((s) => s.owner.role === "RESELLER");
    return list;
  }, [sites, search, filter]);

  const counts = useMemo(
    () => ({
      total: sites.length,
      pending: sites.filter((s) => s.status === "PENDING").length,
      approved: sites.filter((s) => s.status === "APPROVED").length,
      rejected: sites.filter((s) => s.status === "REJECTED").length,
    }),
    [sites]
  );

  async function act(siteId: string, body: any) {
    setBusy(siteId);
    setError("");
    const res = await fetch(`/api/admin/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    setEditingCommission(null);
    setRejectFor(null);
    load();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sites"
        description="All publisher sites on the platform — admin's own plus reseller submissions."
        actions={
          <Link href="/admin/sites/new">
            <Button>
              <PlusCircle className="h-4 w-4" /> Add site
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={counts.total} accent="indigo" Icon={Globe} />
        <StatCard label="Pending review" value={counts.pending} accent="amber" />
        <StatCard label="Approved" value={counts.approved} accent="emerald" />
        <StatCard label="Rejected / Suspended" value={counts.rejected + (sites.filter(s => s.status === 'SUSPENDED').length)} accent="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {([
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
            { key: "suspended", label: "Suspended" },
            { key: "admin", label: "Mine" },
            { key: "reseller", label: "Resellers" },
          ] as { key: Filter; label: string }[]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === f.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto w-full sm:w-72">
          <Input
            placeholder="Search domain, niche, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <EmptyState
          Icon={Globe}
          title="No sites match this view"
          description="Try a different filter or clear the search."
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                {["Site", "Owner", "Niche", "DR", "Traffic", "Commission", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-zinc-900 dark:text-white truncate">{getDomainFromUrl(s.url)}</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-indigo-700 dark:hover:text-indigo-400"
                        title="Open site"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">Added {formatDate(s.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-zinc-700 dark:text-zinc-300 text-xs">{s.owner.email}</p>
                    <Badge variant={s.owner.role === "ADMIN" ? "manager" : "success"} className="text-[10px] mt-0.5">
                      {s.owner.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.niche}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 tabular-nums">{s.metrics?.domainRating ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 tabular-nums">
                    {s.metrics?.organicTraffic ? s.metrics.organicTraffic.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingCommission(s)}
                      className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      {s.commissionPctOverride !== null ? `${s.commissionPctOverride}%` : "Default"}
                      <Pencil className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        s.status === "APPROVED"
                          ? "success"
                          : s.status === "PENDING"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {s.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => act(s.id, { status: "APPROVED" })}
                            loading={busy === s.id}
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setRejectFor(s)}>
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        </>
                      )}
                      {s.status === "APPROVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(s.id, { status: "SUSPENDED" })}
                          loading={busy === s.id}
                        >
                          Suspend
                        </Button>
                      )}
                      {(s.status === "REJECTED" || s.status === "SUSPENDED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(s.id, { status: "APPROVED" })}
                          loading={busy === s.id}
                        >
                          Reinstate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingCommission && (
        <CommissionModal
          site={editingCommission}
          busy={busy === editingCommission.id}
          onClose={() => setEditingCommission(null)}
          onSubmit={(pct) => act(editingCommission.id, { commissionPctOverride: pct })}
        />
      )}
      {rejectFor && (
        <RejectModal
          site={rejectFor}
          busy={busy === rejectFor.id}
          onClose={() => setRejectFor(null)}
          onSubmit={(reason) => act(rejectFor.id, { status: "REJECTED", rejectionReason: reason })}
        />
      )}
    </PageContainer>
  );
}

function CommissionModal({
  site,
  busy,
  onClose,
  onSubmit,
}: {
  site: Site;
  busy: boolean;
  onClose: () => void;
  onSubmit: (pct: number | null) => void;
}) {
  const [pct, setPct] = useState(site.commissionPctOverride !== null ? String(site.commissionPctOverride) : "");
  return (
    <Modal title={`Commission override · ${getDomainFromUrl(site.url)}`} onClose={onClose}>
      <Input
        type="number"
        step="0.5"
        min={0}
        max={200}
        value={pct}
        onChange={(e) => setPct(e.target.value)}
        label="Commission %"
        hint="Leave blank to inherit from reseller default or global setting."
      />
      <div className="flex gap-2">
        <Button onClick={() => onSubmit(pct === "" ? null : parseFloat(pct))} loading={busy}>
          Save
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

function RejectModal({
  site,
  busy,
  onClose,
  onSubmit,
}: {
  site: Site;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={`Reject · ${getDomainFromUrl(site.url)}`} onClose={onClose}>
      <div>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Reason (shown to reseller)</p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="danger" onClick={() => onSubmit(reason)} loading={busy} disabled={!reason}>
          Reject site
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}
