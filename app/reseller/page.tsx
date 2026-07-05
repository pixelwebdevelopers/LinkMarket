"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDomainFromUrl } from "@/lib/utils";
import { Globe, PlusCircle, CheckCircle, ExternalLink, ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/panel/EmptyState";

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

function ResellerSiteRow({
  site,
  onEditSite,
  onAddListing,
  onEditListing,
  onDeleteListing,
}: {
  site: any;
  onEditSite: (site: any) => void;
  onAddListing: (site: any) => void;
  onEditListing: (site: any, listing: any) => void;
  onDeleteListing: (site: any, listing: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const domain = getDomainFromUrl(site.url);

  return (
    <>
      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-colors text-xs text-zinc-700 dark:text-zinc-300">
        <td className="px-4 py-3.5 font-medium">
          <div className="flex items-center gap-2">
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
        <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">{site.niche}</td>
        <td className="px-4 py-3.5 text-center font-bold tabular-nums">{site.metrics?.domainRating ?? "—"}</td>
        <td className="px-4 py-3.5 text-center font-bold tabular-nums">{site.metrics?.domainAuthority ?? "—"}</td>
        <td className="px-4 py-3.5 text-center tabular-nums">
          {site.metrics ? site.metrics.organicTraffic.toLocaleString() : "—"}
        </td>
        <td className="px-4 py-3.5 text-center">
          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
            {site.listings?.length ?? 0} packages
          </span>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex flex-col">
            <Badge variant={statusVariant[site.status] ?? "default"}>{site.status}</Badge>
            {site.rejectionReason && (
              <span className="text-[10px] text-red-600 dark:text-red-400 mt-1 max-w-[150px] truncate" title={site.rejectionReason}>
                {site.rejectionReason}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3.5 text-right">
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onEditSite(site)}
              className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit Site</span>
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
            >
              <span>Packages</span>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-zinc-50/50 dark:bg-zinc-900/30">
          <td colSpan={8} className="px-6 py-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Packages / Listings</h4>
              {(!site.listings || site.listings.length < 2) && (
                <button
                  onClick={() => onAddListing(site)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add Package
                </button>
              )}
            </div>
            {!site.listings || site.listings.length === 0 ? (
              <div className="text-center py-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl">
                <p className="text-xs text-zinc-500 italic mb-2">No listing packages created for this site yet.</p>
                <Button size="sm" onClick={() => onAddListing(site)}>
                  Create first package
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {site.listings.map((l: any) => (
                  <div
                    key={l.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
                          {l.type.replace("_", " ")}
                        </span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                          {formatCents(l.basePriceCents)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Turnaround: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{l.turnaroundDays}d</span> ·{" "}
                        {l.doFollow ? "DoFollow ✓" : "NoFollow"}
                      </p>
                      {l.includesContent && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Includes content ({l.wordCount ?? 500} words)
                        </p>
                      )}
                      {l.extraNotes && (
                        <p className="text-[10px] text-zinc-400 italic mt-1 truncate" title={l.extraNotes}>
                          &ldquo;{l.extraNotes}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => onEditListing(site, l)}
                        className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteListing(site, l)}
                        className="text-[11px] font-bold text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function ResellerSitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [editingSite, setEditingSite] = useState<any | null>(null);
  const [addingListingToSite, setAddingListingToSite] = useState<any | null>(null);
  const [editingListing, setEditingListing] = useState<{ site: any; listing: any } | null>(null);

  function load() {
    setLoading(true);
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
  }

  useEffect(() => {
    load();
  }, []);

  async function handleEditSiteSubmit(fields: any) {
    if (!editingSite) return;
    const res = await fetch(`/api/reseller/sites/${editingSite.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to update site");
    }
    setEditingSite(null);
    load();
  }

  async function handleAddListingSubmit(fields: any) {
    if (!addingListingToSite) return;
    const res = await fetch(`/api/reseller/sites/${addingListingToSite.id}/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to add listing");
    }
    setAddingListingToSite(null);
    load();
  }

  async function handleEditListingSubmit(fields: any) {
    if (!editingListing) return;
    const { site, listing } = editingListing;
    const res = await fetch(`/api/reseller/sites/${site.id}/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to update listing");
    }
    setEditingListing(null);
    load();
  }

  async function handleDeleteListing(site: any, listing: any) {
    if (!confirm(`Delete this ${listing.type.replace("_", " ").toLowerCase()} package?`)) return;
    const res = await fetch(`/api/reseller/sites/${site.id}/listings/${listing.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Failed to delete listing");
      return;
    }
    load();
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="h-64 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="My sites"
        description="Sites you&apos;ve listed on the marketplace."
        actions={
          <Link href="/reseller/new">
            <Button size="sm">
              <PlusCircle className="h-4 w-4" /> Add site
            </Button>
          </Link>
        }
      />

      <Suspense>
        <SubmittedBanner />
      </Suspense>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {sites.length === 0 ? (
        <EmptyState
          Icon={Globe}
          title="No sites yet"
          description="Submit your first site to start earning."
          action={
            <Link href="/reseller/new">
              <Button>Submit a site</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto scrollbar-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Niche</th>
                <th className="px-4 py-3 text-center">DR</th>
                <th className="px-4 py-3 text-center">DA</th>
                <th className="px-4 py-3 text-center">Traffic</th>
                <th className="px-4 py-3 text-center">Packages</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {sites.map((site: any) => (
                <ResellerSiteRow
                  key={site.id}
                  site={site}
                  onEditSite={setEditingSite}
                  onAddListing={setAddingListingToSite}
                  onEditListing={(s, l) => setEditingListing({ site: s, listing: l })}
                  onDeleteListing={handleDeleteListing}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Site Modal */}
      {editingSite && (
        <EditSiteModal
          site={editingSite}
          onClose={() => setEditingSite(null)}
          onSubmit={handleEditSiteSubmit}
        />
      )}

      {/* Add Listing Modal */}
      {addingListingToSite && (
        <ListingModal
          title={`Add Package to ${getDomainFromUrl(addingListingToSite.url)}`}
          site={addingListingToSite}
          onClose={() => setAddingListingToSite(null)}
          onSubmit={handleAddListingSubmit}
        />
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <ListingModal
          title={`Edit ${editingListing.listing.type.replace("_", " ")}`}
          site={editingListing.site}
          listing={editingListing.listing}
          onClose={() => setEditingListing(null)}
          onSubmit={handleEditListingSubmit}
        />
      )}
    </PageContainer>
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

function EditSiteModal({ site, onClose, onSubmit }: { site: any; onClose: () => void; onSubmit: (fields: any) => Promise<void> }) {
  const [form, setForm] = useState({
    name: site.name || "",
    language: site.language || "English",
    country: site.country || "US",
    exampleUrl: site.exampleUrl || "",
    description: site.description || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err: any) {
      setError(err.message || "Failed to save site");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Edit Site · ${getDomainFromUrl(site.url)}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Language" value={form.language} onChange={(e) => update("language", e.target.value)} required />
          <Input label="Country" value={form.country} onChange={(e) => update("country", e.target.value)} required />
        </div>
        <Input label="Example Link" type="url" value={form.exampleUrl} onChange={(e) => update("exampleUrl", e.target.value)} />
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={busy}>Save changes</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

function ListingModal({
  title,
  site,
  listing,
  onClose,
  onSubmit,
}: {
  title: string;
  site: any;
  listing?: any;
  onClose: () => void;
  onSubmit: (fields: any) => Promise<void>;
}) {
  const isEdit = !!listing;
  
  // Find which types are already taken by other listings
  const existingTypes = site.listings?.map((l: any) => l.type) || [];
  const availableTypes = ["GUEST_POST", "NICHE_EDIT"].filter(
    (t) => isEdit || !existingTypes.includes(t)
  );

  const [form, setForm] = useState({
    type: listing?.type || availableTypes[0] || "GUEST_POST",
    price: listing ? String(listing.basePriceCents / 100) : "",
    turnaroundDays: listing ? String(listing.turnaroundDays) : "3",
    doFollow: listing ? listing.doFollow : true,
    includesContent: listing ? listing.includesContent : false,
    wordCount: listing ? String(listing.wordCount ?? 500) : "500",
    extraNotes: listing?.extraNotes || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(k: keyof typeof form, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err: any) {
      setError(err.message || "Failed to save listing");
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        
        {!isEdit && (
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Package Type
            </label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Base Price (USD)"
            type="number"
            step="0.01"
            min="1"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
            hint="Amount you wish to earn"
          />
          <Input
            label="Turnaround (Days)"
            type="number"
            min="1"
            value={form.turnaroundDays}
            onChange={(e) => set("turnaroundDays", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.doFollow}
              onChange={(e) => set("doFollow", e.target.checked)}
              className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-indigo-500 accent-indigo-500"
            />
            <span className="text-zinc-700 dark:text-zinc-300">Links are Do-Follow</span>
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.includesContent}
              onChange={(e) => set("includesContent", e.target.checked)}
              className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-indigo-500 accent-indigo-500"
            />
            <span className="text-zinc-700 dark:text-zinc-300">Price includes writing/content creation</span>
          </label>
        </div>

        {form.includesContent && (
          <Input
            label="Minimum Word Count"
            type="number"
            min="100"
            step="50"
            value={form.wordCount}
            onChange={(e) => set("wordCount", e.target.value)}
            required
          />
        )}

        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Extra Notes / Guidelines
          </label>
          <textarea
            rows={2}
            value={form.extraNotes}
            onChange={(e) => set("extraNotes", e.target.value)}
            placeholder="e.g. No adult/gambling niches, maximum 2 links..."
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="submit" loading={busy}>Save package</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
