"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface Dispute {
  id: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED_CUSTOMER" | "RESOLVED_RESELLER" | "WITHDRAWN";
  reason: string;
  createdAt: string;
  order: {
    id: string;
    pricePaidCents: number;
    listing: { site: { url: string; name: string } };
    customer: { name: string | null; email: string };
    fulfiller: { name: string | null; email: string };
  };
}

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState<"all" | Dispute["status"]>("OPEN");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const url = filter === "all" ? "/api/admin/disputes" : `/api/admin/disputes?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setDisputes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: "OPEN", label: "Open" },
    { key: "RESOLVED_CUSTOMER", label: "Refunded" },
    { key: "RESOLVED_RESELLER", label: "Denied" },
    { key: "WITHDRAWN", label: "Withdrawn" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Disputes</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
            Review and resolve customer disputes. Customer-side resolution issues a Stripe refund.
          </p>
        </div>

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
        ) : disputes.length === 0 ? (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl p-12 text-center text-zinc-500">
            No disputes in this view.
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <Link key={d.id} href={`/admin/orders/${d.order.id}`}>
                <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          variant={
                            d.status === "OPEN"
                              ? "warning"
                              : d.status === "RESOLVED_CUSTOMER"
                              ? "success"
                              : "default"
                          }
                        >
                          {d.status.replace("_", " ")}
                        </Badge>
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          {getDomainFromUrl(d.order.listing.site.url)}
                        </span>
                        <span className="text-sm text-zinc-500 tabular-nums">{fmtCents(d.order.pricePaidCents)}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{d.reason}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        Customer: {d.order.customer.email} · Fulfiller: {d.order.fulfiller.email} · {formatDate(d.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
