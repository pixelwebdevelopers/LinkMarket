"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; email: string; role: string };
}

export function MessageThread({ orderId }: { orderId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const res = await fetch(`/api/orders/${orderId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    const created = await res.json();
    setMessages((prev) => [...prev, created]);
    setBody("");
  }

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
      <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4" /> Messages
      </h2>

      <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="h-20 animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 rounded-xl" />
        ) : messages.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">No messages yet. Start the conversation below.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender.id === session?.user?.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    mine
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm"
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70 mb-0.5">
                    {m.sender.name ?? m.sender.email} · {m.sender.role}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn("text-[10px] mt-1", mine ? "opacity-80" : "text-zinc-500")}>
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a message..."
          className="flex-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
        />
        <Button type="submit" loading={sending} disabled={!body.trim()}>
          <Send className="h-4 w-4" /> Send
        </Button>
      </form>

      {error && <p className="text-xs text-red-700 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}
