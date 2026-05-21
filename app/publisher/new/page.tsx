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

export default function NewSitePage() {
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

    const res = await fetch("/api/publisher/sites", {
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

    router.push("/publisher?submitted=true");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Site</h1>
      <p className="text-gray-500 text-sm mb-8">
        Our team will review your site and approve it within 48 hours. You&apos;ll be notified by email.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Site Info */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Site Information</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Briefly describe your site, audience, and content type..."
              value={site.description}
              onChange={(e) => updateSite("description", e.target.value)}
            />
          </div>
        </section>

        {/* Listings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Link Packages</h2>
            <Button type="button" variant="outline" size="sm" onClick={addListing}>
              <PlusCircle className="h-4 w-4" /> Add Package
            </Button>
          </div>

          {listings.map((listing, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-700">Package {i + 1}</h3>
                {listings.length > 1 && (
                  <button type="button" onClick={() => removeListing(i)} className="text-red-400 hover:text-red-600">
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
                    { value: "TIER2", label: "Tier 2" },
                  ]}
                  value={listing.type}
                  onChange={(e) => updateListing(i, "type", e.target.value)}
                />
                <Input
                  label="Price (USD)"
                  type="number"
                  placeholder="50"
                  value={listing.price}
                  onChange={(e) => updateListing(i, "price", e.target.value)}
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
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={listing.doFollow}
                    onChange={(e) => updateListing(i, "doFollow", e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  DoFollow link
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={listing.includesContent}
                    onChange={(e) => updateListing(i, "includesContent", e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  Content writing included
                </label>
              </div>
            </div>
          ))}
        </section>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Submit Site for Review
        </Button>
      </form>
    </div>
  );
}
