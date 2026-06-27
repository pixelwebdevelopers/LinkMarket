"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Receipt, X } from "lucide-react";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/panel/EmptyState";

interface Payout {
  id: string;
  amountCents: number;
  status: "REQUESTED" | "APPROVED" | "PAID" | "REJECTED";
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  reference: string | null;
  notes: string | null;
  rejectionReason: string | null;
  bankSnapshot: any;
  reseller: { id: string; name: string | null; email: string };
}

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filter, setFilter] = useState<"all" | Payout["status"]>("REQUESTED");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [markPaidFor, setMarkPaidFor] = useState<Payout | null>(null);
  const [rejectFor, setRejectFor] = useState<Payout | null>(null);

  async function load() {
    setLoading(true);
    const url = filter === "all" ? "/api/admin/payouts" : `/api/admin/payouts?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setPayouts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function act(payoutId: string, body: any) {
    setBusy(payoutId);
    setError("");
    const res = await fetch(`/api/admin/payouts/${payoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    load();
    setMarkPaidFor(null);
    setRejectFor(null);
  }

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: "REQUESTED", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "PAID", label: "Paid" },
    { key: "REJECTED", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Payouts"
        description="Approve and mark payouts as paid after sending money via your bank."
      />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                filter === f.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
        ) : payouts.length === 0 ? (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl p-12 text-center text-zinc-500">
            No payouts in this view.
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <span className="font-bold text-zinc-900 dark:text-white text-lg tabular-nums">
                        {fmtCents(p.amountCents)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1.5">
                      {p.reseller.name ?? p.reseller.email}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Requested {formatDate(p.requestedAt)}
                      {p.paidAt && ` · Paid ${formatDate(p.paidAt)}`}
                      {p.reference && ` · Ref: ${p.reference}`}
                    </p>
                    {p.notes && <p className="text-xs text-zinc-500 mt-1 italic">&ldquo;{p.notes}&rdquo;</p>}
                    {p.rejectionReason && (
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">Reason: {p.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {p.status === "REQUESTED" && (
                      <Button
                        size="sm"
                        onClick={() => act(p.id, { action: "approve" })}
                        loading={busy === p.id}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {(p.status === "REQUESTED" || p.status === "APPROVED") && (
                      <Button size="sm" variant="success" onClick={() => setMarkPaidFor(p)}>
                        <Receipt className="h-3.5 w-3.5" /> Mark paid
                      </Button>
                    )}
                    {(p.status === "REQUESTED" || p.status === "APPROVED") && (
                      <Button size="sm" variant="danger" onClick={() => setRejectFor(p)}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    )}
                  </div>
                </div>

                {p.bankSnapshot && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                    {p.bankSnapshot.methodType === "PAYPAL" ? (
                      <div className="grid sm:grid-cols-3 gap-3">
                        <Field label="Method" value="PayPal" />
                        <Field label="Account holder" value={p.bankSnapshot.accountName} />
                        <Field label="PayPal Email" value={p.bankSnapshot.paypalEmail} />
                      </div>
                    ) : p.bankSnapshot.methodType === "STRIPE" ? (
                      <div className="grid sm:grid-cols-3 gap-3">
                        <Field label="Method" value="Stripe" />
                        <Field label="Account holder" value={p.bankSnapshot.accountName} />
                        <Field label="Stripe Email" value={p.bankSnapshot.stripeEmail} />
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-3 gap-3">
                        <Field label="Method" value={p.bankSnapshot.methodType ? p.bankSnapshot.methodType.replace("_", " ") : "Bank Wire"} />
                        <Field label="Account holder" value={p.bankSnapshot.accountName} />
                        <Field label="Bank" value={p.bankSnapshot.bankName} />
                        <Field label="Country" value={p.bankSnapshot.country} />
                        <Field label="Account #" value={p.bankSnapshot.accountNumber} />
                        <Field label="Routing" value={p.bankSnapshot.routingNumber} />
                        <Field label="IBAN" value={p.bankSnapshot.iban} />
                        <Field label="SWIFT" value={p.bankSnapshot.swift} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {markPaidFor && (
        <MarkPaidModal
          payout={markPaidFor}
          busy={busy === markPaidFor.id}
          onClose={() => setMarkPaidFor(null)}
          onSubmit={(reference, notes) => act(markPaidFor.id, { action: "mark_paid", reference, notes })}
        />
      )}
      {rejectFor && (
        <RejectModal
          payout={rejectFor}
          busy={busy === rejectFor.id}
          onClose={() => setRejectFor(null)}
          onSubmit={(rejectionReason) => act(rejectFor.id, { action: "reject", rejectionReason })}
        />
      )}
    </PageContainer>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-zinc-700 dark:text-zinc-300 font-mono">{value ?? "—"}</p>
    </div>
  );
}

function MarkPaidModal({
  payout,
  busy,
  onClose,
  onSubmit,
}: {
  payout: Payout;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reference: string, notes: string) => void;
}) {
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Modal title={`Mark payout paid — ${fmtCents(payout.amountCents)}`} onClose={onClose}>
      <Input
        label="Bank transfer reference"
        placeholder="e.g. ACH-12345"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <div>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={() => onSubmit(reference, notes)} loading={busy}>
          Confirm paid
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

function RejectModal({
  payout,
  busy,
  onClose,
  onSubmit,
}: {
  payout: Payout;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={`Reject payout — ${fmtCents(payout.amountCents)}`} onClose={onClose}>
      <div>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Reason</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100"
        />
        <p className="text-xs text-zinc-500 mt-1">Funds will be returned to the reseller&apos;s available balance.</p>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="danger" onClick={() => onSubmit(reason)} loading={busy} disabled={!reason}>
          Reject payout
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
