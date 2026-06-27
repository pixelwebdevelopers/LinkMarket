import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Returns the session user or throws 401. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError("Unauthorized", 401);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, isDisabled: true }
  });
  if (!user || user.isDisabled) throw new AuthError("Unauthorized", 401);
  return user;
}

/** Returns the session user only if their role matches; otherwise throws 401/403. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError("Forbidden", 403);
  return user;
}

export const requireAdmin = () => requireRole("ADMIN");
export const requireAdminOrReseller = () => requireRole("ADMIN", "RESELLER");
export const requireCustomer = () => requireRole("CUSTOMER");
