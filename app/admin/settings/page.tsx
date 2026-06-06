"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { Save, CheckCircle } from "lucide-react";

interface Settings {
  globalCommissionPct: number;
  payoutThresholdCents: number;
  currency: string;
  platformName: string;
  supportEmail: string;
  notifyAdminOnNewOrder: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setSettings(d);
        setLoading(false);
      });
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Save failed");
    else {
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (loading)
    return (
      <PageContainer width="narrow">
        <div className="h-96 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      </PageContainer>
    );

  if (error || !settings)
    return (
      <PageContainer width="narrow">
        <div className="text-red-700 dark:text-red-400">{error ?? "Failed to load."}</div>
      </PageContainer>
    );

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Platform settings"
        description="Defaults that apply across the platform. Reseller- and site-level overrides take precedence."
      />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
        <Field label="Global commission (%)" hint="Added on top of a reseller's base price to compute the customer-facing price.">
          <Input
            type="number"
            step="0.5"
            min={0}
            max={200}
            value={String(settings.globalCommissionPct)}
            onChange={(e) => setSettings({ ...settings, globalCommissionPct: parseFloat(e.target.value || "0") })}
          />
        </Field>

        <Field label="Payout threshold (cents)" hint="Minimum reseller balance required to request a payout. 5000 = $50.00">
          <Input
            type="number"
            min={0}
            step={100}
            value={String(settings.payoutThresholdCents)}
            onChange={(e) => setSettings({ ...settings, payoutThresholdCents: parseInt(e.target.value || "0") })}
          />
        </Field>

        <Field label="Platform name">
          <Input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} />
        </Field>

        <Field label="Support email">
          <Input
            type="email"
            value={settings.supportEmail}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
          />
        </Field>

        <Field label="Currency">
          <Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })} />
        </Field>

        <label className="flex items-start gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={settings.notifyAdminOnNewOrder}
            onChange={(e) => setSettings({ ...settings, notifyAdminOnNewOrder: e.target.checked })}
            className="h-4 w-4 mt-0.5 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-indigo-500 accent-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Notify admins on every new order</p>
            <p className="text-xs text-zinc-500">
              Sends in-app + email notification to all admin users whenever a customer places an order.
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <Button onClick={save} loading={saving}>
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" /> Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save changes
            </>
          )}
        </Button>
        {error && <span className="text-sm text-red-700 dark:text-red-400">{error}</span>}
      </div>
    </PageContainer>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-1.5">{label}</p>
      {children}
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
}
