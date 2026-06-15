import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";
import { getSetting } from "@/lib/settings";

const fromAddress = process.env.EMAIL_FROM ?? "Rankistic <notifications@rankistic.com>";

// ── Transport selection ──────────────────────────────────────────────────────
// Priority: SMTP (free, "PHP mail"-style) → Resend (API) → disabled (log only).
// To use SMTP, set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in env. Any free
// provider works (Gmail app password, Brevo, Mailtrap, Mailgun, etc.).
const smtpHost = process.env.SMTP_HOST;
const resendApiKey = process.env.RESEND_API_KEY;

let smtpTransport: Transporter | null = null;
function getSmtpTransport(): Transporter | null {
  if (!smtpHost) return null;
  if (!smtpTransport) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    smtpTransport = nodemailer.createTransport({
      host: smtpHost,
      port,
      // true for 465 (implicit TLS), false for 587/25 (STARTTLS)
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth:
        process.env.SMTP_USER || process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }
  return smtpTransport;
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/** Which transport is active — handy for diagnostics / the support page. */
export function emailTransport(): "smtp" | "resend" | "disabled" {
  if (smtpHost) return "smtp";
  if (resend) return "resend";
  return "disabled";
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send an email via SMTP (preferred) or Resend.
 * Returns true on success, false on failure or if email is disabled.
 * Never throws — callers must not depend on email for business logic.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const transport = getSmtpTransport();

  // 1. SMTP (nodemailer)
  if (transport) {
    try {
      await transport.sendMail({
        from: fromAddress,
        to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
      });
      return true;
    } catch (err) {
      console.error("[email] smtp send failed", err);
      return false;
    }
  }

  // 2. Resend (API fallback)
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: fromAddress,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
      });
      if (result.error) {
        console.error("[email] resend error", result.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[email] resend send failed", err);
      return false;
    }
  }

  // 3. Disabled — no transport configured
  console.warn("[email] no SMTP_HOST or RESEND_API_KEY set — skipping send to", input.to);
  return false;
}

/** Wrap body content in a minimal branded HTML shell. */
export async function renderEmailShell(opts: {
  preheader?: string;
  bodyHtml: string;
}): Promise<string> {
  const platformName = await getSetting("platformName");
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b;">
  ${opts.preheader ? `<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(opts.preheader)}</div>` : ""}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;">
    <tr><td style="padding:24px 32px;border-bottom:1px solid #e4e4e7;">
      <span style="font-weight:700;font-size:18px;color:#18181b;">${escapeHtml(platformName)}</span>
    </td></tr>
    <tr><td style="padding:32px;font-size:14px;line-height:1.55;color:#3f3f46;">
      ${opts.bodyHtml}
    </td></tr>
    <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;">
      You're receiving this because of activity on your ${escapeHtml(platformName)} account.
    </td></tr>
  </table>
</body></html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
