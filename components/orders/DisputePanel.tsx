"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  order: any;
  session: any;
  onUpdated: (newOrder: any) => void;
}

const ELIGIBLE = ["PAID", "IN_PROGRESS", "CONTENT_NEEDED", "SUBMITTED", "PUBLISHED"];

export function DisputePanel({ order, session, onUpdated }: Props) {
  const [showOpen, setShowOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const userId = session?.user?.id;
  const isCustomer = order.customerId === userId;
  const isAdmin = session?.user?.role === "ADMIN";

  async function openDispute(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch(`/api/orders/${order.id}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    // Refetch order
    const o = await fetch(`/api/orders/${order.id}`).then((r) => r.json());
    onUpdated(o);
    setShowOpen(false);
    setReason("");
  }

  // Existing dispute display
  if (order.dispute) {
    const d = order.dispute;
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-semibold text-amber-900 dark:text-amber-100">Dispute</h2>
              <Badge
                variant={
                  d.status === "RESOLVED_CUSTOMER"
                    ? "success"
                    : d.status === "RESOLVED_RESELLER" || d.status === "WITHDRAWN"
                    ? "default"
                    : "warning"
                }
              >
                {d.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">{d.reason}</p>
            {d.resolution && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-3">
                <strong>Resolution:</strong> {d.resolution}
              </p>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              Opened {new Date(d.createdAt).toLocaleString()}
              {d.resolvedAt && ` · Resolved ${new Date(d.resolvedAt).toLocaleString()}`}
            </p>
            {isAdmin && d.status === "OPEN" && (
              <p className="text-xs mt-2">
                <a
                  href={`/admin/orders/${order.id}`}
                  className="text-indigo-700 dark:text-indigo-400 hover:underline"
                >
                  Resolve in admin panel →
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No dispute — show "open dispute" button to customer if eligible
  if (!isCustomer) return null;
  if (!ELIGIBLE.includes(order.status)) return null;

  return (
    <>
      <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Something wrong with this order?</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Open a dispute. Funds are held while an admin reviews. Refunds are issued via Stripe if resolved in your
            favor.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowOpen(true)}>
          <AlertTriangle className="h-3.5 w-3.5" /> Open dispute
        </Button>
      </div>

      {showOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white">Open dispute</h2>
              <button
                onClick={() => setShowOpen(false)}
                aria-label="Close"
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={openDispute} className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                  What went wrong?
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  required
                  minLength={10}
                  className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100"
                  placeholder="Be specific: what was delivered, what was expected, what's wrong..."
                />
                <p className="text-xs text-zinc-500 mt-1">
                  An admin reviews every dispute. We'll typically reach a decision within 3 business days.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="danger" loading={submitting} disabled={reason.trim().length < 10}>
                  Submit dispute
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
