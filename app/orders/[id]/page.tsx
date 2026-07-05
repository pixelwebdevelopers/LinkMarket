"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { CheckCircle, ExternalLink, Shield, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { MessageThread } from "@/components/orders/MessageThread";
import { DisputePanel } from "@/components/orders/DisputePanel";

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

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

function PaidBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("paid") !== "1") return null;
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 animate-scale-in">
      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
      <div>
        <p className="font-semibold text-emerald-800 dark:text-emerald-200">Payment received!</p>
        <p className="text-sm">Your order is now with the publisher.</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  interface OrderDetails {
    id: string;
    status: string;
    createdAt: string;
    pricePaidCents: number;
    adminCommissionCents: number;
    resellerEarningCents: number;
    targetUrl?: string | null;
    anchorText?: string | null;
    articleUrl?: string | null;
    notes?: string | null;
    contentBody?: string | null;
    stripePaymentIntentId?: string | null;
    documentUrl?: string | null;
    listing?: {
      id: string;
      type: string;
      basePriceCents: number;
      finalPriceCents: number;
      turnaroundDays: number;
      site?: {
        url: string;
        name: string;
        niche: string;
        language: string;
        country: string;
      } | null;
    } | null;
    [key: string]: unknown;
  }

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [articleUrl, setArticleUrl] = useState("");
  const [updating, setUpdating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setArticleUrl(d.articleUrl ?? "");
        setLoading(false);
      });
  }, [id]);

  async function updateStatus(status: string) {
    setUpdating(true);
    setError("");
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, articleUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to update");
      setUpdating(false);
      return;
    }
    setOrder({ ...order, ...data });
    setUpdating(false);
  }

  async function retryPayment() {
    setPaying(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError((err as Error).message ?? String(err));
      setPaying(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full px-4 py-10 animate-pulse h-96 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl" />
      </div>
    );
  if (!order || order.error)
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center py-20 text-zinc-500">Order not found.</div>
      </div>
    );

  const currentStep = steps.indexOf(order.status);
  const isFulfiller = order.fulfillerId === session?.user?.id;
  const isCustomer = order.customerId === session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";
  const canUpdateStatus = isFulfiller || isAdmin;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
        <Suspense>
          <PaidBanner />
        </Suspense>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Pending payment banner */}
        {order.status === "PENDING_PAYMENT" && isCustomer && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200">Payment pending</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Complete payment to send this order to the publisher.
              </p>
            </div>
            <Button size="sm" onClick={retryPayment} loading={paying}>
              Pay now
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div className="min-w-0">
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
                  order.status === "COMPLETED" || order.status === "PUBLISHED" || order.status === "PAID"
                    ? "success"
                    : ["CANCELLED", "REJECTED", "DISPUTED", "REFUNDED"].includes(order.status)
                    ? "danger"
                    : "warning"
                }
              >
                {statusLabel[order.status] ?? order.status}
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
        </div>

        {/* Order details */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Order Details</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="min-w-0">
              <p className="text-zinc-500 text-xs mb-0.5">Target URL</p>
              <a
                href={order.targetUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 truncate"
              >
                <span className="truncate">{order.targetUrl}</span>{" "}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-0.5">Anchor Text</p>
              <p className="text-zinc-900 dark:text-white font-medium">{order.anchorText}</p>
            </div>
            {order.notes && (
              <div className="sm:col-span-2">
                <p className="text-zinc-500 text-xs mb-0.5">Notes</p>
                <p className="text-zinc-700 dark:text-zinc-300">{order.notes}</p>
              </div>
            )}
            {typeof order.documentUrl === "string" && (
              <div className="sm:col-span-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex items-center justify-between">
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

          {order.articleUrl && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2 flex-wrap">
              <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">Link is live!</span>
              <a
                href={order.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors flex items-center gap-1 ml-auto"
              >
                View article <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Fulfiller / Admin actions */}
        {canUpdateStatus && !["COMPLETED", "CANCELLED", "REFUNDED", "REJECTED"].includes(order.status) && (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Update Order Status</h2>
            <div className="space-y-3">
              <input
                type="url"
                placeholder="Published article URL (when live)"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-zinc-200 dark:focus:bg-zinc-800 transition-all duration-200"
              />
              <div className="flex flex-wrap gap-2">
                {order.status === "PAID" && (
                  <Button size="sm" onClick={() => updateStatus("IN_PROGRESS")} loading={updating}>
                    Accept Order
                  </Button>
                )}
                {order.status === "IN_PROGRESS" && (
                  <Button size="sm" onClick={() => updateStatus("SUBMITTED")} loading={updating}>
                    Mark as Submitted
                  </Button>
                )}
                {order.status === "CONTENT_NEEDED" && (
                  <Button size="sm" onClick={() => updateStatus("IN_PROGRESS")} loading={updating}>
                    Resume Order
                  </Button>
                )}
                {["PAID", "IN_PROGRESS"].includes(order.status) && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus("CONTENT_NEEDED")} loading={updating}>
                    Request Content
                  </Button>
                )}
                {["SUBMITTED", "PUBLISHED"].includes(order.status) && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus("IN_PROGRESS")} loading={updating}>
                    Revise / Move to In Progress
                  </Button>
                )}
                {["SUBMITTED", "IN_PROGRESS"].includes(order.status) && articleUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateStatus("PUBLISHED")}
                    loading={updating}
                  >
                    Mark as Published
                  </Button>
                )}
                {["PAID", "IN_PROGRESS", "CONTENT_NEEDED", "SUBMITTED", "PUBLISHED"].includes(order.status) && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm("Reject this order? The customer will be refunded in full.")) updateStatus("REJECTED");
                    }}
                    loading={updating}
                  >
                    Reject &amp; refund
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer can mark Published -> Completed */}
        {isCustomer && order.status === "PUBLISHED" && (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-white">Confirm completion</h2>
              <p className="text-sm text-zinc-500 mt-1">Approve this order if the link is live and looks right.</p>
            </div>
            <Button size="sm" onClick={() => updateStatus("COMPLETED")} loading={updating}>
              Mark Completed
            </Button>
          </div>
        )}

        {/* Dispute panel — shown when there's a dispute or when customer can open one */}
        <DisputePanel order={order} session={session} onUpdated={(updatedOrder) => setOrder(updatedOrder)} />

        {/* Messaging — only after payment */}
        {order.status !== "PENDING_PAYMENT" && <MessageThread orderId={order.id} />}

        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <Shield className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <p>
            Covered by our{" "}
            <strong className="text-zinc-900 dark:text-white">12-month link replacement guarantee</strong>. If the link
            is removed, we&apos;ll replace it within 7 days.
          </p>
        </div>
      </div>
    </div>
  );
}
