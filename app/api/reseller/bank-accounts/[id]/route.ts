import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";

// PATCH — set default
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const { id } = await params;
    const { isDefault } = await req.json();

    const account = await db.bankAccount.findFirst({ where: { id, userId: user.id } });
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (isDefault) {
      await db.$transaction([
        db.bankAccount.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } }),
        db.bankAccount.update({ where: { id }, data: { isDefault: true } }),
      ]);
    }

    const updated = await db.bankAccount.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const { id } = await params;

    const account = await db.bankAccount.findFirst({
      where: { id, userId: user.id },
      include: { payouts: { select: { id: true }, take: 1 } },
    });
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (account.payouts.length > 0) {
      // Don't delete an account that's been used; just unset default if needed.
      return NextResponse.json(
        { error: "This bank account has been used for payouts and can't be deleted. Mark another as default instead." },
        { status: 400 }
      );
    }

    await db.bankAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
