"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Shield, Clock } from "lucide-react";

interface OrderFormProps {
  listing: {
    id: string;
    type: string;
    price: number;
    turnaroundDays: number;
    includesContent: boolean;
  };
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

    const res = await fetch("/api/orders", {
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

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to place order.");
      setLoading(false);
      return;
    }

    router.push(`/orders/${data.id}?success=true`);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-gray-900 text-lg">Place Order</h2>
        <span className="text-2xl font-bold text-indigo-600">{formatCurrency(listing.price)}</span>
      </div>
      <p className="text-xs text-gray-400 mb-6">One-time payment · No subscription</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Article content <span className="text-gray-400 font-normal">(optional — we&apos;ll write it if empty)</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              placeholder="Paste your article here, or leave blank and we'll write it for you..."
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={2}
            placeholder="Any specific instructions for the publisher..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {session ? `Pay ${formatCurrency(listing.price)}` : "Sign in to Order"}
        </Button>
      </form>

      <div className="mt-4 space-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          Delivered within {listing.turnaroundDays} business days
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-gray-400" />
          12-month link replacement guarantee
        </div>
      </div>
    </div>
  );
}
