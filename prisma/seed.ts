/* Run with: npx tsx prisma/seed.ts (or `prisma db seed` after configuring package.json) */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEFAULT_SETTINGS = {
  globalCommissionPct: 20,
  payoutThresholdCents: 5000,
  currency: "USD",
  platformName: "LinkMarket",
  supportEmail: "support@linkmarket.io",
  notifyAdminOnNewOrder: true,
};

async function main() {
  console.log("→ Seeding defaults...");
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.setting.upsert({
      where: { key },
      create: { key, value: value as any },
      update: {},
    });
  }
  console.log("  ✓ Settings seeded");

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@linkmarket.io";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await db.user.create({
      data: {
        name: "Platform Admin",
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
      },
    });
    console.log(`  ✓ Admin user created: ${adminEmail} / ${adminPassword}`);
  } else if (existingAdmin.role !== "ADMIN") {
    await db.user.update({ where: { id: existingAdmin.id }, data: { role: "ADMIN" } });
    console.log(`  ✓ Promoted ${adminEmail} to ADMIN`);
  } else {
    console.log(`  ✓ Admin user already exists: ${adminEmail}`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
