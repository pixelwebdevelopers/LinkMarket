"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Clock } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

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
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("Document must be smaller than 10MB.");
      setFile(null);
      e.target.value = "";
      return;
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowed.includes(selected.type) && !selected.name.endsWith(".doc") && !selected.name.endsWith(".docx") && !selected.name.endsWith(".pdf")) {
      setError("Only PDF and Word documents (.pdf, .doc, .docx) are allowed.");
      setFile(null);
      e.target.value = "";
      return;
    }
    setError("");
    setFile(selected);
  };

  async function uploadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push(`/login?callbackUrl=/marketplace/${listing.id}`);
      return;
    }
    setLoading(true);
    setError("");

    try {
      let uploadedUrl = "";
      if (file) {
        setUploadProgress(1);
        uploadedUrl = await uploadFile(file);
      }

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
          documentUrl: uploadedUrl || undefined,
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
        router.push(`/orders/${orderData.id}?error=${encodeURIComponent(checkoutData.error ?? "Checkout failed")}`);
        return;
      }

      // 3. Redirect to Stripe-hosted checkout
      window.location.href = checkoutData.url;
    } catch (err) {
      setError((err as Error).message ?? String(err));
      setUploadProgress(0);
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

        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 bg-zinc-200/20 dark:bg-zinc-800/10">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wide">
            {listing.includesContent ? "Upload brief or details doc" : "OR Upload Article Document"}
          </label>
          <p className="text-[10px] text-zinc-500 mb-2">Max 10MB (.pdf, .doc, .docx)</p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          {file && (
            <p className="text-xs text-emerald-600 font-medium mt-2">
              ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB) ready to upload
            </p>
          )}
          {uploadProgress > 0 && (
            <div className="mt-2 space-y-1">
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-[10px] text-zinc-500 text-right">Uploading: {uploadProgress}%</p>
            </div>
          )}
        </div>

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
