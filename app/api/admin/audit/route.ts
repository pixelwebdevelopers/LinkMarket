import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const cursor = searchParams.get("cursor");
    const action = searchParams.get("action");
    const actorId = searchParams.get("actorId");

    const where: any = {};
    if (action) where.action = { contains: action };
    if (actorId) where.actorId = actorId;

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
    });
    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ items, nextCursor });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
