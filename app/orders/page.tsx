"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { ShoppingCart, ExternalLink, Eye } from "lucide-react";

const statusVariant: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  PENDING_PAYMENT: "default",
  PAID: "info",
  IN_PROGRESS: "info",
  CONTENT_NEEDED: "warning",
  SUBMITTED: "info",
  PUBLISHED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  REJECTED: "danger",
  DISPUTED: "danger",
  REFUNDED: "danger",
};

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

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

interface OrderItem {
  id: string;
  status: string;
  createdAt: string;
  listing?: {
    type: string;
    site?: {
      url: string;
    } | null;
  } | null;
  anchorText?: string | null;
  pricePaidCents: number;
  articleUrl?: string | null;
}

function OrdersList() {
  const searchParams = useSearchParams();
  const roleScope = searchParams.get("roleScope") ?? "";
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevRoleScope, setPrevRoleScope] = useState(roleScope);

  if (roleScope !== prevRoleScope) {
    setPrevRoleScope(roleScope);
    setLoading(true);
  }

  useEffect(() => {
    const url = roleScope ? `/api/orders?roleScope=${roleScope}` : "/api/orders";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        setLoading(false);
      });
  }, [roleScope]);

  const title = roleScope === "customer"
    ? "Orders Bought"
    : roleScope === "reseller"
    ? "Orders Received"
    : "My Orders";

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">{title}</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="font-semibold text-zinc-900 dark:text-white">No orders yet</p>
            <p className="text-sm mt-1 text-zinc-500">
              <Link href="/marketplace" className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                Browse the marketplace
              </Link>{" "}
              to place your first order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/5 dark:shadow-black/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3">Portal</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Anchor Details</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-xs">
                {orders.map((order) => {
                  const domain = getDomainFromUrl(order.listing?.site?.url ?? "");
                  return (
                    <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-colors text-zinc-700 dark:text-zinc-300">
                      <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-955 dark:text-white">{domain || "—"}</span>
                          {order.listing?.site?.url && (
                            <a
                              href={order.listing.site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap uppercase tracking-wider text-[10px] font-semibold text-zinc-500">
                        {order.listing?.type?.replace("_", " ") || "—"}
                      </td>
                      <td className="px-4 py-3.5 min-w-[150px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900 dark:text-white truncate max-w-[200px]" title={order.anchorText ?? undefined}>
                            {order.anchorText || "—"}
                          </span>
                          {order.articleUrl && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Live ✓</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                        {fmtCents(order.pricePaidCents)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant={statusVariant[order.status] ?? "default"}>
                          {statusLabel[order.status] ?? order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/orders/${order.id}`}>
                            <button className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors">
                              <Eye className="h-3 w-3" />
                              <span>Details</span>
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="px-4 sm:px-6 lg:px-8 py-10 space-y-4">
          <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
        </div>
      </div>
    }>
      <OrdersList />
    </Suspense>
  );
}
