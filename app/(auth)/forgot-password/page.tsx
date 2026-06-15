"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <div className="absolute inset-0 hero-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image src="/logo.png" alt="Rankistic" width={36} height={36} className="h-9 w-9 rounded-xl bg-white object-contain p-1 shadow-lg shadow-indigo-500/30" />
            <span className="font-bold text-xl text-zinc-900 dark:text-white">Rankistic</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Forgot your password?</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-zinc-900/12 dark:shadow-black/50">
          {sent ? (
            <div className="text-center py-2">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-zinc-900 dark:text-white font-semibold mb-1">Check your inbox</p>
              <p className="text-sm text-zinc-500">
                If an account exists for <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>, a reset link is on its way. The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="email" label="Email address" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Button type="submit" className="w-full h-11 text-sm" loading={loading}>
                  Send reset link <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
          <p className="text-center text-sm text-zinc-500 mt-6">
            Remembered it?{" "}
            <Link href="/login" className="text-indigo-700 dark:text-indigo-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
