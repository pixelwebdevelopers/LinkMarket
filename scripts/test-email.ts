/**
 * Send a test email to verify SMTP credentials.
 *
 *   npx tsx scripts/test-email.ts you@youremail.com
 *
 * Reads the same SMTP_* / EMAIL_FROM vars from .env that the app uses, so a
 * success here means order/payment/verification emails will send too.
 */
import "dotenv/config";
import nodemailer from "nodemailer";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npx tsx scripts/test-email.ts <recipient@example.com>");
    process.exit(1);
  }
  if (!process.env.SMTP_HOST) {
    console.error("✗ SMTP_HOST is not set in .env — nothing to test.");
    process.exit(1);
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth:
      process.env.SMTP_USER || process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  console.log(`→ Verifying connection to ${process.env.SMTP_HOST}:${port} …`);
  await transport.verify();
  console.log("✓ SMTP connection + auth OK");

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Rankistic SMTP test ✅",
    text: "If you're reading this, your SMTP settings work. Emails will send.",
    html: "<p>If you're reading this, your <b>SMTP settings work</b>. Emails will send. 🎉</p>",
  });
  console.log(`✓ Test email sent to ${to} (messageId: ${info.messageId})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Failed:", err.message ?? err);
  process.exit(1);
});
