"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";

const NICHES = [
  "Technology", "Finance", "Health", "Travel", "Food", "Fashion", "Sports",
  "Education", "Real Estate", "SaaS", "E-commerce", "iGaming", "Crypto",
  "Marketing", "Legal", "Business", "Other",
];
const LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Other"];
const COUNTRIES = ["US", "UK", "CA", "AU", "DE", "FR", "ES", "IT", "PL", "Other"];

const defaultListing = {
  type: "GUEST_POST",
  price: "",
  turnaroundDays: "3",
  doFollow: true,
  includesContent: false,
  wordCount: "500",
  extraNotes: "",
};

interface SiteSubmissionFormProps {
  /** Where to redirect after a successful submission */
  redirectTo: string;
  /** Optional override of the API endpoint (defaults to /api/reseller/sites) */
  endpoint?: string;
  /** Optional copy override above the form */
  intro?: string;
}

export function SiteSubmissionForm({
  redirectTo,
  endpoint = "/api/reseller/sites",
  intro,
}: SiteSubmissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [site, setSite] = useState({
    url: "",
    name: "",
    description: "",
    language: "English",
    country: "US",
    niche: "Technology",
    exampleUrl: "",
  });
  const [listings, setListings] = useState([{ ...defaultListing }]);

  function updateSite(field: string, value: string) {
    setSite((prev) => ({ ...prev, [field]: value }));
  }
  function updateListing(index: number, field: string, value: any) {
    setListings((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }
  function addListing() {
    setListings((prev) => [...prev, { ...defaultListing }]);
  }
  function removeListing(index: number) {
    setListings((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...site, listings }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to submit site.");
      setLoading(false);
      return;
    }
    router.push(redirectTo);
  }

  return (
    <>
      {intro && <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{intro}</p>}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Site information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Site URL"
              placeholder="https://yoursite.com"
              type="url"
              value={site.url}
              onChange={(e) => updateSite("url", e.target.value)}
              required
            />
            <Input
              label="Site Name"
              placeholder="My Awesome Blog"
              value={site.name}
              onChange={(e) => updateSite("name", e.target.value)}
              required
            />
            <Select
              label="Niche"
              options={NICHES.map((n) => ({ value: n, label: n }))}
              value={site.niche}
              onChange={(e) => updateSite("niche", e.target.value)}
            />
            <Select
              label="Language"
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
              value={site.language}
              onChange={(e) => updateSite("language", e.target.value)}
            />
            <Select
              label="Primary Country"
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              value={site.country}
              onChange={(e) => updateSite("country", e.target.value)}
            />
            <Input
              label="Example live link (optional)"
              placeholder="https://yoursite.com/article-with-link"
              type="url"
              value={site.exampleUrl}
              onChange={(e) => updateSite("exampleUrl", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
              Site Description <span className="text-zinc-500 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              className="w-full rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
              rows={3}
              placeholder="Briefly describe your site, audience, and content type..."
              value={site.description}
              onChange={(e) => updateSite("description", e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Link packages</h2>
            <Button type="button" variant="outline" size="sm" onClick={addListing}>
              <PlusCircle className="h-4 w-4" /> Add package
            </Button>
          </div>

          {listings.map((listing, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-zinc-700 dark:text-zinc-300">Package {i + 1}</h3>
                {listings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeListing(i)}
                    className="text-zinc-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Select
                  label="Type"
                  options={[
                    { value: "GUEST_POST", label: "Guest Post" },
                    { value: "NICHE_EDIT", label: "Niche Edit" },
                  ]}
                  value={listing.type}
                  onChange={(e) => updateListing(i, "type", e.target.value)}
                />
                <Input
                  label="Base Price (USD)"
                  type="number"
                  placeholder="50"
                  value={listing.price}
                  onChange={(e) => updateListing(i, "price", e.target.value)}
                  hint="What you earn per order. Customer pays this + platform commission."
                  required
                />
                <Input
                  label="Turnaround (days)"
                  type="number"
                  placeholder="3"
                  value={listing.turnaroundDays}
                  onChange={(e) => updateListing(i, "turnaroundDays", e.target.value)}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {listing.type === "GUEST_POST" && (
                  <Input
                    label="Word Count"
                    type="number"
                    placeholder="500"
                    value={listing.wordCount}
                    onChange={(e) => updateListing(i, "wordCount", e.target.value)}
                  />
                )}
                <Input
                  label="Publisher Notes (optional)"
                  placeholder="e.g. No casino/adult content"
                  value={listing.extraNotes}
                  onChange={(e) => updateListing(i, "extraNotes", e.target.value)}
                />
              </div>
              <div className="flex gap-6 text-sm text-zinc-700 dark:text-zinc-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={listing.doFollow}
                    onChange={(e) => updateListing(i, "doFollow", e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-indigo-500 accent-indigo-500"
                  />
                  DoFollow link
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={listing.includesContent}
                    onChange={(e) => updateListing(i, "includesContent", e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-indigo-500 accent-indigo-500"
                  />
                  Content writing included
                </label>
              </div>
            </div>
          ))}
        </section>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Submit site
        </Button>
      </form>
    </>
  );
}
