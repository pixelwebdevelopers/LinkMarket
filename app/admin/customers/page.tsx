"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/panel/EmptyState";
import { formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const url = q ? `/api/admin/customers?q=${encodeURIComponent(q)}` : "/api/admin/customers";
    const res = await fetch(url);
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Everyone who has signed up to buy on the platform."
      />

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <Button variant="outline" onClick={load}>Search</Button>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      ) : customers.length === 0 ? (
        <EmptyState Icon={Users} title="No customers yet" description="Customer accounts will appear here as people sign up." />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                {["Name", "Email", "Orders", "Total spent", "Joined"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">{c.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.email}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 tabular-nums">{c._count.orders}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 tabular-nums">{fmtCents(c.totalSpentCents)}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
