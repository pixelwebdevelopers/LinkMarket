import type { Metadata } from "next";
import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { SupportForm } from "@/components/support/SupportForm";
import { Mail, MessageSquare, LifeBuoy, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Support – Rankistic",
  description: "Get help with your Rankistic account, orders, payments, and listings.",
};

const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse the marketplace, open a listing, fill in your target URL and anchor text, then complete payment. You'll be notified at every step of fulfillment.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards are processed securely through Stripe. You'll receive a receipt by email once payment succeeds.",
  },
  {
    q: "When will my link go live?",
    a: "Most orders are delivered within the turnaround time shown on each listing. You can track status in real time from your Orders page.",
  },
  {
    q: "How do refunds and disputes work?",
    a: "If something isn't right, open a dispute from the order page. Our team reviews every dispute and issues a refund where warranted.",
  },
  {
    q: "I'm a publisher — how do I list my site?",
    a: "Create an account and contact us to be upgraded to a reseller. Once approved, you can add sites individually or in bulk via CSV.",
  },
];

export default async function SupportPage() {
  const supportEmail = await getSetting("supportEmail");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <LifeBuoy className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">How can we help?</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Search the FAQ below or send us a message — we usually reply within one business day.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-5 gap-10">
        {/* Left: FAQ + quick contacts */}
        <div className="lg:col-span-3 space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-4 [&_summary]:cursor-pointer">
                  <summary className="font-medium text-zinc-900 dark:text-white text-sm list-none flex items-center justify-between">
                    {f.q}
                    <span className="text-zinc-400 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <a href={`mailto:${supportEmail}`} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-5 hover:border-indigo-500/40 transition-colors">
              <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2" />
              <p className="font-medium text-zinc-900 dark:text-white text-sm">Email us</p>
              <p className="text-sm text-zinc-500 break-all">{supportEmail}</p>
            </a>
            <Link href="/orders" className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-5 hover:border-indigo-500/40 transition-colors">
              <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2" />
              <p className="font-medium text-zinc-900 dark:text-white text-sm">Order question?</p>
              <p className="text-sm text-zinc-500">Message us right from your order.</p>
            </Link>
          </div>
        </div>

        {/* Right: contact form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-6 shadow-xl shadow-zinc-900/5 dark:shadow-black/30 lg:sticky lg:top-24">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-1">Send us a message</h2>
            <p className="text-sm text-zinc-500 mb-5">We&apos;ll reply by email.</p>
            <SupportForm />
          </div>
        </div>
      </div>
    </div>
  );
}
