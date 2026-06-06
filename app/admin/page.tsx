"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { StatCard } from "@/components/panel/StatCard";
import { EmptyState } from "@/components/panel/EmptyState";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import {
  Users,
  Globe,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [openDisputes, setOpenDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [sitesRes, ordersRes, disputesRes, payoutsRes, customersRes, resellersRes] = await Promise.all([
      fetch("/api/admin/metrics").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/admin/disputes?status=OPEN").then((r) => r.json()),
      fetch("/api/admin/payouts?status=REQUESTED").then((r) => r.json()),
      fetch("/api/admin/customers").then((r) => r.json()),
      fetch("/api/admin/resellers").then((r) => r.json()),
    ]);
    const sites = Array.isArray(sitesRes) ? sitesRes : [];
    const orders = ordersRes.orders ?? [];
    const disputes = Array.isArray(disputesRes) ? disputesRes : [];
    const payouts = Array.isArray(payoutsRes) ? payoutsRes : [];
    const customers = Array.isArray(customersRes) ? customersRes : [];
    const resellers = Array.isArray(resellersRes) ? resellersRes : [];

    const totalRevenueCents = orders
      .filter((o: any) => !["PENDING_PAYMENT", "REFUNDED", "CANCELLED"].includes(o.status))
      .reduce((acc: number, o: any) => acc + (o.pricePaidCents ?? 0), 0);

    setStats({
      sites: sites.length,
      pendingSites: sites.filter((s: any) => s.status === "PENDING").length,
      orders: orders.length,
      openDisputes: disputes.length,
      pendingPayouts: payouts.length,
      customers: customers.length,
      resellers: resellers.length,
      totalRevenueCents,
    });
    setPending(sites.filter((s: any) => s.status === "PENDING").slice(0, 5));
    setRecentOrders(orders.slice(0, 6));
    setOpenDisputes(disputes.slice(0, 5));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approveSite(id: string) {
    setBusy(id);
    await fetch(`/api/admin/sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    setBusy(null);
    load();
  }

  if (loading || !stats)
    return (
      <PageContainer>
        <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      </PageContainer>
    );

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Live snapshot of marketplace activity."
        actions={
          <>
            <Link href="/admin/sites/new"><Button variant="outline" size="sm">Add site</Button></Link>
            <Link href="/admin/resellers"><Button size="sm">Add reseller</Button></Link>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Sites" value={stats.sites} hint={`${stats.pendingSites} pending`} Icon={Globe} accent="indigo" href="/admin/sites" />
        <StatCard label="Orders" value={stats.orders} Icon={ShoppingCart} accent="emerald" href="/admin/orders" />
        <StatCard
          label="Revenue (gross)"
          value={fmtCents(stats.totalRevenueCents)}
          hint="Sum of all non-refunded orders"
          Icon={Wallet}
          accent="purple"
        />
        <StatCard label="Customers" value={stats.customers} hint={`${stats.resellers} resellers`} Icon={Users} accent="amber" href="/admin/customers" />
      </div>

      {/* Action items */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Pending sites */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Pending site reviews</h2>
            <Link href="/admin/sites" className="text-xs text-indigo-700 dark:text-indigo-400 hover:underline">View all →</Link>
          </div>
          {pending.length === 0 ? (
            <EmptyState Icon={CheckCircle} title="Inbox zero" description="No sites awaiting review right now." />
          ) : (
            <div className="space-y-2">
              {pending.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                        {getDomainFromUrl(s.url)}
                      </p>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-indigo-700 dark:hover:text-indigo-400">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {s.niche} · {s.owner?.email}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="success" onClick={() => approveSite(s.id)} loading={busy === s.id}>
                      <CheckCircle className="h-3 w-3" /> Approve
                    </Button>
                    <Link href={`/admin/sites?focus=${s.id}`}>
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Open disputes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Open disputes</h2>
            <Link href="/admin/disputes" className="text-xs text-indigo-700 dark:text-indigo-400 hover:underline">View all →</Link>
          </div>
          {openDisputes.length === 0 ? (
            <EmptyState Icon={CheckCircle} title="No active disputes" />
          ) : (
            <div className="space-y-2">
              {openDisputes.map((d) => (
                <Link key={d.id} href={`/admin/orders/${d.order.id}`}>
                  <div className="bg-white dark:bg-zinc-900 border border-amber-500/20 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                          {getDomainFromUrl(d.order.listing.site.url)} — {fmtCents(d.order.pricePaidCents)}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-0.5">{d.reason}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">{d.order.customer.email}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs text-indigo-700 dark:text-indigo-400 hover:underline">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState Icon={ShoppingCart} title="No orders yet" />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <tr>
                  {["Order", "Site", "Customer", "Status", "Amount", ""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {getDomainFromUrl(o.listing?.site?.url ?? "")}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">{o.customer?.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={["COMPLETED", "PAID", "PUBLISHED"].includes(o.status) ? "success" : ["REFUNDED", "CANCELLED", "REJECTED", "DISPUTED"].includes(o.status) ? "danger" : "warning"}>
                        {o.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-zinc-900 dark:text-white">
                      {fmtCents(o.pricePaidCents)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${o.id}`} className="text-xs text-indigo-700 dark:text-indigo-400 hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
