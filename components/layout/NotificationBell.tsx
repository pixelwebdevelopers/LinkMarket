"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* ignore transient errors */
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  if (status !== "authenticated") return null;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    setUnread(0);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative h-9 w-9 grid place-items-center rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center ring-2 ring-white dark:ring-zinc-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-zinc-900/12 dark:shadow-black/50 z-50 animate-scale-in origin-top-right max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <p className="font-semibold text-zinc-900 dark:text-white text-sm">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {items.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-10">You're all caught up.</p>
              ) : (
                items.map((n) => (
                  <NotificationRow key={n.id} item={n} onMarkRead={markRead} onClose={() => setOpen(false)} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationRow({
  item,
  onMarkRead,
  onClose,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const isUnread = !item.readAt;
  const Wrapper: any = item.link ? Link : "div";
  const props = item.link
    ? {
        href: item.link,
        onClick: () => {
          if (isUnread) onMarkRead(item.id);
          onClose();
        },
      }
    : {};

  return (
    <Wrapper {...props}>
      <div
        className={cn(
          "px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 flex gap-3 transition-colors",
          isUnread && "bg-indigo-500/5",
          item.link && "hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
        )}
      >
        <div
          className={cn(
            "h-2 w-2 rounded-full shrink-0 mt-2",
            isUnread ? "bg-indigo-500" : "bg-transparent"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.title}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{item.body}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
        </div>
        {isUnread && !item.link && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(item.id);
            }}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            title="Mark read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </Wrapper>
  );
}
