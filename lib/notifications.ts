import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";
import { sendEmail, renderEmailShell } from "@/lib/email";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  /** Send email in addition to creating in-app notification. */
  email?: boolean;
}

/**
 * Create an in-app notification and optionally email the user.
 * Returns the created notification id.
 */
export async function notify(input: NotifyInput): Promise<string> {
  const created = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });

  if (input.email) {
    const user = await db.user.findUnique({ where: { id: input.userId }, select: { email: true, name: true } });
    if (user?.email) {
      const link = input.link
        ? `<p style="margin-top:24px;"><a href="${input.link}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Open</a></p>`
        : "";
      const html = await renderEmailShell({
        preheader: input.title,
        bodyHtml: `<h2 style="margin:0 0 12px;color:#18181b;font-size:18px;">${escape(input.title)}</h2>
                   <p style="margin:0;color:#3f3f46;">${escape(input.body)}</p>
                   ${link}`,
      });
      await sendEmail({ to: user.email, subject: input.title, html });
    }
  }

  return created.id;
}

/**
 * Notify all admins of an event. Used for "new order received" etc.
 */
export async function notifyAdmins(input: Omit<NotifyInput, "userId">): Promise<void> {
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(admins.map((a) => notify({ ...input, userId: a.id })));
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Mark a notification as read. */
export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Mark all of a user's notifications as read. */
export async function markAllRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
