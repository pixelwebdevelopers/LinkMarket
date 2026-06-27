import { PrismaClient, Role, SiteStatus, ListingType, OrderStatus, LedgerEntryType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEFAULT_SETTINGS = {
  globalCommissionCents: 1000, // 10%
  payoutThresholdCents: 5000,   // $50
  currency: "USD",
  platformName: "Rankistic",
  supportEmail: "support@rankistic.com",
  notifyAdminOnNewOrder: true,
};

// Seed portals data from competitor screenshot
const MOCK_SITES = [
  { url: "https://blesscircle.com", name: "Bless Circle", niche: "News & Media", country: "US", language: "English", dr: 36, da: 40, traffic: 1496, rd: 417, price: 6000 },
  { url: "https://duskripple.com", name: "Dusk Ripple", niche: "News & Media", country: "US", language: "English", dr: 52, da: 40, traffic: 7596, rd: 500, price: 7000 },
  { url: "https://magazinevalve.com", name: "Magazine Valve", niche: "News & Media", country: "US", language: "English", dr: 55, da: 42, traffic: 68555, rd: 690, price: 9000 },
  { url: "https://r6marketplace.it", name: "R6 Marketplace", niche: "Gaming", country: "IT", language: "English", dr: 92, da: 93, traffic: 36063, rd: 248, price: 9000 },
  { url: "https://scoopevalle.com", name: "Scoop Valle", niche: "News & Media", country: "US", language: "English", dr: 9, da: 4, traffic: 9454, rd: 394, price: 9000 },
  { url: "https://snapchat-planets.org", name: "Snapchat Planets", niche: "News & Media", country: "US", language: "English", dr: 54, da: 41, traffic: 14091, rd: 660, price: 7000 },
  { url: "https://vex7.io", name: "Vex 7", niche: "Gaming", country: "US", language: "English", dr: 59, da: 28, traffic: 1639, rd: 386, price: 9000 },
  { url: "https://signalscv.com", name: "Signal SCV", niche: "News & Media", country: "US", language: "English", dr: 73, da: 75, traffic: 35184, rd: 8722, price: 14000 },
  { url: "https://pwinsider.com", name: "PW Insider", niche: "Entertainment", country: "US", language: "English", dr: 59, da: 65, traffic: 6049, rd: 8346, price: 8000 },
  { url: "https://spacecoastdaily.com", name: "Space Coast Daily", niche: "News & Media", country: "US", language: "English", dr: 72, da: 74, traffic: 12840, rd: 13887, price: 14000 },
  { url: "https://seasonsincolour.com", name: "Seasons in Colour", niche: "Home & Garden", country: "US", language: "English", dr: 54, da: 41, traffic: 830, rd: 1496, price: 18200 },
  { url: "https://americanspcc.org", name: "American SPCC", niche: "Business", country: "US", language: "English", dr: 69, da: 55, traffic: 37487, rd: 2813, price: 11200 },
  { url: "https://blog.bay-bee.co.uk", name: "Bay Bee Blog", niche: "Parenting", country: "GB", language: "English", dr: 32, da: 29, traffic: 2898, rd: 804, price: 11480 },
  { url: "https://theceoviews.com", name: "The CEO Views", niche: "Business", country: "US", language: "English", dr: 60, da: 33, traffic: 187, rd: 2391, price: 10000 }
];

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

  // Create Admin
  const adminEmail = "admin@rankistic.com";
  const adminPassword = "admin12345";
  let admin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    admin = await db.user.create({
      data: {
        name: "Platform Admin",
        email: adminEmail,
        password: hashed,
        role: Role.ADMIN,
        emailVerified: new Date(),
      },
    });
    console.log(`  ✓ Admin user created: ${adminEmail}`);
  } else {
    console.log(`  ✓ Admin user exists`);
  }

  // Create Reseller
  const resellerEmail = "reseller@rankistic.com";
  const resellerPassword = "reseller12345";
  let reseller = await db.user.findUnique({ where: { email: resellerEmail } });
  if (!reseller) {
    const hashed = await bcrypt.hash(resellerPassword, 12);
    reseller = await db.user.create({
      data: {
        name: "Publisher Reseller",
        email: resellerEmail,
        password: hashed,
        role: Role.RESELLER,
        emailVerified: new Date(),
      },
    });
    console.log(`  ✓ Reseller user created: ${resellerEmail}`);
  } else {
    console.log(`  ✓ Reseller user exists`);
  }

  // Create Customer
  const customerEmail = "customer@rankistic.com";
  const customerPassword = "customer12345";
  let customer = await db.user.findUnique({ where: { email: customerEmail } });
  if (!customer) {
    const hashed = await bcrypt.hash(customerPassword, 12);
    customer = await db.user.create({
      data: {
        name: "John Customer",
        email: customerEmail,
        password: hashed,
        role: Role.CUSTOMER,
        emailVerified: new Date(),
      },
    });
    console.log(`  ✓ Customer user created: ${customerEmail}`);
  } else {
    console.log(`  ✓ Customer user exists`);
  }

  // Clear existing testing data so we have a clean seed
  console.log("→ Cleaning old testing sites, listings, and orders...");
  await db.order.deleteMany({});
  await db.listing.deleteMany({});
  await db.site.deleteMany({});
  await db.bankAccount.deleteMany({});
  await db.payout.deleteMany({});
  await db.ledgerEntry.deleteMany({});

  // Seed Sites & Metrics
  console.log("→ Seeding testing sites & metrics...");
  let count = 0;
  for (const item of MOCK_SITES) {
    const ownerId = count % 2 === 0 ? reseller.id : admin.id;
    const site = await db.site.create({
      data: {
        ownerId,
        url: item.url,
        name: item.name,
        niche: item.niche,
        country: item.country,
        language: item.language,
        status: SiteStatus.APPROVED,
        exampleUrl: `${item.url}/guest-post-example`,
        approvedById: admin.id,
        approvedAt: new Date(),
      },
    });

    // Create Site Metrics
    await db.siteMetrics.create({
      data: {
        siteId: site.id,
        domainRating: item.dr,
        domainAuthority: item.da,
        organicTraffic: item.traffic,
        referringDomains: item.rd,
        spamScore: 1.0,
        updatedById: admin.id,
      },
    });

    // Create Listings (Packages) - 1 Guest Post and 1 Niche Edit for each
    const gpListing = await db.listing.create({
      data: {
        siteId: site.id,
        type: ListingType.GUEST_POST,
        basePriceCents: item.price,
        turnaroundDays: 3,
        isActive: true,
        doFollow: true,
        includesContent: true,
        wordCount: 1000,
      },
    });

    await db.listing.create({
      data: {
        siteId: site.id,
        type: ListingType.NICHE_EDIT,
        basePriceCents: Math.floor(item.price * 0.8), // 20% cheaper
        turnaroundDays: 2,
        isActive: true,
        doFollow: true,
        includesContent: false,
      },
    });

    // Seed some orders for the first 4 sites to make testing screens lively
    if (count < 4) {
      const orderStatuses = [
        OrderStatus.COMPLETED,
        OrderStatus.PUBLISHED,
        OrderStatus.IN_PROGRESS,
        OrderStatus.PAID,
      ];
      const status = orderStatuses[count];
      const adminCommissionCents = Math.floor(gpListing.basePriceCents * 0.1);
      const pricePaidCents = gpListing.basePriceCents + adminCommissionCents;

      const order = await db.order.create({
        data: {
          customerId: customer.id,
          fulfillerId: ownerId,
          listingId: gpListing.id,
          status,
          pricePaidCents,
          resellerEarningCents: gpListing.basePriceCents,
          adminCommissionCents,
          commissionCentsSnapshot: adminCommissionCents,
          targetUrl: "https://mybusiness.com/seo-strategy",
          anchorText: "modern SEO guidelines",
          notes: "Please write high-quality natural paragraph surrounding this anchor.",
          articleUrl: status === OrderStatus.COMPLETED || status === OrderStatus.PUBLISHED ? `${site.url}/seo-guidelines` : null,
          createdAt: new Date(Date.now() - (count * 24 * 60 * 60 * 1000)), // dynamic older dates
        },
      });

      // Seed corresponding financial transaction inside the ledger for completed/published orders
      if (status === OrderStatus.COMPLETED || status === OrderStatus.PUBLISHED || status === OrderStatus.PAID) {
        await db.ledgerEntry.create({
          data: {
            userId: ownerId,
            orderId: order.id,
            type: LedgerEntryType.ORDER_GROSS,
            amountCents: pricePaidCents,
          },
        });
        await db.ledgerEntry.create({
          data: {
            userId: ownerId,
            orderId: order.id,
            type: LedgerEntryType.RESELLER_EARNING,
            amountCents: gpListing.basePriceCents,
          },
        });
        await db.ledgerEntry.create({
          data: {
            userId: admin.id,
            orderId: order.id,
            type: LedgerEntryType.ADMIN_COMMISSION,
            amountCents: adminCommissionCents,
          },
        });
      }
    }

    count++;
  }
  console.log(`  ✓ ${count} Sites, Metrics, and Listings seeded successfully`);

  // Seed Reseller Bank Accounts
  console.log("→ Seeding bank accounts for reseller...");
  const bankAccount = await db.bankAccount.create({
    data: {
      userId: reseller.id,
      label: "Chase Checking - 4321",
      accountName: "Publisher Reseller Chase",
      bankName: "Chase Bank",
      routingNumber: "123456789",
      accountNumber: "987654321",
      isDefault: true,
    },
  });

  // Seed Payout Requests
  console.log("→ Seeding payout requests...");
  await db.payout.create({
    data: {
      resellerId: reseller.id,
      bankAccountId: bankAccount.id,
      amountCents: 15000, // $150.00
      status: "REQUESTED",
      bankSnapshot: { label: bankAccount.label, accountName: bankAccount.accountName },
    },
  });

  await db.payout.create({
    data: {
      resellerId: reseller.id,
      bankAccountId: bankAccount.id,
      amountCents: 5000, // $50.00
      status: "PAID",
      bankSnapshot: { label: bankAccount.label, accountName: bankAccount.accountName },
      paidAt: new Date(),
    },
  });

  console.log("  ✓ Bank accounts and payout logs populated.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
