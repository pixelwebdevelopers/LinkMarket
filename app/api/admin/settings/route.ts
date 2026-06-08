import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/authz";
import { getAllSettings, setSetting, DEFAULT_SETTINGS, type SettingKey } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getAllSettings();
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const allowedKeys = Object.keys(DEFAULT_SETTINGS) as SettingKey[];
    // Use a mutable record — DEFAULT_SETTINGS uses `as const` which makes its keys
    // readonly, so `Partial<typeof DEFAULT_SETTINGS>` would block reassignment.
    const updates: Record<string, unknown> = {};
    for (const k of allowedKeys) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid setting keys provided" }, { status: 400 });
    }

    // Light validation
    if (updates.globalCommissionCents !== undefined) {
      const v = Number(updates.globalCommissionCents);
      if (!Number.isInteger(v) || v < 0) {
        return NextResponse.json(
          { error: "globalCommissionCents must be a non-negative integer (cents)" },
          { status: 400 }
        );
      }
      updates.globalCommissionCents = v;
    }
    if (updates.payoutThresholdCents !== undefined) {
      const v = Number(updates.payoutThresholdCents);
      if (!Number.isInteger(v) || v < 0) {
        return NextResponse.json({ error: "payoutThresholdCents must be a non-negative integer" }, { status: 400 });
      }
      updates.payoutThresholdCents = v;
    }

    for (const [k, v] of Object.entries(updates)) {
      await setSetting(k as SettingKey, v as never);
    }

    await logAudit({
      actorId: admin.id,
      action: "settings.updated",
      metadata: updates as Record<string, unknown>,
    });

    const settings = await getAllSettings();
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
