import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate, getDomainFromUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Globe, TrendingUp, Zap, ArrowRight, PlusCircle, BarChart3 } from "lucide-react";
import { getResellerBalanceCents } from "@/lib/ledger";

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

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { listing: { include: { site: true } } },
      },
      sites: {
        take: 3,
        include: { metrics: true, listings: true },
      },
    },
  });
  if (!user) redirect("/login");

  const totalSpentCents = user.orders.reduce((sum, o) => sum + o.pricePaidCents, 0);
  const activeOrders = user.orders.filter(
    (o) => !["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED"].includes(o.status)
  );

  const isReseller = user.role === "RESELLER";
  const balance = isReseller ? await getResellerBalanceCents(user.id) : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Welcome back, {user.name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              {isReseller ? "Your reseller dashboard" : "Your link building overview"}
            </p>
          </div>
          <Link href="/marketplace">
            <Button>
              <Zap className="h-4 w-4" /> Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className={`grid sm:grid-cols-3 ${isReseller ? "lg:grid-cols-4" : ""} gap-4`}>
          <StatCard
            label="Total Orders"
            value={user.orders.length.toString()}
            Icon={ShoppingCart}
            color="text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
          />
          <StatCard
            label="Active Orders"
            value={activeOrders.length.toString()}
            Icon={TrendingUp}
            color="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          />
          <StatCard
            label="Total Spent"
            value={fmtCents(totalSpentCents)}
            Icon={BarChart3}
            color="text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/20"
          />
          {isReseller && balance && (
            <StatCard
              label="Available Balance"
              value={fmtCents(balance.availableCents)}
              Icon={BarChart3}
              color="text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
              link="/reseller/earnings"
            />
          )}
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900 dark:text-white text-lg">Recent Orders</h2>
            <Link
              href="/orders"
              className="text-sm text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {user.orders.length === 0 ? (
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl p-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-7 w-7 text-zinc-400 dark:text-zinc-600" />
              </div>
              <p className="font-semibold text-zinc-900 dark:text-white mb-1">No orders yet</p>
              <p className="text-zinc-500 text-sm mb-4">Start building links today</p>
              <Link href="/marketplace">
                <Button size="sm">Browse Marketplace</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {user.orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500/30 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 transition-all duration-150">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">
                        {getDomainFromUrl(order.listing?.site?.url ?? "")}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatDate(order.createdAt)} · {order.anchorText ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={statusVariant[order.status] ?? "default"}>
                        {order.status.replace("_", " ")}
                      </Badge>
                      <span className="font-bold text-zinc-900 dark:text-white text-sm tabular-nums">
                        {fmtCents(order.pricePaidCents)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reseller sites preview */}
        {isReseller && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-zinc-900 dark:text-white text-lg">My Sites</h2>
              <Link
                href="/reseller"
                className="text-sm text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.sites.map((site) => (
                <div
                  key={site.id}
                  className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant={
                        site.status === "APPROVED"
                          ? "success"
                          : site.status === "PENDING"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {site.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">{site.listings.length} packages</span>
                  </div>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">{getDomainFromUrl(site.url)}</p>
                  {site.metrics && (
                    <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                      <span>
                        DR: <strong className="text-zinc-700 dark:text-zinc-300">{site.metrics.domainRating}</strong>
                      </span>
                      <span>
                        Traffic:{" "}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          {site.metrics.organicTraffic?.toLocaleString()}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <Link href="/reseller/new">
                <div className="bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 hover:border-indigo-500/40 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all duration-200 min-h-[120px] cursor-pointer group">
                  <PlusCircle className="h-7 w-7 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Add a site</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  color,
  link,
}: {
  label: string;
  value: string;
  Icon: any;
  color: string;
  link?: string;
}) {
  const inner = (
    <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums truncate">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}
