import { db } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  globalCommissionPct: 20, // percent added on top of reseller's base price
  payoutThresholdCents: 5000, // $50.00 minimum payout
  currency: "USD" as const,
  platformName: "LinkMarket",
  supportEmail: "support@linkmarket.io",
  notifyAdminOnNewOrder: true,
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type SettingValue<K extends SettingKey> = (typeof DEFAULT_SETTINGS)[K];

/** Read a single setting, falling back to default. */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return DEFAULT_SETTINGS[key];
  return row.value as SettingValue<K>;
}

/** Read all settings, with defaults applied where rows are missing. */
export async function getAllSettings(): Promise<typeof DEFAULT_SETTINGS> {
  const rows = await db.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const result = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
    if (map[k] !== undefined) (result as any)[k] = map[k];
  }
  return result;
}

/** Upsert a setting. */
export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>
): Promise<void> {
  await db.setting.upsert({
    where: { key },
    create: { key, value: value as any },
    update: { value: value as any },
  });
}

/** Seed any missing default settings rows (idempotent). */
export async function seedDefaultSettings(): Promise<void> {
  const existing = await db.setting.findMany({ select: { key: true } });
  const have = new Set(existing.map((s) => s.key));
  const missing = (Object.keys(DEFAULT_SETTINGS) as SettingKey[]).filter((k) => !have.has(k));
  if (missing.length === 0) return;
  await db.setting.createMany({
    data: missing.map((k) => ({ key: k, value: DEFAULT_SETTINGS[k] as any })),
  });
}
