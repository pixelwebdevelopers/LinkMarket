import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const result = await db.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true, updated: result.count });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
