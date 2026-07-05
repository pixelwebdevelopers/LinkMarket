"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/panel/EmptyState";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { ShoppingCart, AlertTriangle } from "lucide-react";

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

const STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "IN_PROGRESS",
  "CONTENT_NEEDED",
  "SUBMITTED",
  "PUBLISHED",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
  "REJECTED",
  "REFUNDED",
] as const;

const statusVariant: Record<string, any> = {
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [scopeTab, setScopeTab] = useState<string>("all");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (scopeTab !== "all") params.set("roleScope", scopeTab);
    const url = `/api/orders${params.toString() ? "?" + params.toString() : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, scopeTab]);

  const filtered = q
    ? orders.filter((o) => {
        const domain = getDomainFromUrl(o.listing?.site?.url ?? "").toLowerCase();
        const term = q.toLowerCase();
        return (
          domain.includes(term) ||
          o.customer?.email?.toLowerCase().includes(term) ||
          o.fulfiller?.email?.toLowerCase().includes(term) ||
          o.id.toLowerCase().includes(term)
        );
      })
    : orders;

  return (
    <PageContainer>
      <PageHeader
        title="Orders"
        description="Every order on the platform across all customers and fulfillers."
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
          {[
            { id: "all", label: "All Orders" },
            { id: "admin_only", label: "My Orders (Admin)" },
            { id: "reseller_only", label: "Reseller Orders" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScopeTab(tab.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                scopeTab === tab.id
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <div className="flex-1 min-w-[200px] max-w-md ml-auto">
          <Input
            placeholder="Search domain, customer email, order id..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <EmptyState Icon={ShoppingCart} title="No orders match" description="Adjust the filter or search to find what you're looking for." />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                {["Order", "Site", "Customer", "Fulfiller", "Amount", "Status", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-zinc-900 dark:text-white font-mono text-xs">{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatDate(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{getDomainFromUrl(o.listing?.site?.url ?? "")}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">{o.customer?.email}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">{o.fulfiller?.email}</td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-white tabular-nums font-medium">
                    {fmtCents(o.pricePaidCents)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[o.status] ?? "default"}>{o.status.replace("_", " ")}</Badge>
                    {o.dispute?.status === "OPEN" && (
                      <span className="ml-1 inline-flex items-center text-amber-700 dark:text-amber-400" title="Dispute open">
                        <AlertTriangle className="h-3 w-3" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-xs text-indigo-700 dark:text-indigo-400 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
