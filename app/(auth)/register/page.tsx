"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Registration failed."); setLoading(false); return; }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}
      <p className="text-xs text-zinc-500 mb-5">
        Registering creates a customer account. Reseller accounts are created by our team — contact us at{" "}
        <a href="mailto:support@linkmarket.io" className="text-indigo-700 dark:text-indigo-400">support@linkmarket.io</a>{" "}
        to apply.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" label="Full name" placeholder="John Smith"
          value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <Input id="email" label="Email address" type="email" placeholder="you@example.com"
          value={form.email} onChange={(e) => update("email", e.target.value)} required />
        <Input id="password" label="Password" type="password" placeholder="Min. 8 characters"
          value={form.password} onChange={(e) => update("password", e.target.value)} required hint="At least 8 characters" />
        <Button type="submit" className="w-full h-11 text-sm" loading={loading}>
          Create Account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="text-center text-sm text-zinc-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-700 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Sign in</Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <div className="absolute inset-0 hero-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl animate-pulse-glow" />
      </div>
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-zinc-900 dark:text-white">Link<span className="text-indigo-700 dark:text-indigo-400">Market</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create your account</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">Free to join. No subscription required.</p>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-zinc-900/12 dark:shadow-black/50">
          <Suspense fallback={<div className="h-72 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-xl" />}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
