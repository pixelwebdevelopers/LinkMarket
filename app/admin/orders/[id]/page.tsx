"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, X, Shield } from "lucide-react";
import { MessageThread } from "@/components/orders/MessageThread";
import { PageContainer } from "@/components/panel/PageContainer";

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  IN_PROGRESS: "In Progress",
  CONTENT_NEEDED: "Content Needed",
  SUBMITTED: "Submitted",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  DISPUTED: "Disputed",
  REFUNDED: "Refunded",
};

const steps = ["PAID", "IN_PROGRESS", "SUBMITTED", "PUBLISHED", "COMPLETED"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resolveAction, setResolveAction] = useState<"resolve_customer" | "resolve_reseller" | "withdraw" | null>(null);
  const [adminForm, setAdminForm] = useState({
    targetUrl: "",
    anchorText: "",
    articleUrl: "",
  });
  const [targetStatus, setTargetStatus] = useState("");
  const currentStep = steps.indexOf(order?.status ?? "");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    setOrder(data);
    setAdminForm({
      targetUrl: data.targetUrl ?? "",
      anchorText: data.anchorText ?? "",
      articleUrl: data.articleUrl ?? "",
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSaveFields() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUrl: adminForm.targetUrl,
        anchorText: adminForm.anchorText,
        articleUrl: adminForm.articleUrl,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save details");
      return;
    }
    load();
  }

  async function handleForceStatus() {
    if (!targetStatus) return;
    if (targetStatus === "REFUNDED") {
      if (!confirm("Are you sure you want to refund this order? This will issue a full refund to the customer via Stripe.")) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to force status override to ${targetStatus}?`)) {
        return;
      }
    }
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to override status");
      return;
    }
    setTargetStatus("");
    load();
  }

  if (loading)
    return (
      <PageContainer width="narrow">
        <div className="animate-pulse h-96 bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      </PageContainer>
    );
  if (!order || order.error) {
    return (
      <PageContainer width="narrow">
        <div className="text-center py-20 text-zinc-500">Order not found.</div>
      </PageContainer>
    );
  }

  async function resolve(resolution: string) {
    if (!resolveAction) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/disputes/${order.dispute.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: resolveAction, resolution }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setResolveAction(null);
    load();
  }

  return (
    <PageContainer width="narrow">
      <div className="space-y-6">
        <Link
          href="/admin/orders"
          className="text-sm text-indigo-700 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </Link>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Order #{order.id.slice(-8).toUpperCase()}</p>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                {getDomainFromUrl(order.listing?.site?.url ?? "")}
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {order.listing?.type?.replace("_", " ")} · {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                {fmtCents(order.pricePaidCents)}
              </p>
              <Badge
                variant={
                  ["COMPLETED", "PAID", "PUBLISHED"].includes(order.status)
                    ? "success"
                    : ["CANCELLED", "REJECTED", "DISPUTED", "REFUNDED"].includes(order.status)
                    ? "danger"
                    : "warning"
                }
              >
                {order.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          {currentStep >= 0 && (
            <div className="mt-8 relative mb-6">
              {/* Connecting Line background */}
              <div className="absolute top-1.5 left-[10%] right-[10%] h-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
              {/* Active Connecting Line */}
              <div
                className="absolute top-1.5 left-[10%] h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-300"
                style={{ width: `${(currentStep / (steps.length - 1)) * 80}%` }}
              />
              
              <div className="relative flex justify-between z-10">
                {steps.map((step, i) => (
                  <div key={step} className="flex flex-col items-center w-[20%] text-center">
                    <div
                      className={`h-3 w-3 rounded-full transition-all duration-300 border-2 ${
                        i <= currentStep
                          ? "bg-indigo-600 border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.15)]"
                          : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                      }`}
                    />
                    <span className={`text-[10px] sm:text-xs font-semibold mt-2 transition-colors ${
                      i <= currentStep ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"
                    }`}>
                      {statusLabel[step]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm">
            <Field label="Customer" value={`${order.customer.name ?? order.customer.email}`} sub={order.customer.email} />
            <Field
              label="Fulfiller"
              value={`${order.fulfiller.name ?? order.fulfiller.email} (${order.fulfiller.role})`}
              sub={order.fulfiller.email}
            />
            <Field label="Target URL" value={order.targetUrl ?? "—"} />
            <Field label="Anchor text" value={order.anchorText ?? "—"} />
            {order.articleUrl && <Field label="Article URL" value={order.articleUrl} />}
            {order.stripePaymentIntentId && <Field label="Stripe PI" value={order.stripePaymentIntentId} mono />}
            {order.documentUrl && (
              <div className="sm:col-span-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex items-center justify-between mt-2">
                <div>
                  <p className="text-zinc-500 text-xs mb-0.5">Attached Document</p>
                  <p className="text-xs text-zinc-900 dark:text-white font-medium truncate max-w-xs sm:max-w-md">
                    {order.documentUrl.split("/").pop()?.split("?")[0]?.replace(/^[0-9]+_/, "") || "document"}
                  </p>
                </div>
                <a
                  href={order.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                >
                  Download Doc
                </a>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <SmallField label="Customer paid" value={fmtCents(order.pricePaidCents)} />
            <SmallField label="Admin commission" value={fmtCents(order.adminCommissionCents)} />
            <SmallField label="Reseller earning" value={fmtCents(order.resellerEarningCents)} />
            <SmallField label="Commission" value={fmtCents(order.commissionCentsSnapshot)} />
            {order.paidAt && <SmallField label="Paid" value={formatDate(order.paidAt)} />}
            {order.publishedAt && <SmallField label="Published" value={formatDate(order.publishedAt)} />}
            {order.completedAt && <SmallField label="Completed" value={formatDate(order.completedAt)} />}
            {order.refundedAt && <SmallField label="Refunded" value={formatDate(order.refundedAt)} />}
          </div>
        </div>

        {/* Dispute resolution */}
        {order.dispute && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-amber-900 dark:text-amber-100">Dispute</h2>
                  <Badge
                    variant={
                      order.dispute.status === "RESOLVED_CUSTOMER"
                        ? "success"
                        : order.dispute.status === "OPEN"
                        ? "warning"
                        : "default"
                    }
                  >
                    {order.dispute.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">{order.dispute.reason}</p>
                {order.dispute.resolution && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-3">
                    <strong>Resolution:</strong> {order.dispute.resolution}
                  </p>
                )}
                <p className="text-xs text-zinc-500 mt-2">
                  Opened {new Date(order.dispute.createdAt).toLocaleString()}
                </p>

                {order.dispute.status === "OPEN" && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button size="sm" variant="success" onClick={() => setResolveAction("resolve_customer")}>
                      Refund customer
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setResolveAction("resolve_reseller")}>
                      Deny dispute
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setResolveAction("withdraw")}>
                      Mark withdrawn
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Control Panel */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <Shield className="h-5 w-5 text-indigo-600 shrink-0" />
            <h2 className="font-bold text-zinc-900 dark:text-white text-base">Super Admin Action Panel</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Update details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Edit Order Fields</h3>
              <Input
                label="Target URL"
                value={adminForm.targetUrl}
                onChange={(e) => setAdminForm({ ...adminForm, targetUrl: e.target.value })}
              />
              <Input
                label="Anchor Text"
                value={adminForm.anchorText}
                onChange={(e) => setAdminForm({ ...adminForm, anchorText: e.target.value })}
              />
              <Input
                label="Published Article URL"
                value={adminForm.articleUrl}
                onChange={(e) => setAdminForm({ ...adminForm, articleUrl: e.target.value })}
              />
              <Button size="sm" onClick={handleSaveFields} loading={busy}>
                Save Details
              </Button>
            </div>

            {/* Change status / resolution */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Force Status Override</h3>
              <div className="flex gap-2">
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="flex-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="">Select status...</option>
                  <option value="PAID">PAID</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="CONTENT_NEEDED">CONTENT NEEDED</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED (No Refund)</option>
                  <option value="REFUNDED">REFUNDED (Auto Stripe Refund)</option>
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleForceStatus}
                  loading={busy}
                  disabled={!targetStatus}
                >
                  Override
                </Button>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-3 rounded-xl text-[11px] leading-relaxed">
                <strong>Attention:</strong> Setting status to <strong>REFUNDED</strong> initiates a full Stripe refund. Bypasses standard rules.
              </div>
            </div>
          </div>
        </div>

        <MessageThread orderId={order.id} />
      </div>

      {resolveAction && (
        <ResolveModal
          action={resolveAction}
          busy={busy}
          onClose={() => setResolveAction(null)}
          onSubmit={(resolution) => resolve(resolution)}
        />
      )}
    </PageContainer>
  );
}

function Field({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-zinc-900 dark:text-white font-medium truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 truncate">{sub}</p>}
    </div>
  );
}

function SmallField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-zinc-700 dark:text-zinc-300 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ResolveModal({
  action,
  busy,
  onClose,
  onSubmit,
}: {
  action: "resolve_customer" | "resolve_reseller" | "withdraw";
  busy: boolean;
  onClose: () => void;
  onSubmit: (resolution: string) => void;
}) {
  const [resolution, setResolution] = useState("");
  const titles: Record<typeof action, string> = {
    resolve_customer: "Refund customer (issues Stripe refund)",
    resolve_reseller: "Deny dispute (no refund)",
    withdraw: "Mark withdrawn",
  } as const;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-900 dark:text-white">{titles[action]}</h2>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
              Resolution notes (shown to both parties)
            </p>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={action === "resolve_customer" ? "success" : action === "resolve_reseller" ? "danger" : "primary"}
              loading={busy}
              onClick={() => onSubmit(resolution)}
            >
              Confirm
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
