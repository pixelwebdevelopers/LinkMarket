import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/authz";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const accounts = await db.bankAccount.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(accounts);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("RESELLER", "ADMIN");
    const body = await req.json();
    const { label, accountName, accountNumber, routingNumber, iban, swift, bankName, country, isDefault } = body;

    if (!label || !accountName) {
      return NextResponse.json({ error: "label and accountName are required" }, { status: 400 });
    }
    if (!accountNumber && !iban) {
      return NextResponse.json({ error: "Provide an account number or IBAN" }, { status: 400 });
    }

    const existingCount = await db.bankAccount.count({ where: { userId: user.id } });
    const makeDefault = isDefault || existingCount === 0;

    const created = await db.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.bankAccount.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.bankAccount.create({
        data: {
          userId: user.id,
          label,
          accountName,
          accountNumber: accountNumber ?? null,
          routingNumber: routingNumber ?? null,
          iban: iban ?? null,
          swift: swift ?? null,
          bankName: bankName ?? null,
          country: country ?? null,
          isDefault: makeDefault,
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
