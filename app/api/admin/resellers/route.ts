import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

// GET: list all resellers (admin only)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase();

    const resellers = await db.user.findMany({
      where: {
        role: "RESELLER",
        ...(q && {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        defaultCommissionCents: true,
        payoutThresholdCents: true,
        createdAt: true,
        _count: { select: { sites: true, ordersToFulfill: true } },
      },
    });

    return NextResponse.json(resellers);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: create a reseller account (admin only) OR promote an existing user
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { name, email, password, promoteExisting, defaultCommissionCents, payoutThresholdCents } = body;

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      if (!promoteExisting) {
        return NextResponse.json(
          { error: "User exists. Set promoteExisting=true to upgrade them to RESELLER.", existingUserId: existing.id },
          { status: 409 }
        );
      }
      const updated = await db.user.update({
        where: { id: existing.id },
        data: {
          role: "RESELLER",
          defaultCommissionCents: defaultCommissionCents ?? null,
          payoutThresholdCents: payoutThresholdCents ?? null,
        },
      });
      await logAudit({
        actorId: admin.id,
        action: "reseller.promoted",
        targetType: "User",
        targetId: existing.id,
        metadata: { defaultCommissionCents, payoutThresholdCents },
      });
      await notify({
        userId: existing.id,
        type: "GENERIC",
        title: "You are now a Reseller",
        body: "An admin upgraded your account. You can now list sites for sale on the marketplace.",
        link: "/reseller",
        email: true,
      });
      return NextResponse.json({ id: updated.id, email: updated.email, role: updated.role }, { status: 200 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password (min 8 chars) required for new reseller" }, { status: 400 });
    }
    if (!name) return NextResponse.json({ error: "Name required for new reseller" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "RESELLER",
        defaultCommissionCents: defaultCommissionCents ?? null,
        payoutThresholdCents: payoutThresholdCents ?? null,
      },
    });
    await logAudit({
      actorId: admin.id,
      action: "reseller.created",
      targetType: "User",
      targetId: user.id,
      metadata: { defaultCommissionCents, payoutThresholdCents },
    });
    await notify({
      userId: user.id,
      type: "GENERIC",
      title: "Your Reseller account is ready",
      body: `An admin created your reseller account on the marketplace. Sign in to start listing sites.`,
      link: "/login",
      email: true,
    });

    return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
