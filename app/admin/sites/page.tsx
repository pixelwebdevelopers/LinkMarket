"use client";

import { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { StatCard } from "@/components/panel/StatCard";
import { EmptyState } from "@/components/panel/EmptyState";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { Globe, PlusCircle, CheckCircle, XCircle, ExternalLink, Pencil, X, BarChart3, Trash2, MoreHorizontal } from "lucide-react";

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
  commissionCentsOverride: number | null;
  createdAt: string;
  metrics: any;
  listings?: any[];
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
  const [editingMetrics, setEditingMetrics] = useState<Site | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/sites");
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
    setEditingSite(null);
    load();
  }

  async function saveMetrics(siteId: string, body: any) {
    setBusy(siteId);
    setError("");
    const res = await fetch(`/api/admin/metrics`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, ...body }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    setEditingMetrics(null);
    load();
  }

  async function deleteSite(siteId: string, force = false) {
    setBusy(siteId);
    setError("");
    const res = await fetch(`/api/admin/sites/${siteId}${force ? "?force=1" : ""}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to delete");
      return;
    }
    setDeletingSite(null);
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
                    <Badge variant={s.owner.role === "ADMIN" ? "admin" : "success"} className="text-[10px] mt-0.5">
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
                      {s.commissionCentsOverride !== null
                        ? `$${(s.commissionCentsOverride / 100).toFixed(2)}`
                        : "Default"}
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
                    <div className="flex gap-1.5 items-center justify-end">
                      {/* primary status action */}
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

                      {/* secondary actions menu (portaled — escapes the table's overflow-hidden) */}
                      <RowMenu
                        isOpen={menuOpen === s.id}
                        onOpen={() => setMenuOpen(s.id)}
                        onClose={() => setMenuOpen(null)}
                      >
                        <MenuItem
                          Icon={BarChart3}
                          label="Edit metrics"
                          onClick={() => {
                            setMenuOpen(null);
                            setEditingMetrics(s);
                          }}
                        />
                        <MenuItem
                          Icon={Pencil}
                          label="Edit site details"
                          onClick={() => {
                            setMenuOpen(null);
                            setEditingSite(s);
                          }}
                        />
                        <MenuItem
                          Icon={Pencil}
                          label="Commission override"
                          onClick={() => {
                            setMenuOpen(null);
                            setEditingCommission(s);
                          }}
                        />
                        {s.status === "APPROVED" && (
                          <MenuItem
                            Icon={ExternalLink}
                            label="View listings"
                            href={`/marketplace?siteSearch=${encodeURIComponent(getDomainFromUrl(s.url))}`}
                            onClick={() => setMenuOpen(null)}
                          />
                        )}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
                        <MenuItem
                          Icon={Trash2}
                          label="Delete site"
                          danger
                          onClick={() => {
                            setMenuOpen(null);
                            setDeletingSite(s);
                          }}
                        />
                      </RowMenu>
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
          onSubmit={(cents) => act(editingCommission.id, { commissionCentsOverride: cents })}
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
      {editingMetrics && (
        <MetricsModal
          site={editingMetrics}
          busy={busy === editingMetrics.id}
          onClose={() => setEditingMetrics(null)}
          onSubmit={(metrics) => saveMetrics(editingMetrics.id, metrics)}
        />
      )}
      {editingSite && (
        <EditSiteModal
          site={editingSite}
          busy={busy === editingSite.id}
          onClose={() => setEditingSite(null)}
          onSubmit={(fields) => act(editingSite.id, fields)}
        />
      )}
      {deletingSite && (
        <DeleteModal
          site={deletingSite}
          busy={busy === deletingSite.id}
          error={error}
          onClose={() => setDeletingSite(null)}
          onConfirm={(force) => deleteSite(deletingSite.id, force)}
        />
      )}
    </PageContainer>
  );
}

function MenuItem({
  Icon,
  label,
  onClick,
  href,
  danger,
}: {
  Icon: any;
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}) {
  const cls = `flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors ${
    danger
      ? "text-red-700 dark:text-red-400 hover:bg-red-500/10"
      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
  }`;
  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
    </button>
  );
}

/**
 * Kebab trigger + portaled dropdown. The dropdown is rendered into document.body
 * so it isn't clipped by ancestor overflow (e.g. the table card's overflow-hidden).
 * Position is computed from the trigger's bounding rect; if the menu would overflow
 * the viewport's right edge, it aligns to the right of the trigger. If it would
 * overflow the bottom, it opens upward.
 */
function RowMenu({
  isOpen,
  onOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current) return;
    function place() {
      const rect = btnRef.current!.getBoundingClientRect();
      const menuW = 208; // w-52
      const menuH = 280; // approximate; we let it auto-size but reserve room
      const gap = 6;
      let left = rect.right - menuW; // right-align with the trigger
      if (left < 8) left = 8;
      let top = rect.bottom + gap;
      if (top + menuH > window.innerHeight - 8) {
        // open upward instead
        top = rect.top - gap - menuH;
        if (top < 8) top = 8;
      }
      setPos({ top, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (isOpen ? onClose() : onOpen())}
        className="h-8 w-8 grid place-items-center rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {mounted && isOpen && pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={onClose} />
            <div
              role="menu"
              style={{ top: pos.top, left: pos.left }}
              className="fixed w-52 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-zinc-900/12 dark:shadow-black/40 py-1 z-[70] animate-scale-in origin-top-right"
            >
              {children}
            </div>
          </>,
          document.body
        )}
    </>
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
  onSubmit: (cents: number | null) => void;
}) {
  const [usd, setUsd] = useState(
    site.commissionCentsOverride !== null ? (site.commissionCentsOverride / 100).toFixed(2) : ""
  );
  return (
    <Modal title={`Commission override · ${getDomainFromUrl(site.url)}`} onClose={onClose}>
      <Input
        type="number"
        step="0.01"
        min={0}
        value={usd}
        onChange={(e) => setUsd(e.target.value)}
        label="Commission (USD)"
        hint="Flat amount added on top of the reseller's base price for this site. Leave blank to inherit from reseller default or global setting."
      />
      <div className="flex gap-2">
        <Button
          onClick={() => onSubmit(usd === "" ? null : Math.round(parseFloat(usd) * 100))}
          loading={busy}
        >
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

function MetricsModal({
  site,
  busy,
  onClose,
  onSubmit,
}: {
  site: Site;
  busy: boolean;
  onClose: () => void;
  onSubmit: (m: {
    domainRating: number;
    domainAuthority: number;
    organicTraffic: number;
    referringDomains: number;
    spamScore: number;
  }) => void;
}) {
  const m = site.metrics ?? {};
  const [dr, setDr] = useState(String(m.domainRating ?? 0));
  const [da, setDa] = useState(String(m.domainAuthority ?? 0));
  const [traffic, setTraffic] = useState(String(m.organicTraffic ?? 0));
  const [rd, setRd] = useState(String(m.referringDomains ?? 0));
  const [spam, setSpam] = useState(String(m.spamScore ?? 0));

  return (
    <Modal title={`Metrics · ${getDomainFromUrl(site.url)}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Input label="DR (0–100)" type="number" min={0} max={100} value={dr} onChange={(e) => setDr(e.target.value)} />
        <Input label="DA (0–100)" type="number" min={0} max={100} value={da} onChange={(e) => setDa(e.target.value)} />
        <Input label="Organic Traffic" type="number" min={0} value={traffic} onChange={(e) => setTraffic(e.target.value)} />
        <Input label="Referring Domains" type="number" min={0} value={rd} onChange={(e) => setRd(e.target.value)} />
        <Input label="Spam Score (0–17)" type="number" min={0} max={17} step={0.1} value={spam} onChange={(e) => setSpam(e.target.value)} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          onClick={() =>
            onSubmit({
              domainRating: parseFloat(dr) || 0,
              domainAuthority: parseFloat(da) || 0,
              organicTraffic: parseInt(traffic) || 0,
              referringDomains: parseInt(rd) || 0,
              spamScore: parseFloat(spam) || 0,
            })
          }
          loading={busy}
        >
          Save metrics
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

function EditSiteModal({
  site,
  busy,
  onClose,
  onSubmit,
}: {
  site: Site;
  busy: boolean;
  onClose: () => void;
  onSubmit: (fields: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<"details" | "packages">("details");

  const [form, setForm] = useState({
    name: site.name,
    url: site.url,
    niche: site.niche,
    language: site.language,
    country: site.country,
    exampleUrl: site.exampleUrl ?? "",
    description: site.description ?? "",
  });

  const [listings, setListings] = useState<any[]>(
    site.listings?.map((l: any) => ({
      id: l.id,
      type: l.type,
      price: String(l.basePriceCents / 100),
      turnaroundDays: String(l.turnaroundDays),
      doFollow: l.doFollow,
      includesContent: l.includesContent,
      wordCount: String(l.wordCount ?? 500),
      extraNotes: l.extraNotes ?? "",
    })) || []
  );

  function update(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function updateListing(index: number, field: string, value: any) {
    setListings((p) => p.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addListing() {
    const existingTypes = listings.map((l) => l.type);
    const available = ["GUEST_POST", "NICHE_EDIT"].filter((t) => !existingTypes.includes(t));
    if (available.length === 0) return;
    setListings((p) => [
      ...p,
      {
        type: available[0],
        price: "",
        turnaroundDays: "3",
        doFollow: true,
        includesContent: false,
        wordCount: "500",
        extraNotes: "",
      },
    ]);
  }

  function removeListing(index: number) {
    setListings((p) => p.filter((_, i) => i !== index));
  }

  return (
    <Modal title={`Edit Site · ${getDomainFromUrl(site.url)}`} onClose={onClose}>
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "details"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          General Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("packages")}
          className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "packages"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Pricing Packages ({listings.length})
        </button>
      </div>

      {activeTab === "details" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Site name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            <Input label="Site URL" type="url" value={form.url} onChange={(e) => update("url", e.target.value)} />
            <Input label="Niche" value={form.niche} onChange={(e) => update("niche", e.target.value)} />
            <Input label="Language" value={form.language} onChange={(e) => update("language", e.target.value)} />
            <Input label="Country" value={form.country} onChange={(e) => update("country", e.target.value)} />
            <Input
              label="Example link"
              type="url"
              value={form.exampleUrl}
              onChange={(e) => update("exampleUrl", e.target.value)}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block mb-1.5">Description</p>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-zinc-500">Configure what packages are offered for this site.</p>
            {listings.length < 2 && (
              <button
                type="button"
                onClick={addListing}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Package
              </button>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900/45 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-xs text-zinc-500 italic mb-2">No listing packages for this site.</p>
              <Button size="sm" onClick={addListing}>Create Package</Button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {listings.map((l, index) => (
                <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 relative shadow-sm">
                  <button
                    type="button"
                    onClick={() => removeListing(index)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                        Type
                      </label>
                      <select
                        value={l.type}
                        onChange={(e) => updateListing(index, "type", e.target.value)}
                        disabled={!!l.id}
                        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      >
                        <option value="GUEST_POST">GUEST POST</option>
                        <option value="NICHE_EDIT">NICHE EDIT</option>
                      </select>
                    </div>
                    <Input
                      label="Price (USD)"
                      type="number"
                      step="0.01"
                      min="1"
                      value={l.price}
                      onChange={(e) => updateListing(index, "price", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      label="Turnaround (Days)"
                      type="number"
                      min="1"
                      value={l.turnaroundDays}
                      onChange={(e) => updateListing(index, "turnaroundDays", e.target.value)}
                      required
                    />
                    {l.includesContent && (
                      <Input
                        label="Word Count"
                        type="number"
                        min="100"
                        value={l.wordCount}
                        onChange={(e) => updateListing(index, "wordCount", e.target.value)}
                        required
                      />
                    )}
                  </div>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={l.doFollow}
                        onChange={(e) => updateListing(index, "doFollow", e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-zinc-300"
                      />
                      <span>Do-Follow</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={l.includesContent}
                        onChange={(e) => updateListing(index, "includesContent", e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-zinc-300"
                      />
                      <span>Includes Content</span>
                    </label>
                  </div>
                  <textarea
                    placeholder="Extra notes or guidelines..."
                    value={l.extraNotes}
                    onChange={(e) => updateListing(index, "extraNotes", e.target.value)}
                    className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    rows={1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800 mt-4">
        <Button onClick={() => onSubmit({ ...form, listings })} loading={busy}>
          Save changes
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

function DeleteModal({
  site,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  site: Site;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (force: boolean) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const expected = getDomainFromUrl(site.url);
  const blocked = error.toLowerCase().includes("orders");

  return (
    <Modal title={`Delete · ${expected}`} onClose={onClose}>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-800 dark:text-red-300">
        <p>
          Deleting a site removes its listings and metric history permanently. If it has paid orders, you should{" "}
          <strong>Suspend</strong> instead.
        </p>
      </div>
      <Input
        label={`Type "${expected}" to confirm`}
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
      />
      {error && <p className="text-xs text-red-700 dark:text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button
          variant="danger"
          onClick={() => onConfirm(blocked)}
          loading={busy}
          disabled={confirmText !== expected}
        >
          {blocked ? "Force delete anyway" : "Delete site"}
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
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950 z-10">
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
