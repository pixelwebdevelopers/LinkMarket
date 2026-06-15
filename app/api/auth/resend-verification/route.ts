import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailEnabled, sendVerificationEmail } from "@/lib/verification";

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
 * POST /api/auth/resend-verification { email }
 * Re-sends the verification email. Always responds 200 with the same message so
 * it can't be used to probe which emails exist or are verified.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const genericMessage = "If that account exists and needs verification, a new link has been sent.";

    if (!emailEnabled()) {
      return NextResponse.json({ message: genericMessage });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (user && !user.emailVerified) {
      await sendVerificationEmail(user, appOrigin(req));
    }

    return NextResponse.json({ message: genericMessage });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
