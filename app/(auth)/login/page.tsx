"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const verify = params.get("verify"); // success | expired | invalid
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [showResend, setShowResend] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResent(false);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      // Login can fail for wrong credentials OR an unverified email. We can't
      // tell which from the response, so offer the resend path either way.
      setError("Invalid email or password — or your email isn't verified yet.");
      setShowResend(true);
    } else { router.push(callbackUrl); router.refresh(); }
  }

  async function resendVerification() {
    if (!email) { setError("Enter your email above first, then resend."); return; }
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResent(true);
  }

  return (
    <>
      {verify === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl px-4 py-3 mb-5">
          Email verified — you can sign in now.
        </div>
      )}
      {(verify === "expired" || verify === "invalid") && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm rounded-xl px-4 py-3 mb-5">
          That verification link is invalid or has expired. Sign in and we&apos;ll offer a new one.
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}
      {resent && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl px-4 py-3 mb-5">
          If that account needs verification, a new link is on its way.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" label="Email address" type="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div>
          <Input id="password" label="Password" type="password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="text-right mt-1.5">
            <Link href="/forgot-password" className="text-xs text-indigo-700 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" className="w-full h-11 text-sm" loading={loading}>
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      {(showResend || verify === "expired" || verify === "invalid") && !resent && (
        <p className="text-center text-xs text-zinc-500 mt-4">
          Didn&apos;t get a verification email?{" "}
          <button type="button" onClick={resendVerification} className="text-indigo-700 dark:text-indigo-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
            Resend link
          </button>
        </p>
      )}
      <p className="text-center text-sm text-zinc-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-indigo-700 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          Create one free
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Background glow */}
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome back</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">Sign in to your account to continue</p>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-zinc-900/12 dark:shadow-black/50">
          <Suspense fallback={<div className="h-48 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
