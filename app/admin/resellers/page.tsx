"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, X, UserPlus } from "lucide-react";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";

interface Reseller {
  id: string;
  name: string | null;
  email: string;
  defaultCommissionCents: number | null;
  payoutThresholdCents: number | null;
  createdAt: string;
  _count: { sites: number; ordersToFulfill: number };
}

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const url = q ? `/api/admin/resellers?q=${encodeURIComponent(q)}` : "/api/admin/resellers";
    const res = await fetch(url);
    const data = await res.json();
    setResellers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Resellers"
        description="Create new reseller accounts or promote existing users."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4" /> Add reseller
          </Button>
        }
      />

        <div className="flex gap-2">
          <Input
            placeholder="Search by name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <Button variant="outline" onClick={load}>
            Search
          </Button>
        </div>

        {loading ? (
          <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
        ) : resellers.length === 0 ? (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl p-12 text-center text-zinc-500">
            No resellers yet. <button onClick={() => setShowCreate(true)} className="text-indigo-700 dark:text-indigo-400 hover:underline">Create one</button>.
          </div>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  {["Name", "Email", "Commission", "Payout threshold", "Sites", "Orders fulfilled"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {resellers.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">{r.name ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.email}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {r.defaultCommissionCents !== null
                        ? `$${(r.defaultCommissionCents / 100).toFixed(2)}`
                        : "Global default"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {r.payoutThresholdCents !== null ? `$${(r.payoutThresholdCents / 100).toFixed(2)}` : "Global default"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{r._count.sites}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{r._count.ordersToFulfill}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {showCreate && <CreateResellerModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </PageContainer>
  );
}

function CreateResellerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [defaultCommissionUsd, setDefaultCommissionUsd] = useState("");
  const [payoutThresholdUsd, setPayoutThresholdUsd] = useState("");
  const [promoteExisting, setPromoteExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body: any = {
      name,
      email,
      password: password || undefined,
      promoteExisting,
    };
    if (defaultCommissionUsd) body.defaultCommissionCents = Math.round(parseFloat(defaultCommissionUsd) * 100);
    if (payoutThresholdUsd) body.payoutThresholdCents = Math.round(parseFloat(payoutThresholdUsd) * 100);
    const res = await fetch("/api/admin/resellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create");
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-900 dark:text-white">New Reseller</h2>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required={!promoteExisting} />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!promoteExisting && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="At least 8 characters"
            />
          )}
          <Input
            label="Default commission USD (optional)"
            type="number"
            step="0.01"
            min={0}
            value={defaultCommissionUsd}
            onChange={(e) => setDefaultCommissionUsd(e.target.value)}
            hint="Flat amount in USD added on top of this reseller's base prices. Leave blank to inherit the global setting."
          />
          <Input
            label="Payout threshold USD (optional)"
            type="number"
            step="0.01"
            min={0}
            value={payoutThresholdUsd}
            onChange={(e) => setPayoutThresholdUsd(e.target.value)}
            hint="Minimum balance for this reseller to request payout. Leave blank for global default."
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={promoteExisting}
              onChange={(e) => setPromoteExisting(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-indigo-500 accent-indigo-500"
            />
            <span className="text-zinc-700 dark:text-zinc-300">
              Promote existing user (skips password creation)
            </span>
          </label>
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={saving}>
              <PlusCircle className="h-4 w-4" /> {promoteExisting ? "Promote" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
