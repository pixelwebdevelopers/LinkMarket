import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";

// GET — list current user's notifications + unread count
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    const [items, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST { action: "mark_all_read" }
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { action } = await req.json();
    if (action === "mark_all_read") {
      await db.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
