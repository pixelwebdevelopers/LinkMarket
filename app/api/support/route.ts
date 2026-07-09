import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, renderEmailShell, escapeHtml } from "@/lib/email";
import { getSetting } from "@/lib/settings";
import { sanitizeInput } from "@/lib/security";

export const runtime = "nodejs";

/**
 * POST /api/support { name, email, subject, message }
 * Emails the support inbox (with the sender as reply-to) and drops an in-app
 * notification to all admins so the message is never lost if email is down.
 */
export async function POST(req: NextRequest) {
  try {
    const body = sanitizeInput(await req.json());
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const supportEmail = await getSetting("supportEmail");
    const subjectLine = subject?.trim() ? subject.trim() : "New support request";

    const html = await renderEmailShell({
      preheader: `Support request from ${name}`,
      bodyHtml: `
        <h2 style="margin:0 0 12px;color:#18181b;font-size:18px;">New support request</h2>
        <p style="margin:0 0 4px;color:#3f3f46;"><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        <p style="margin:0 0 16px;color:#3f3f46;"><strong>Subject:</strong> ${escapeHtml(subjectLine)}</p>
        <div style="white-space:pre-wrap;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:14px;color:#18181b;">${escapeHtml(message)}</div>`,
    });

    const emailed = await sendEmail({
      to: supportEmail,
      subject: `[Support] ${subjectLine}`,
      html,
      replyTo: email,
    });

    // In-app fallback so admins always see the request, even if email is off.
    try {
      const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      if (admins.length) {
        await db.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: "GENERIC" as const,
            title: `Support: ${subjectLine}`,
            body: `${name} (${email}): ${String(message).slice(0, 280)}`,
          })),
        });
      }
    } catch (notifyErr) {
      console.error("[support] admin notification failed", notifyErr);
    }

    return NextResponse.json({
      message: "Thanks — your message has been received. We'll get back to you shortly.",
      emailed,
    });
  } catch (err) {
    console.error("[support]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
