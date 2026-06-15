import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/auth/reset-password { token, password }
 * Validates a single-use token and sets the new password.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expires < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    // Update the password and consume the token atomically.
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Invalidate any other outstanding tokens for this user.
      db.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
    ]);

    return NextResponse.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
