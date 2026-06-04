import { db } from "@/lib/db";

export interface AuditEntry {
  actorId: string;
  action: string; // e.g. "site.approved", "payout.paid", "reseller.created"
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget audit log writer. Failures are logged but don't throw. */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata as any,
      },
    });
  } catch (err) {
    console.error("[audit] failed to log entry", entry, err);
  }
}
