"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Clock } from "lucide-react";

interface OrderFormProps {
  listing: {
    id: string;
    type: string;
    /** Customer-facing price in cents, already commission-adjusted. */
    finalPriceCents: number;
    turnaroundDays: number;
    includesContent: boolean;
  };
}

function fmtCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export function OrderForm({ listing }: OrderFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const [notes, setNotes] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push(`/login?callbackUrl=/marketplace/${listing.id}`);
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 1. Create the pending-payment order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          targetUrl,
          anchorText,
          notes,
          contentBody: listing.includesContent ? undefined : contentBody,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error ?? "Failed to create order.");

      // 2. Create Stripe Checkout Session
      const checkoutRes = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.id }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        // If checkout fails (e.g. Stripe not configured) we still land on the order page.
        // The order remains PENDING_PAYMENT and the customer can retry.
        router.push(`/orders/${orderData.id}?error=${encodeURIComponent(checkoutData.error ?? "Checkout failed")}`);
        return;
      }

      // 3. Redirect to Stripe-hosted checkout
      window.location.href = checkoutData.url;
    } catch (err: any) {
      setError(err.message ?? String(err));
      setLoading(false);
    }
  }

  const textareaClass =
    "w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-zinc-200 dark:focus:bg-zinc-800 transition-all duration-200";

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-900/10 dark:shadow-black/40 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-zinc-900 dark:text-white text-lg">Place Order</h2>
        <span className="text-2xl font-bold gradient-text">{fmtCents(listing.finalPriceCents)}</span>
      </div>
      <p className="text-xs text-zinc-500 mb-6">One-time payment · No subscription</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleOrder} className="space-y-4">
        <Input
          label="Your URL to link to"
          placeholder="https://yourwebsite.com/page"
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          required
        />
        <Input
          label="Anchor text"
          placeholder="e.g. best SEO tools"
          value={anchorText}
          onChange={(e) => setAnchorText(e.target.value)}
          required
        />

        {!listing.includesContent && (
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
              Article content <span className="text-zinc-500 font-normal normal-case tracking-normal">(optional — we&apos;ll write it if empty)</span>
            </label>
            <textarea
              className={`${textareaClass} min-h-[100px]`}
              placeholder="Paste your article here, or leave blank and we'll write it for you..."
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
            Notes <span className="text-zinc-500 font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            className={textareaClass}
            rows={2}
            placeholder="Any specific instructions for the publisher..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {session ? `Pay ${fmtCents(listing.finalPriceCents)}` : "Sign in to Order"}
        </Button>
      </form>

      <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
          Delivered within {listing.turnaroundDays} business days
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
          12-month link replacement guarantee
        </div>
      </div>
    </div>
  );
}
