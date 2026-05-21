"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getDomainFromUrl } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

const statusVariant: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  CONTENT_NEEDED: "warning",
  SUBMITTED: "info",
  PUBLISHED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  REJECTED: "danger",
};

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm mt-1">
            <Link href="/marketplace" className="text-indigo-600 hover:underline">
              Browse the marketplace
            </Link>{" "}
            to place your first order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusVariant[order.status] ?? "default"}>
                      {statusLabel[order.status] ?? order.status}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {getDomainFromUrl(order.listing?.site?.url ?? "")}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {order.listing?.type?.replace("_", " ")} · {order.anchorText}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">{formatCurrency(order.price)}</p>
                  {order.articleUrl && (
                    <span className="text-xs text-green-600">Live ✓</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
