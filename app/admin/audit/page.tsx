"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { EmptyState } from "@/components/panel/EmptyState";
import { Activity } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: any;
  createdAt: string;
  actor: { id: string; name: string | null; email: string; role: string };
}

export default function AuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  async function load(reset = true) {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (actionFilter) params.set("action", actionFilter);
    if (!reset && nextCursor) params.set("cursor", nextCursor);
    const res = await fetch(`/api/admin/audit?${params}`);
    const data = await res.json();
    setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
    setNextCursor(data.nextCursor);
    setLoading(false);
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Audit log"
        description="Every admin-affecting action with actor, timestamp, and metadata."
      />

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Filter by action (e.g. payout, dispute, site)"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(true)}
        />
        <Button variant="outline" onClick={() => load(true)}>Filter</Button>
      </div>

      {loading && items.length === 0 ? (
        <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState Icon={Activity} title="No audit log entries yet" />
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <tr>
                  {["Time", "Actor", "Action", "Target", "Metadata"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {items.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <p className="font-medium">{row.actor.name ?? row.actor.email}</p>
                      <p className="text-xs text-zinc-500">{row.actor.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        {row.action}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                      {row.targetType ? `${row.targetType}/${row.targetId?.slice(-8)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 max-w-[280px]">
                      {row.metadata ? (
                        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800/40 rounded p-2 overflow-hidden">
                          {JSON.stringify(row.metadata, null, 0)}
                        </pre>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nextCursor && (
            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => load(false)} loading={loading}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
