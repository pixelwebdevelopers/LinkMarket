"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, PlusCircle, X, Star, Trash2, Mail, CreditCard } from "lucide-react";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/panel/EmptyState";

interface BankAccount {
  id: string;
  label: string;
  accountName: string;
  methodType: "PAYPAL" | "STRIPE" | "BANK_WIRE";
  paypalEmail: string | null;
  stripeEmail: string | null;
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
    if (!confirm("Delete this payout method?")) return;
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
    <PageContainer>
      <PageHeader
        title="Payout Methods"
        description="Choose how you'd like to receive payouts from the platform (PayPal, Stripe, or Bank Wire)."
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <PlusCircle className="h-4 w-4" /> Add method
          </Button>
        }
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      ) : accounts.length === 0 ? (
        <EmptyState
          Icon={Building2}
          title="No payout methods yet"
          description="Add one to enable payouts."
          action={<Button onClick={() => setShowAdd(true)}>Add your first method</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/15 grid place-items-center shrink-0">
                  {a.methodType === "PAYPAL" ? (
                    <Mail className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                  ) : a.methodType === "STRIPE" ? (
                    <CreditCard className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                  ) : (
                    <Building2 className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{a.label}</h3>
                    {a.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  <Badge variant="default" className="mb-2 text-[10px] uppercase font-bold tracking-wider">
                    {a.methodType ? a.methodType.replace("_", " ") : "BANK WIRE"}
                  </Badge>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate">{a.accountName}</p>
                  
                  {a.methodType === "PAYPAL" && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">PayPal Email: {a.paypalEmail}</p>
                  )}
                  {a.methodType === "STRIPE" && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">Stripe Email: {a.stripeEmail}</p>
                  )}
                  {(a.methodType === "BANK_WIRE" || !a.methodType) && (
                    <p className="text-xs text-zinc-500 mt-1 font-mono">
                      {a.bankName ? `${a.bankName} · ` : ""}
                      {a.country ? `${a.country} · ` : ""}
                      {a.accountNumber ? `Acc ${mask(a.accountNumber)}` : a.iban ? `IBAN ${mask(a.iban)}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 justify-end">
                {!a.isDefault && (
                  <Button size="sm" variant="outline" onClick={() => makeDefault(a.id)}>
                    <Star className="h-3.5 w-3.5 mr-1" /> Make default
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)} className="text-red-600 hover:text-red-700 hover:bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </PageContainer>
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
    methodType: "PAYPAL",
    paypalEmail: "",
    stripeEmail: "",
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
          <h2 className="font-bold text-zinc-900 dark:text-white">Add Payout Method</h2>
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

          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Payout Method Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["PAYPAL", "STRIPE", "BANK_WIRE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("methodType", t)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    form.methodType === t
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Label (e.g. PayPal Main, Bank Account)"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            required
            placeholder="e.g. My primary PayPal"
          />

          <Input
            label="Account holder name"
            value={form.accountName}
            onChange={(e) => set("accountName", e.target.value)}
            required
            placeholder="e.g. John Doe"
          />

          {form.methodType === "PAYPAL" && (
            <Input
              label="PayPal Email Address"
              type="email"
              value={form.paypalEmail}
              onChange={(e) => set("paypalEmail", e.target.value)}
              required
              placeholder="e.g. paypal@example.com"
            />
          )}

          {form.methodType === "STRIPE" && (
            <Input
              label="Stripe Email / Account ID"
              value={form.stripeEmail}
              onChange={(e) => set("stripeEmail", e.target.value)}
              required
              placeholder="e.g. stripe@example.com or acct_..."
            />
          )}

          {form.methodType === "BANK_WIRE" && (
            <div className="space-y-4">
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
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-indigo-500 accent-indigo-500"
            />
            <span className="text-zinc-700 dark:text-zinc-300">Make this the default payout method</span>
          </label>

          <div className="flex gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="submit" loading={submitting}>
              <PlusCircle className="h-4 w-4" /> Add Method
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
