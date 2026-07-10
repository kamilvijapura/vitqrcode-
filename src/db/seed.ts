import { db } from "@/db";
import * as s from "@/db/schema";
import { ensureSchema } from "@/db/migrate";
import { eq } from "drizzle-orm";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}
function monthsAgo(n: number, day = 15) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export async function ensureSeeded() {
  try {
    const existing = await db.select().from(s.companies);
    if (existing.length > 0) return false;
  } catch (e) {
    // Table doesn't exist, need to run schema creation
  }

  await ensureSchema();
  const existing = await db.select().from(s.companies);
  if (existing.length > 0) return false;

  const [company] = await db
    .insert(s.companies)
    .values({
      name: "ChromaShield Coatings",
      appName: "ChromaShield Rewards",
      domain: "rewards.chromashield.co",
      industry: "Paint Manufacturer",
      primaryColor: "#4f46e5",
      secondaryColor: "#0ea5e9",
      accentColor: "#f59e0b",
      contactEmail: "hello@chromashield.co",
      contactPhone: "+91 98765 43210",
      address: "Plot 14, Industrial Estate, Pune, Maharashtra 411019",
      tagline: "Every can tells a story. Scan it, earn rewards.",
    })
    .returning();

  const cid = company.id;

  /* products */
  const productSeed: [string, string, string, string, number, number][] = [
    ["AuraMax Interior Emulsion", "Interior", "CS-AUR-1L", "🎨", 1290, 50],
    ["VelvetTouch Premium Emulsion", "Interior", "CS-VEL-4L", "🖌️", 2450, 90],
    ["WeatherShield Exterior Paint", "Exterior", "CS-WSH-10L", "🌤️", 3890, 140],
    ["PrimeLock Cement Primer", "Primer", "CS-PRI-1L", "🧱", 640, 25],
    ["GlossEz Synthetic Enamel", "Enamel", "CS-GLO-1L", "✨", 980, 40],
    ["AquaStop Waterproof Coating", "Waterproofing", "CS-AQU-5L", "💧", 2150, 100],
    ["TimberGlow Wood Finish", "Wood Finish", "CS-TIM-1L", "🪵", 1120, 45],
    ["MetalGuard Anti-Corrosive Primer", "Industrial", "CS-MET-1L", "⚙️", 1380, 55],
    ["TileBond Epoxy Grout", "Waterproofing", "CS-TIL-1KG", "🧩", 870, 35],
    ["ColorShield Acrylic Distemper", "Interior", "CS-COL-10KG", "🎭", 1560, 60],
    ["SilkLine Acrylic Latex", "Interior", "CS-SIL-4L", "🧴", 1990, 75],
    ["FloorCast Heavy-Duty Floor Paint", "Industrial", "CS-FLR-5L", "🛡️", 2680, 95],
  ];

  const insertedProducts = await db
    .insert(s.products)
    .values(
      productSeed.map(([name, category, sku, emoji, price, pts], i) => ({
        companyId: cid,
        name,
        category,
        sku,
        batch: `B-2025${String(10 + i)}`,
        description: `${name} — engineered for lasting colour, superior coverage and ${category.toLowerCase()} performance.`,
        rewardPoints: pts,
        price: String(price),
        imageUrl: `https://placehold.co/400x400/e05b22/fff?text=${encodeURIComponent(name.split(" ")[0])}`,
        specs: {
          Coverage: `${randInt(8, 14)} m²/L`,
          Finish: pick(["Matte", "Satin", "Gloss", "Smooth"]),
          Drying: `${randInt(2, 6)} hours`,
          "Shelf Life": `${randInt(24, 36)} months`,
        },
        status: i === 11 ? ("inactive" as const) : ("active" as const),
        createdAt: daysAgo(randInt(20, 200)),
      })),
    )
    .returning();

  /* rewards */
  const rewardSeed: [string, string, string, number, number][] = [
    ["Bluetooth Earbuds", "Electronics", "🎧", 5000, 24],
    ["Premium Paint Roller Kit", "Tools", "🖌️", 1500, 60],
    ["Smart Fitness Watch", "Electronics", "⌚", 12000, 8],
    ["Brand T-Shirt", "Apparel", "👕", 600, 120],
    ["Power Drill Combo Kit", "Tools", "🪛", 8000, 15],
    ["Stainless Steel Bottle", "Lifestyle", "🍶", 800, 90],
    ["LED Desk Lamp", "Home", "💡", 1800, 40],
    ["Backpack", "Apparel", "🎒", 2200, 35],
    ["Wireless Charger", "Electronics", "🔌", 1300, 0],
    ["Coffee Mug Set", "Lifestyle", "☕", 400, 75],
  ];
  const insertedRewards = await db
    .insert(s.rewards)
    .values(
      rewardSeed.map(([name, category, emoji, pts, stock]) => ({
        companyId: cid,
        name,
        category,
        description: `${name} — redeem with your hard-earned reward points.`,
        requiredPoints: pts,
        stock,
        imageUrl: `https://placehold.co/400x400/292f3d/fff?text=${encodeURIComponent(name.split(" ")[0])}`,
        status:
          stock === 0 ? ("out_of_stock" as const) : ("active" as const),
        createdAt: daysAgo(randInt(10, 150)),
      })),
    )
    .returning();

  /* campaigns */
  const campaignSeed: [string, string, string, string, number, number][] = [
    ["Diwali Double Points", "Festival", "2.0", "Festive season — earn 2x points on every scan.", 0, 35],
    ["Monsoon Waterproofing Promo", "Product Promotion", "1.5", "Bonus points on AquaStop & TileBond.", 5, 25],
    ["AuraMax Launch Celebration", "Launch", "3.0", "Triple points on the all-new AuraMax emulsion.", 30, 95],
    ["Contractor Loyalty Boost", "Double Points", "2.0", "Rewarding our loyal contractor partners.", 10, 20],
    ["Summer Exterior Refresh", "Product Promotion", "1.5", "Refresh exteriors with WeatherShield bonuses.", 20, 70],
    ["Republic Day Mega Offer", "Festival", "2.5", "Celebrate with mega reward multipliers.", 60, 120],
  ];
  await db.insert(s.campaigns).values(
    campaignSeed.map(([name, type, mult, desc, startOff, endOff]) => ({
      companyId: cid,
      name,
      type,
      description: desc,
      pointsMultiplier: mult,
      startDate: monthsAgo(startOff).toISOString().slice(0, 10),
      endDate: monthsAgo(-endOff).toISOString().slice(0, 10),
      status: "active" as const,
      banner: null,
    })),
  );

  /* app users */
  const userNames = [
    "Rahul Sharma", "Priya Nair", "Amit Patel", "Sneha Reddy", "Vikram Singh",
    "Anjali Gupta", "Karthik Iyer", "Deepak Verma", "Meera Joshi", "Arjun Rao",
    "Fatima Sheikh", "Rohan Mehta",
  ];
  const insertedUsers = await db
    .insert(s.appUsers)
    .values(
      userNames.map((name, i) => {
        const scans = randInt(8, 120);
        const pts = scans * randInt(40, 120);
        const tier: "bronze" | "silver" | "gold" | "platinum" =
          pts > 9000 ? "platinum" : pts > 5000 ? "gold" : pts > 2000 ? "silver" : "bronze";
        return {
          companyId: cid,
          name,
          phone: i === 0 ? "+91 9800000001" : i === 1 ? "+91 9800000002" : `+91 9${String(800000000 + i * 1234567).slice(0, 9)}`,
          email: `${name.split(" ")[0].toLowerCase()}@gmail.com`,
          totalPoints: pts,
          walletBalance: Math.floor(pts * 0.62),
          lifetimeScans: scans,
          membershipTier: tier,
          status: i === 9 ? ("blocked" as const) : ("active" as const),
          joinedAt: daysAgo(randInt(40, 320)),
        };
      }),
    )
    .returning();

  /* QR batches + codes (group codes under named batches) */
  const qrRows: (typeof s.qrCodes.$inferInsert)[] = [];
  const batchRows: (typeof s.qrBatches.$inferInsert)[] = [];
  const batchNames = [
    "Q1 Production Run", "Summer Launch Batch", "Festive Special Edition",
    "Contractor Bulk Pack", "Retail Distribution", "Premium Line Activation",
  ];
  let batchCursor = 0;
  insertedProducts.forEach((p, pi) => {
    const count = randInt(8, 16);
    const bName = batchNames[batchCursor % batchNames.length];
    batchCursor++;
    const source = pick(["manual", "csv", "manual", "excel"] as const);
    batchRows.push({
      companyId: cid,
      name: `${bName} — ${p.name.split(" ")[0]}`,
      description: `${count} units · ${p.category} line`,
      productId: p.id,
      count,
      source,
      designConfig: pick([
        { shape: "square", fgColor: "#0f172a", bgColor: "#ffffff", level: "H" },
        { shape: "rounded", fgColor: "#4f46e5", bgColor: "#ffffff", level: "Q" },
        { shape: "dots", fgColor: "#059669", bgColor: "#ecfdf5", level: "M" },
      ]),
      createdAt: daysAgo(randInt(10, 120)),
    });
    for (let i = 0; i < count; i++) {
      const used = Math.random() < 0.62;
      const expired = !used && Math.random() < 0.25;
      qrRows.push({
        code: `CS-${String(p.sku).slice(3)}-${String(pi + 1).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`,
        productId: p.id,
        batch: p.batch,
        status: used ? "used" : expired ? "expired" : "unused",
        scannedAt: used ? daysAgo(randInt(0, 180)) : null,
        pointsAwarded: used ? p.rewardPoints : 0,
        expiresAt: daysAgo(-randInt(60, 400)),
      });
    }
  });
  const insertedBatches = await db.insert(s.qrBatches).values(batchRows).returning();
  // assign each product's codes to its batch (one batch per product in seed)
  let batchIdx = 0;
  for (let r = 0; r < qrRows.length; r++) {
    qrRows[r].batchId = insertedBatches[batchIdx % insertedBatches.length].id;
    if ((r + 1) % Math.max(1, Math.round(qrRows.length / insertedBatches.length)) === 0) batchIdx++;
  }
  const insertedQrs = await db.insert(s.qrCodes).values(qrRows).returning();

  /* QR design templates with metadata */
  await db.insert(s.qrTemplates).values([
    {
      companyId: cid,
      name: "Brand Classic",
      category: "Product Label",
      config: { shape: "square", fgColor: "#0f172a", bgColor: "#ffffff", level: "H", margin: 2, moduleShape: "square", qrColor: "#0f172a", qrBgColor: "#ffffff" } as never,
      isDefault: true,
    },
    {
      companyId: cid,
      name: "Indigo Premium",
      category: "Business Card",
      config: { shape: "rounded", fgColor: "#4f46e5", bgColor: "#ffffff", level: "Q", margin: 3, moduleShape: "rounded", qrColor: "#4f46e5", qrBgColor: "#ffffff" } as never,
    },
    {
      companyId: cid,
      name: "Forest Dots",
      category: "Product Tag",
      config: { shape: "dots", fgColor: "#059669", bgColor: "#ecfdf5", level: "M", margin: 2, moduleShape: "dots", qrColor: "#059669", qrBgColor: "#ecfdf5" } as never,
    },
    {
      companyId: cid,
      name: "Sunset Rounded",
      category: "Loyalty Card",
      config: { shape: "rounded", fgColor: "#ea580c", bgColor: "#fff7ed", level: "M", margin: 2, moduleShape: "rounded", qrColor: "#ea580c", qrBgColor: "#ffffff" } as never,
    },
    {
      companyId: cid,
      name: "Midnight Badge",
      category: "Sticker",
      config: { shape: "dots", fgColor: "#7c3aed", bgColor: "#0f172a", level: "H", margin: 1, moduleShape: "dots", qrColor: "#7c3aed", qrBgColor: "#0f172a" } as never,
    },
  ]);

  /* scans */
  const usedQrs = insertedQrs.filter((q) => q.status === "used");
  const scanStatuses = ["success", "duplicate", "invalid"] as const;
  for (let i = 0; i < 90; i++) {
    const q = pick(usedQrs);
    const u = pick(insertedUsers);
    const product = insertedProducts.find((p) => p.id === q.productId)!;
    const statusRoll = Math.random();
    const status =
      statusRoll < 0.82 ? "success" : statusRoll < 0.92 ? "duplicate" : "invalid";
    const points =
      status === "success" ? product.rewardPoints * randInt(1, 3) : 0;
    await db.insert(s.scans).values({
      userId: u.id,
      qrCodeId: q.id,
      productId: q.productId,
      points,
      status: status as (typeof scanStatuses)[number],
      createdAt: daysAgo(randInt(0, 190)),
    });
  }

  /* redemptions */
  const redStatuses = ["pending", "approved", "rejected", "dispatched", "delivered"] as const;
  for (let i = 0; i < 14; i++) {
    const u = pick(insertedUsers);
    const rw = pick(insertedRewards);
    const st = i < 5 ? "pending" : pick([...redStatuses]);
    await db.insert(s.redemptions).values({
      userId: u.id,
      rewardId: rw.id,
      rewardName: rw.name,
      pointsCost: rw.requiredPoints,
      status: st,
      address: `${u.name.split(" ")[0]}'s Residence, Pune, MH`,
      createdAt: daysAgo(randInt(0, 60)),
      updatedAt: daysAgo(randInt(0, 20)),
    });
  }

  /* transactions */
  for (let i = 0; i < 60; i++) {
    const u = pick(insertedUsers);
    const earn = Math.random() < 0.74;
    await db.insert(s.transactions).values({
      userId: u.id,
      type: earn ? "earn" : "redeem",
      points: earn ? randInt(40, 300) : -(randInt(400, 1500)),
      description: earn
        ? pick([
            "QR Scan Reward — AuraMax",
            "Diwali Double Points Bonus",
            "Scan Reward — WeatherShield",
            "Campaign Multiplier Bonus",
            "Scan Reward — AquaStop",
          ])
        : pick(["Redeemed — Earbuds", "Redeemed — T-Shirt", "Redeemed — Bottle"]),
      balanceAfter: u.walletBalance,
      createdAt: daysAgo(randInt(0, 180)),
    });
  }

  /* notifications */
  const notifs: [string, string, "system" | "points" | "reward" | "campaign"][] = [
    ["🎉 Welcome to ChromaShield Rewards!", "Scan your first product QR to earn points.", "system"],
    ["⭐ Points Credited", "You earned 90 points from your latest scan.", "points"],
    ["🎁 Reward Approved", "Your Bluetooth Earbuds redemption was approved!", "reward"],
    ["🎆 Diwali Double Points", "Earn 2x points on every scan this festive season.", "campaign"],
    ["🚀 AuraMax Launch", "Triple points on the all-new AuraMax emulsion.", "campaign"],
    ["❌ Reward Rejected", "Insufficient points for the Smart Watch redemption.", "reward"],
    ["💰 Wallet Updated", "150 points added to your wallet.", "points"],
    ["🌤️ Summer Refresh", "WeatherShield bonus points now live.", "campaign"],
  ];
  for (let i = 0; i < notifs.length; i++) {
    await db.insert(s.notifications).values({
      userId: i % 3 === 0 ? null : pick(insertedUsers).id,
      title: notifs[i][0],
      body: notifs[i][1],
      type: notifs[i][2],
      read: Math.random() < 0.4,
      createdAt: daysAgo(randInt(0, 40)),
    });
  }

  /* catalogues */
  const catSeed: [string, "pdf" | "brochure" | "datasheet" | "marketing", string, string, string][] = [
    ["Product Catalogue 2025", "pdf", "Catalogue", "📄", "v3.2"],
    ["AuraMax Technical Datasheet", "datasheet", "Technical", "📋", "v1.4"],
    ["AquaStop Waterproofing Brochure", "brochure", "Marketing", "📘", "v2.0"],
    ["Colour Shade Card", "pdf", "Catalogue", "🎨", "v5.1"],
    ["WeatherShield Application Guide", "datasheet", "Technical", "📐", "v1.1"],
    ["Contractor Loyalty Playbook", "marketing", "Marketing", "📈", "v1.0"],
    ["Safety Data Sheets Bundle", "datasheet", "Technical", "⚠️", "v2.3"],
    ["Diwali Campaign Assets", "marketing", "Marketing", "🎆", "v1.0"],
  ];
  await db.insert(s.catalogues).values(
    catSeed.map(([title, docType, category, emoji, version], i) => ({
      companyId: cid,
      title,
      docType,
      category,
      fileUrl: `#doc-${i}`,
      version,
      sizeKb: randInt(420, 9200),
      downloads: randInt(40, 1800),
      createdAt: daysAgo(randInt(5, 120)),
    })),
  );

  /* ── seed admin user ── */
  const existingAdmin = await db.select().from(s.adminUsers).where(eq(s.adminUsers.email, "admin@chromashield.co")).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(s.adminUsers).values({
      companyId: cid,
      name: "Super Admin",
      email: "admin@chromashield.co",
      // bcrypt hash of "Admin@2025!" with rounds=12
      passwordHash: "$2b$12$GxYDPnanrZBqREYZL9G.kOp.nvzqZcXqHcAXZ6p3rUeZ6qb0vxhnq",
      role: "super_admin",
    });
  }

  return true;
}
