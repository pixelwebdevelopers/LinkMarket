"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/panel/EmptyState";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";

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
    <PageContainer>
      <PageHeader
        title="Disputes"
        description="Review and resolve customer disputes. Resolving for the customer issues a Stripe refund."
      />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter === f.key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      ) : disputes.length === 0 ? (
        <EmptyState Icon={CheckCircle} title="No disputes in this view" />
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <Link key={d.id} href={`/admin/orders/${d.order.id}`}>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-colors">
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
    </PageContainer>
  );
}
