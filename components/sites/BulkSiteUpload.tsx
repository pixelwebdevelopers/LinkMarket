"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

const TEMPLATE_HEADERS = [
  "url", "name", "niche", "description", "language", "country", "example_url",
  "dr", "da", "traffic", "referring_domains", "spam_score",
  "guest_post_price", "guest_post_turnaround", "niche_edit_price", "niche_edit_turnaround",
];

const SAMPLE_ROW = [
  "https://example-blog.com", "Example Blog", "Technology",
  "A respected tech blog covering SaaS and gadgets", "English", "US",
  "https://example-blog.com/sample-post",
  "62", "55", "180000", "1200", "2",
  "180", "3", "120", "2",
];

interface RowResult {
  row: number;
  url: string;
  action: "created" | "updated" | "skipped" | "error";
  message?: string;
}
interface ImportResponse {
  summary: { total: number; created: number; updated: number; skipped: number; errors: number };
  results: RowResult[];
}

function csvEscape(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const actionStyle: Record<RowResult["action"], { icon: React.ElementType; cls: string }> = {
  created: { icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400" },
  updated: { icon: CheckCircle2, cls: "text-indigo-600 dark:text-indigo-400" },
  skipped: { icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-400" },
  error: { icon: XCircle, cls: "text-red-600 dark:text-red-400" },
};

export function BulkSiteUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResponse | null>(null);

  function downloadTemplate() {
    const content = [TEMPLATE_HEADERS.join(","), SAMPLE_ROW.map(csvEscape).join(",")].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rankistic-sites-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setResult(null);
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function handleImport() {
    if (!csv.trim()) { setError("Please choose a CSV file first."); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/reseller/sites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      setResult(data as ImportResponse);
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* How it works */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-2">How bulk import works</h3>
        <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-5">
          <li>Sites are matched by <span className="font-medium">URL</span>. Existing sites you own are updated; new URLs are created.</li>
          <li>Prices are in your currency (e.g. <span className="font-mono">180</span> = $180). Leave a price blank to skip that listing type.</li>
          <li>New sites you submit go to <span className="font-medium">pending review</span> before they appear in the marketplace.</li>
          <li>Only the columns you fill in are changed — blank cells are left untouched on existing sites.</li>
        </ul>
        <Button variant="outline" size="sm" className="mt-4" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> Download CSV template
        </Button>
      </div>

      {/* Upload */}
      <div
        className="rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {fileName ? (
          <div className="flex items-center justify-center gap-2 text-zinc-900 dark:text-white">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-sm">{fileName}</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Drop your CSV here, or click to browse</p>
            <p className="text-xs text-zinc-500 mt-1">.csv files up to 1000 rows</p>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <Button onClick={handleImport} disabled={loading || !csv} className="w-full sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {loading ? "Importing…" : "Import sites"}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Created" value={result.summary.created} cls="text-emerald-600 dark:text-emerald-400" />
            <Stat label="Updated" value={result.summary.updated} cls="text-indigo-600 dark:text-indigo-400" />
            <Stat label="Skipped" value={result.summary.skipped} cls="text-amber-600 dark:text-amber-400" />
            <Stat label="Errors" value={result.summary.errors} cls="text-red-600 dark:text-red-400" />
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Row</th>
                  <th className="text-left px-4 py-2.5 font-semibold">URL</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {result.results.map((r) => {
                  const { icon: Icon, cls } = actionStyle[r.action];
                  return (
                    <tr key={r.row} className="bg-white dark:bg-zinc-950">
                      <td className="px-4 py-2.5 text-zinc-500">{r.row}</td>
                      <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 break-all">{r.url || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 font-medium ${cls}`}>
                          <Icon className="h-4 w-4" />
                          {r.action}{r.message ? ` — ${r.message}` : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-4 text-center">
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
      <p className="text-xs text-zinc-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
