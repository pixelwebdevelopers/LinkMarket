"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/marketplace";
  const verify = params.get("verify"); // success | expired | invalid

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    if (res?.error) {
      setLoading(false);
      setError("Invalid email or password — or your email isn't verified yet.");
      setShowResend(true);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function resendVerification() {
    if (!email) {
      setError("Enter your email above first, then resend.");
      return;
    }
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
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-2xl px-4 py-3 mb-5 animate-scale-in">
          Email verified — you can sign in now.
        </div>
      )}
      {(verify === "expired" || verify === "invalid") && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-2xl px-4 py-3 mb-5 animate-scale-in">
          That verification link is invalid or has expired. Sign in and we&apos;ll offer a new one.
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-2xl px-4 py-3 mb-5 animate-scale-in">
          {error}
        </div>
      )}
      {resent && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-2xl px-4 py-3 mb-5 animate-scale-in">
          If that account needs verification, a new link is on its way.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4.5 w-4.5" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-400 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/10 px-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-300 hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4.5 w-4.5" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password" }
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-400 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/10 px-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          loading={loading}
          className="w-full h-12 bg-white text-indigo-950 hover:bg-zinc-100 font-bold text-sm rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-xl shadow-indigo-950/20 mt-2"
        >
          Sign in <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </form>

      {showResend && !resent && (
        <p className="text-center text-xs text-slate-400 mt-5">
          Didn&apos;t get a verification email?{" "}
          <button
            type="button"
            onClick={resendVerification}
            className="text-indigo-300 font-semibold hover:text-white transition-colors underline decoration-dotted underline-offset-4"
          >
            Resend link
          </button>
        </p>
      )}

      <p className="text-center text-sm text-slate-400 mt-8">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-white font-bold hover:text-indigo-300 transition-colors"
        >
          Create one free
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-[#020617] via-[#0f172a] to-[#1e1b4b] overflow-hidden select-none">
      {/* Decorative Wave Overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-30">
        <svg className="absolute -bottom-10 -left-10 w-[600px] h-[600px] text-indigo-500/20 animate-float" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" />
        </svg>
        <svg className="absolute -top-20 -right-20 w-[700px] h-[700px] text-purple-500/20 animate-float-slow" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" />
        </svg>
      </div>

      {/* Floating Interactive Glowing Spheres */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-glow" />

      {/* Giant Floating Geometric Vector Logos (Matching Screenshot Aesthetic) */}
      <div className="absolute left-[-100px] top-1/3 w-[350px] h-[350px] opacity-10 hidden xl:block animate-float">
        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="absolute right-[-100px] bottom-1/3 w-[350px] h-[350px] opacity-10 hidden xl:block animate-float-slow">
        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>

      {/* Central Login Container */}
      <div className="relative w-full max-w-[440px] z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500 blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
              <Image
                src="/logo.png"
                alt="Rankistic"
                width={42}
                height={42}
                priority
                className="relative h-11 w-11 rounded-2xl bg-white object-contain p-1.5 shadow-2xl transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">Rankistic</span>
          </Link>
          <h1 className="text-xl font-medium text-slate-300">Sign in to your account</h1>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl shadow-black/40">
          <Suspense fallback={
            <div className="h-64 flex items-center justify-center">
              <svg className="animate-spin h-7 w-7 text-indigo-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
