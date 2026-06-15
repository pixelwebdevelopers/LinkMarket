import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendEmail, renderEmailShell } from "@/lib/email";

const TOKEN_TTL_HOURS = 24;

/**
 * Whether any email transport is configured. Verification is only ENFORCED when
 * we can actually send the verification email — otherwise new accounts are
 * auto-verified so the app keeps working before SMTP is set up.
 *
 * NB: this is a plain env check (no imports of the email transports) so it's
 * cheap to call from the auth layer.
 */
export function emailEnabled(): boolean {
  return Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY);
}

/**
 * Mint a fresh single-use verification token for a user and email them the link.
 * Returns false if the email couldn't be sent.
 */
export async function sendVerificationEmail(
  user: { id: string; email: string; name?: string | null },
  origin: string
): Promise<boolean> {
  // Invalidate outstanding tokens, then issue a new one.
  await db.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await db.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expires: new Date(Date.now() + TOKEN_TTL_HOURS * 3_600_000),
    },
  });

  const verifyUrl = `${origin}/api/auth/verify-email?token=${rawToken}`;
  const html = await renderEmailShell({
    preheader: "Confirm your email address",
    bodyHtml: `
      <h2 style="margin:0 0 12px;color:#18181b;font-size:18px;">Confirm your email</h2>
      <p style="margin:0 0 16px;color:#3f3f46;">Welcome${user.name ? `, ${escapeText(user.name)}` : ""}! Please confirm your email address to activate your account. This link expires in ${TOKEN_TTL_HOURS} hours.</p>
      <p style="margin:0 0 24px;"><a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Verify email</a></p>
      <p style="margin:0;color:#71717a;font-size:12px;">If you didn't create an account, you can safely ignore this email.</p>`,
  });

  return sendEmail({ to: user.email, subject: "Confirm your email", html });
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
