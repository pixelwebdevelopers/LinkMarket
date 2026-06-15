"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center py-2">
        <p className="text-zinc-900 dark:text-white font-semibold mb-1">Invalid reset link</p>
        <p className="text-sm text-zinc-500 mb-5">This link is missing its token. Please request a new one.</p>
        <Link href="/forgot-password">
          <Button variant="outline" className="w-full">Request a new link</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-2">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-zinc-900 dark:text-white font-semibold mb-1">Password updated</p>
        <p className="text-sm text-zinc-500">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="password" label="New password" type="password" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Input id="confirm" label="Confirm new password" type="password" placeholder="••••••••"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <Button type="submit" className="w-full h-11 text-sm" loading={loading}>
          Update password <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Choose a new password</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">Pick something secure you&apos;ll remember.</p>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-zinc-900/12 dark:shadow-black/50">
          <Suspense fallback={<div className="h-40 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-xl" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
