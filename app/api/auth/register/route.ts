import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/verification";

function appOrigin(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    req.headers.get("origin") ??
    "http://localhost:3000"
  );
}

// Public registration only creates Customer accounts.
// Resellers can ONLY be created by an admin via /api/admin/resellers.
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Verification is always enabled on new account creation.
    const requireVerification = true;

    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashed,
        role: "CUSTOMER",
        emailVerified: null,
      },
    });

    await sendVerificationEmail(user, appOrigin(req));

    return NextResponse.json(
      { id: user.id, email: user.email, role: user.role, verified: !requireVerification },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
