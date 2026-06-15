import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendEmail, renderEmailShell } from "@/lib/email";

export const runtime = "nodejs";

const TOKEN_TTL_MINUTES = 60;

function appOrigin(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    req.headers.get("origin") ??
    "http://localhost:3000"
  );
}

/**
 * POST /api/auth/forgot-password { email }
 * Always responds 200 with the same message so the endpoint can't be used to
 * enumerate which emails have accounts. If the email maps to a user we mint a
 * single-use reset token and email a link.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (user) {
      // Invalidate any outstanding tokens for this user, then issue a fresh one.
      await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expires: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
        },
      });

      const resetUrl = `${appOrigin(req)}/reset-password?token=${rawToken}`;
      const html = await renderEmailShell({
        preheader: "Reset your password",
        bodyHtml: `
          <h2 style="margin:0 0 12px;color:#18181b;font-size:18px;">Reset your password</h2>
          <p style="margin:0 0 16px;color:#3f3f46;">We received a request to reset your password. Click the button below to choose a new one. This link expires in ${TOKEN_TTL_MINUTES} minutes.</p>
          <p style="margin:0 0 24px;"><a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Reset password</a></p>
          <p style="margin:0;color:#71717a;font-size:12px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
      });
      await sendEmail({ to: user.email, subject: "Reset your password", html });
    }

    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
