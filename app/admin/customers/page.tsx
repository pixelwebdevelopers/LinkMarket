"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/panel/EmptyState";
import { formatDate } from "@/lib/utils";
import { Users, UserX, ShieldAlert, ArrowUpRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function handleToggleDisable(c: any) {
    setBusyId(c.id);
    const res = await fetch(`/api/admin/users/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDisabled: !c.isDisabled }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Failed to update user");
      return;
    }
    load();
  }

  async function handlePromote(c: any) {
    if (!confirm(`Are you sure you want to promote ${c.name ?? c.email} to a Reseller?`)) return;
    setBusyId(c.id);
    const res = await fetch("/api/admin/resellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: c.email, promoteExisting: true }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Failed to promote user");
      return;
    }
    alert(`${c.name ?? c.email} successfully promoted to Reseller.`);
    load();
  }

  async function handleDelete(c: any) {
    if (!confirm(`Permanently delete ${c.name ?? c.email}'s account? This action cannot be undone.`)) return;
    setBusyId(c.id);
    const res = await fetch(`/api/admin/users/${c.id}`, {
      method: "DELETE",
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Failed to delete user");
      return;
    }
    load();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Everyone who has signed up to buy on the platform."
      />

      <div className="flex gap-2 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <Button variant="outline" onClick={load}>Search</Button>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      ) : customers.length === 0 ? (
        <EmptyState Icon={Users} title="No customers yet" description="Customer accounts will appear here as people sign up." />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-zinc-900/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-center">Total spent</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors text-xs text-zinc-700 dark:text-zinc-300">
                  <td className="px-4 py-3 text-zinc-900 dark:text-white font-semibold">{c.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isDisabled ? "danger" : "success"}>
                      {c.isDisabled ? "Disabled" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center font-medium tabular-nums">{c._count.orders}</td>
                  <td className="px-4 py-3 text-center font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{fmtCents(c.totalSpentCents)}</td>
                  <td className="px-4 py-3 text-zinc-500 text-[11px]">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end items-center">
                      <Button
                        size="sm"
                        variant={c.isDisabled ? "success" : "secondary"}
                        onClick={() => handleToggleDisable(c)}
                        loading={busyId === c.id}
                      >
                        {c.isDisabled ? "Enable" : "Disable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromote(c)}
                        loading={busyId === c.id}
                        title="Promote to Reseller"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Promote
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(c)}
                        loading={busyId === c.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
