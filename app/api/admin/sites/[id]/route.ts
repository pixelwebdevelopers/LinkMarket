import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublisherStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();
  const validStatuses: PublisherStatus[] = ["APPROVED", "REJECTED", "PENDING", "SUSPENDED"];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const site = await db.site.update({
    where: { id },
    data: {
      status,
      ...(status === "APPROVED" && {
        listings: { updateMany: { where: {}, data: { isActive: true } } },
      }),
      ...(["REJECTED", "SUSPENDED"].includes(status) && {
        listings: { updateMany: { where: {}, data: { isActive: false } } },
      }),
    },
    include: { listings: true },
  });

  return NextResponse.json(site);
}
