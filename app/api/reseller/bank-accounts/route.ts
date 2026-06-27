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
    const {
      label,
      accountName,
      methodType = "BANK_WIRE",
      paypalEmail,
      stripeEmail,
      accountNumber,
      routingNumber,
      iban,
      swift,
      bankName,
      country,
      isDefault
    } = body;

    if (!label || !accountName) {
      return NextResponse.json({ error: "label and accountName are required" }, { status: 400 });
    }

    if (methodType === "PAYPAL") {
      if (!paypalEmail) {
        return NextResponse.json({ error: "PayPal email is required" }, { status: 400 });
      }
    } else if (methodType === "STRIPE") {
      if (!stripeEmail) {
        return NextResponse.json({ error: "Stripe email/account is required" }, { status: 400 });
      }
    } else {
      // BANK_WIRE
      if (!accountNumber && !iban) {
        return NextResponse.json({ error: "Provide an account number or IBAN" }, { status: 400 });
      }
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
          methodType: methodType as any,
          paypalEmail: methodType === "PAYPAL" ? paypalEmail : null,
          stripeEmail: methodType === "STRIPE" ? stripeEmail : null,
          accountNumber: methodType === "BANK_WIRE" ? (accountNumber ?? null) : null,
          routingNumber: methodType === "BANK_WIRE" ? (routingNumber ?? null) : null,
          iban: methodType === "BANK_WIRE" ? (iban ?? null) : null,
          swift: methodType === "BANK_WIRE" ? (swift ?? null) : null,
          bankName: methodType === "BANK_WIRE" ? (bankName ?? null) : null,
          country: methodType === "BANK_WIRE" ? (country ?? null) : null,
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
