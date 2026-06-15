"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2 } from "lucide-react";

export function SupportForm() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  const textareaClass =
    "w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200";

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-zinc-900 dark:text-white font-semibold mb-1">Message sent</p>
        <p className="text-sm text-zinc-500">Thanks for reaching out — we&apos;ll reply to {email} shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <Input id="name" label="Your name" placeholder="Jane Doe"
          value={name} onChange={(e) => setName(e.target.value)} required />
        <Input id="email" label="Email" type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Input id="subject" label="Subject" placeholder="How can we help?"
        value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
          Message
        </label>
        <textarea
          className={`${textareaClass} min-h-[140px]`}
          placeholder="Tell us what's going on…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto" loading={loading}>
        <Send className="h-4 w-4" /> Send message
      </Button>
    </form>
  );
}
