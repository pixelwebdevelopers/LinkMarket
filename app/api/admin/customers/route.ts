import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase();

    const customers = await db.user.findMany({
      where: {
        role: "CUSTOMER",
        ...(q && {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      take: 200,
    });

    // sum total spent per customer (in cents)
    const spendByCustomer = await db.order.groupBy({
      by: ["customerId"],
      where: { customerId: { in: customers.map((c) => c.id) }, status: { not: "PENDING_PAYMENT" } },
      _sum: { pricePaidCents: true },
    });
    const spendMap = new Map(spendByCustomer.map((s) => [s.customerId, s._sum.pricePaidCents ?? 0]));

    const result = customers.map((c) => ({ ...c, totalSpentCents: spendMap.get(c.id) ?? 0 }));
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
