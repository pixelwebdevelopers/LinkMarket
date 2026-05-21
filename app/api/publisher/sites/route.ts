import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const publisher = await db.publisher.findUnique({
    where: { userId: session.user.id },
    include: {
      sites: {
        include: { metrics: true, listings: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!publisher) return NextResponse.json({ error: "Publisher profile not found" }, { status: 404 });

  return NextResponse.json(publisher);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { url, name, description, language, country, niche, exampleUrl, listings } = body;

  if (!url || !name || !niche) {
    return NextResponse.json({ error: "URL, name, and niche are required" }, { status: 400 });
  }

  let publisher = await db.publisher.findUnique({ where: { userId: session.user.id } });
  if (!publisher) {
    publisher = await db.publisher.create({
      data: { userId: session.user.id, status: "PENDING" },
    });
    // Upgrade user role to PUBLISHER
    await db.user.update({ where: { id: session.user.id }, data: { role: "PUBLISHER" } });
  }

  const existing = await db.site.findUnique({ where: { url } });
  if (existing) return NextResponse.json({ error: "Site URL already registered" }, { status: 409 });

  const site = await db.site.create({
    data: {
      publisherId: publisher.id,
      url,
      name,
      description,
      language: language ?? "English",
      country: country ?? "US",
      niche,
      exampleUrl,
      status: "PENDING",
      metrics: {
        create: {
          domainRating: 0,
          domainAuthority: 0,
          organicTraffic: 0,
          referringDomains: 0,
          spamScore: 0,
        },
      },
      listings: listings?.length
        ? {
            create: listings.map((l: any) => ({
              type: l.type,
              price: parseFloat(l.price),
              turnaroundDays: parseInt(l.turnaroundDays ?? 3),
              doFollow: l.doFollow ?? true,
              includesContent: l.includesContent ?? false,
              wordCount: l.wordCount ? parseInt(l.wordCount) : null,
              extraNotes: l.extraNotes,
              isActive: false, // Activated after admin approves
            })),
          }
        : undefined,
    },
    include: { metrics: true, listings: true },
  });

  return NextResponse.json(site, { status: 201 });
}
