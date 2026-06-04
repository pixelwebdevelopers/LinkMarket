"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getDomainFromUrl } from "@/lib/utils";
import { CheckCircle, ExternalLink, Shield } from "lucide-react";
import { useSession } from "next-auth/react";

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  CONTENT_NEEDED: "Content Needed",
  SUBMITTED: "Submitted",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

const steps = ["PENDING", "IN_PROGRESS", "SUBMITTED", "PUBLISHED", "COMPLETED"];

function SuccessBanner() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  if (!isSuccess) return null;
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 animate-scale-in">
      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
      <div>
        <p className="font-semibold text-emerald-800 dark:text-emerald-200">Order placed successfully!</p>
        <p className="text-sm">Your order is now with the publisher. You&apos;ll be notified when it&apos;s live.</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [articleUrl, setArticleUrl] = useState("");
  const [updating, setUpdating] = useState(false);

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
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, articleUrl }),
    });
    const data = await res.json();
    setOrder(data);
    setUpdating(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse h-96 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl" />
    </div>
  );
  if (!order || order.error) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center py-20 text-zinc-500">Order not found.</div>
    </div>
  );

  const currentStep = steps.indexOf(order.status);
  const isPublisher = session?.user?.role === "PUBLISHER";
  const isAdmin = session?.user?.role === "ADMIN";
  const canUpdateStatus = isPublisher || isAdmin;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <Suspense>
        <SuccessBanner />
      </Suspense>

      {/* Header */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
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
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(order.price)}</p>
            <Badge
              variant={
                order.status === "COMPLETED" || order.status === "PUBLISHED"
                  ? "success"
                  : order.status === "CANCELLED" || order.status === "REJECTED"
                  ? "danger"
                  : "warning"
              }
            >
              {statusLabel[order.status] ?? order.status}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center mb-2">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${i <= currentStep ? "bg-indigo-500 shadow-lg shadow-indigo-500/40" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-colors ${i < currentStep ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            {steps.map((step) => (
              <span key={step}>{statusLabel[step]}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Order details */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900 dark:text-white">Order Details</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="min-w-0">
            <p className="text-zinc-500 text-xs mb-0.5">Target URL</p>
            <a href={order.targetUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 truncate">
              <span className="truncate">{order.targetUrl}</span> <ExternalLink className="h-3.5 w-3.5 shrink-0" />
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
        </div>

        {order.articleUrl && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            <span className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">Link is live!</span>
            <a href={order.articleUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:text-emerald-200 transition-colors flex items-center gap-1 ml-auto">
              View article <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Publisher / Admin actions */}
      {canUpdateStatus && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
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
              {order.status === "PENDING" && (
                <Button size="sm" onClick={() => updateStatus("IN_PROGRESS")} loading={updating}>
                  Accept Order
                </Button>
              )}
              {order.status === "IN_PROGRESS" && (
                <Button size="sm" onClick={() => updateStatus("SUBMITTED")} loading={updating}>
                  Mark as Submitted
                </Button>
              )}
              {(order.status === "SUBMITTED" || order.status === "IN_PROGRESS") && articleUrl && (
                <Button size="sm" variant="secondary" onClick={() => updateStatus("PUBLISHED")} loading={updating}>
                  Mark as Published
                </Button>
              )}
              {order.status === "PENDING" && (
                <Button size="sm" variant="danger" onClick={() => updateStatus("REJECTED")} loading={updating}>
                  Reject
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
        <Shield className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
        <p>Covered by our <strong className="text-zinc-900 dark:text-white">12-month link replacement guarantee</strong>. If the link is removed, we&apos;ll replace it within 7 days.</p>
      </div>
    </div>
    </div>
  );
}
