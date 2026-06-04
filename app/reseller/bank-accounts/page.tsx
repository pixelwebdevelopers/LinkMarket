"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, PlusCircle, X, Star, Trash2 } from "lucide-react";

interface BankAccount {
  id: string;
  label: string;
  accountName: string;
  accountNumber: string | null;
  routingNumber: string | null;
  iban: string | null;
  swift: string | null;
  bankName: string | null;
  country: string | null;
  isDefault: boolean;
  createdAt: string;
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/reseller/bank-accounts");
    const data = await res.json();
    setAccounts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function makeDefault(id: string) {
    setError("");
    const res = await fetch(`/api/reseller/bank-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this bank account?")) return;
    setError("");
    const res = await fetch(`/api/reseller/bank-accounts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    load();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Bank Accounts</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Where you'd like to receive payouts from the platform.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <PlusCircle className="h-4 w-4" /> Add account
          </Button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
        ) : accounts.length === 0 ? (
          <div className="bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
            <Building2 className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
            <p className="font-semibold text-zinc-900 dark:text-white">No bank accounts yet</p>
            <p className="text-sm text-zinc-500 mt-1 mb-4">Add one to enable payouts.</p>
            <Button onClick={() => setShowAdd(true)}>Add your first account</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-500/15 grid place-items-center shrink-0">
                  <Building2 className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{a.label}</h3>
                    {a.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{a.accountName}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {a.bankName ? `${a.bankName} · ` : ""}
                    {a.country ? `${a.country} · ` : ""}
                    {a.accountNumber ? `Acc ${mask(a.accountNumber)}` : a.iban ? `IBAN ${mask(a.iban)}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!a.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => makeDefault(a.id)}>
                      <Star className="h-3.5 w-3.5" /> Make default
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}

function mask(s: string) {
  if (s.length <= 4) return s;
  return "•••• " + s.slice(-4);
}

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    label: "",
    accountName: "",
    bankName: "",
    country: "",
    accountNumber: "",
    routingNumber: "",
    iban: "",
    swift: "",
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set(k: keyof typeof form, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/reseller/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    onAdded();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-900 dark:text-white">Add bank account</h2>
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
          <Input label="Label (e.g. Chase main)" value={form.label} onChange={(e) => set("label", e.target.value)} required />
          <Input
            label="Account holder name"
            value={form.accountName}
            onChange={(e) => set("accountName", e.target.value)}
            required
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Bank name" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} />
            <Input label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Account number"
              value={form.accountNumber}
              onChange={(e) => set("accountNumber", e.target.value)}
              hint="US: ACH account number"
            />
            <Input
              label="Routing / ABA"
              value={form.routingNumber}
              onChange={(e) => set("routingNumber", e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="IBAN" value={form.iban} onChange={(e) => set("iban", e.target.value)} hint="EU and many others" />
            <Input label="SWIFT / BIC" value={form.swift} onChange={(e) => set("swift", e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-indigo-500 accent-indigo-500"
            />
            <span className="text-zinc-700 dark:text-zinc-300">Make this the default payout account</span>
          </label>
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={submitting}>
              <PlusCircle className="h-4 w-4" /> Add
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            Note: bank details are currently stored in plaintext for development. Encryption at rest will be enabled before
            production launch.
          </p>
        </form>
      </div>
    </div>
  );
}
