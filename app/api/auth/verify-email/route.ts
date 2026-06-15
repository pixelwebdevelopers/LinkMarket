import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function appOrigin(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    req.headers.get("origin") ??
    "http://localhost:3000"
  );
}

/**
 * GET /api/auth/verify-email?token=...
 * Confirms a user's email and redirects to the login page with a status flag.
 * Using GET so the link in the email works on click.
 */
export async function GET(req: NextRequest) {
  const origin = appOrigin(req);
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${origin}/login?verify=invalid`);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await db.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expires < new Date()) {
    return NextResponse.redirect(`${origin}/login?verify=expired`);
  }

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    db.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.emailVerificationToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);

  return NextResponse.redirect(`${origin}/login?verify=success`);
}
