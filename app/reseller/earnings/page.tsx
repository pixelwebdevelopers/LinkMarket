"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Wallet, ArrowUpCircle, CheckCircle, X } from "lucide-react";

interface BalanceData {
  availableCents: number;
  lifetimeEarnedCents: number;
  pendingCents: number;
  paidOutCents: number;
  thresholdCents: number;
  recentLedger: any[];
}

interface Payout {
  id: string;
  amountCents: number;
  status: "REQUESTED" | "APPROVED" | "PAID" | "REJECTED";
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  reference: string | null;
  rejectionReason: string | null;
  notes: string | null;
  bankAccount: { label: string; bankName: string | null } | null;
}

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default function EarningsPage() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function load() {
    setLoading(true);
    const [balance, payoutList, bankList] = await Promise.all([
      fetch("/api/reseller/balance").then((r) => r.json()),
      fetch("/api/reseller/payouts").then((r) => r.json()),
      fetch("/api/reseller/bank-accounts").then((r) => r.json()),
    ]);
    setData(balance);
    setPayouts(Array.isArray(payoutList) ? payoutList : []);
    setBanks(Array.isArray(bankList) ? bankList : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse h-64 bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      </div>
    );
  }

  const canRequest = data.availableCents >= data.thresholdCents;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Earnings</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Track your reseller balance and request payouts.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/bank-accounts">
              <Button variant="outline" size="sm">
                Bank accounts ({banks.length})
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => setShowRequest(true)}
              disabled={!canRequest || banks.length === 0}
              title={
                banks.length === 0
                  ? "Add a bank account first"
                  : !canRequest
                  ? `Minimum payout is ${fmtCents(data.thresholdCents)}`
                  : ""
              }
            >
              <ArrowUpCircle className="h-4 w-4" /> Request payout
            </Button>
          </div>
        </div>

        {banks.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm rounded-xl px-4 py-3">
            Add a bank account on the{" "}
            <Link href="/reseller/bank-accounts" className="underline">
              bank accounts page
            </Link>{" "}
            before requesting your first payout.
          </div>
        )}

        {/* Balance cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Available" value={fmtCents(data.availableCents)} accent="indigo" />
          <Card label="Pending (in-flight orders)" value={fmtCents(data.pendingCents)} accent="amber" />
          <Card label="Lifetime earned" value={fmtCents(data.lifetimeEarnedCents)} accent="emerald" />
          <Card label="Paid out" value={fmtCents(data.paidOutCents)} accent="purple" />
        </div>

        <p className="text-xs text-zinc-500">
          Minimum payout: <strong className="text-zinc-700 dark:text-zinc-300">{fmtCents(data.thresholdCents)}</strong>
          {" · "}Earnings from orders move from <em>Pending</em> to <em>Available</em> once the customer marks the order
          Completed (or 7 days after Published).
        </p>

        {/* Payout history */}
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-white mb-3">Payout history</h2>
          {payouts.length === 0 ? (
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl p-10 text-center text-zinc-500">
              No payouts yet.
            </div>
          ) : (
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    {["Amount", "Status", "Bank", "Requested", "Processed", "Reference"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white tabular-nums">
                        {fmtCents(p.amountCents)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            p.status === "PAID"
                              ? "success"
                              : p.status === "REJECTED"
                              ? "danger"
                              : p.status === "APPROVED"
                              ? "info"
                              : "warning"
                          }
                        >
                          {p.status}
                        </Badge>
                        {p.rejectionReason && (
                          <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{p.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {p.bankAccount?.label ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(p.requestedAt)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {p.paidAt ? formatDate(p.paidAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.reference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent ledger */}
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-white mb-3">Recent activity</h2>
          {data.recentLedger.length === 0 ? (
            <div className="text-sm text-zinc-500">No activity yet.</div>
          ) : (
            <div className="space-y-1.5">
              {data.recentLedger.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-zinc-900 dark:text-white font-medium truncate">{entry.description ?? entry.type}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {formatDate(entry.createdAt)} · {entry.type}
                    </p>
                  </div>
                  <span
                    className={`font-semibold tabular-nums ${
                      entry.amountCents < 0
                        ? "text-red-700 dark:text-red-400"
                        : "text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {entry.amountCents < 0 ? "-" : "+"}
                    {fmtCents(Math.abs(entry.amountCents))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRequest && (
        <PayoutRequestModal
          maxCents={data.availableCents}
          minCents={data.thresholdCents}
          banks={banks}
          onClose={() => setShowRequest(false)}
          onRequested={() => {
            setShowRequest(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  };
  return (
    <div
      className={`bg-gradient-to-br border ${colors[accent]} rounded-2xl p-5 bg-zinc-100 dark:bg-zinc-900`}
    >
      <div className="flex items-center gap-2 mb-2 text-zinc-500">
        <Wallet className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{value}</p>
    </div>
  );
}

function PayoutRequestModal({
  maxCents,
  minCents,
  banks,
  onClose,
  onRequested,
}: {
  maxCents: number;
  minCents: number;
  banks: any[];
  onClose: () => void;
  onRequested: () => void;
}) {
  const [amount, setAmount] = useState(((maxCents) / 100).toFixed(2));
  const [bankAccountId, setBankAccountId] = useState(banks.find((b) => b.isDefault)?.id ?? banks[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const cents = Math.round(parseFloat(amount) * 100);
    const res = await fetch("/api/reseller/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: cents, bankAccountId, notes: notes || undefined }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to request payout");
      return;
    }
    onRequested();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-900 dark:text-white">Request payout</h2>
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
          <Input
            label="Amount (USD)"
            type="number"
            step="0.01"
            min={(minCents / 100).toFixed(2)}
            max={(maxCents / 100).toFixed(2)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={`Min ${(minCents / 100).toFixed(2)} · Max ${(maxCents / 100).toFixed(2)}`}
            required
          />
          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
              Bank account
            </p>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} {b.isDefault && "(default)"} — {b.bankName ?? b.accountName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
              Notes (optional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={submitting}>
              <CheckCircle className="h-4 w-4" /> Request
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
