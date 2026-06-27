import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { isDisabled, role, defaultCommissionCents, payoutThresholdCents } = body;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Admins cannot disable themselves
    if (user.id === admin.id && isDisabled === true) {
      return NextResponse.json({ error: "You cannot disable your own admin account" }, { status: 400 });
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (isDisabled !== undefined) dataToUpdate.isDisabled = Boolean(isDisabled);
    if (role !== undefined) {
      if (!["CUSTOMER", "RESELLER", "ADMIN"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      dataToUpdate.role = role;
    }
    if (defaultCommissionCents !== undefined) {
      dataToUpdate.defaultCommissionCents = defaultCommissionCents !== null ? parseInt(defaultCommissionCents) : null;
    }
    if (payoutThresholdCents !== undefined) {
      dataToUpdate.payoutThresholdCents = payoutThresholdCents !== null ? parseInt(payoutThresholdCents) : null;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isDisabled: true,
        defaultCommissionCents: true,
        payoutThresholdCents: true,
      }
    });

    await logAudit({
      actorId: admin.id,
      action: "user.updated_by_admin",
      targetType: "User",
      targetId: id,
      metadata: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            ordersToFulfill: true,
            payouts: true,
            sites: true,
          }
        }
      }
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.id === admin.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    const totalActions = user._count.orders + user._count.ordersToFulfill + user._count.payouts;
    if (totalActions > 0) {
      return NextResponse.json({
        error: `Cannot delete: this user has transaction history (${user._count.orders} bought orders, ${user._count.ordersToFulfill} fulfillments, ${user._count.payouts} payouts). Disable their account instead.`
      }, { status: 409 });
    }

    // Delete user
    await db.user.delete({ where: { id } });

    await logAudit({
      actorId: admin.id,
      action: "user.deleted_by_admin",
      targetType: "User",
      targetId: id,
      metadata: { email: user.email, name: user.name, role: user.role }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
