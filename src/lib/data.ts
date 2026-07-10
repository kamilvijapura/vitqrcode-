import { db } from "@/db";
import * as s from "@/db/schema";
import { sql, eq, desc, count, and, isNull } from "drizzle-orm";
import { getUserSession } from "@/lib/auth";

export async function getCompany() {
  const [c] = await db.select().from(s.companies).limit(1);
  return c;
}

/* ----------------------------------------------------------- dashboard -- */

export async function getDashboardStats() {
  const [productCount] = await db
    .select({ n: count() })
    .from(s.products);
  const [qrCount] = await db.select({ n: count() }).from(s.qrCodes);
  const [qrUsed] = await db
    .select({ n: count() })
    .from(s.qrCodes)
    .where(eq(s.qrCodes.status, "used"));
  const [userCount] = await db
    .select({ n: count() })
    .from(s.appUsers)
    .where(eq(s.appUsers.status, "active"));
  const [scanCount] = await db.select({ n: count() }).from(s.scans);
  const pointsIssued = await db
    .select({ total: sql<number>`coalesce(sum(${s.scans.points}),0)` })
    .from(s.scans)
    .where(eq(s.scans.status, "success"));
  const [pending] = await db
    .select({ n: count() })
    .from(s.redemptions)
    .where(eq(s.redemptions.status, "pending"));
  const [approved] = await db
    .select({ n: count() })
    .from(s.redemptions)
    .where(eq(s.redemptions.status, "approved"));
  const [rejected] = await db
    .select({ n: count() })
    .from(s.redemptions)
    .where(eq(s.redemptions.status, "rejected"));

  const [activeCampaigns] = await db
    .select({ n: count() })
    .from(s.campaigns)
    .where(eq(s.campaigns.status, "active"));

  return {
    products: productCount?.n ?? 0,
    qrGenerated: qrCount?.n ?? 0,
    qrUsed: qrUsed?.n ?? 0,
    activeUsers: userCount?.n ?? 0,
    totalScans: scanCount?.n ?? 0,
    pointsIssued: Number(pointsIssued[0]?.total ?? 0),
    pending: pending?.n ?? 0,
    approved: approved?.n ?? 0,
    rejected: rejected?.n ?? 0,
    activeCampaigns: activeCampaigns?.n ?? 0,
  };
}

export async function getMonthlyScans() {
  const rows = await db.select({ createdAt: s.scans.createdAt, status: s.scans.status }).from(s.scans);
  const months: { label: string; success: number; duplicate: number; invalid: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("en-IN", { month: "short" }),
      success: 0,
      duplicate: 0,
      invalid: 0,
    });
  }
  for (const r of rows) {
    const d = r.createdAt;
    const idx =
      (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    const slot = 6 - idx;
    if (slot >= 0 && slot < 7) {
      const m = months[slot];
      if (r.status === "duplicate") m.duplicate++;
      else if (r.status === "invalid") m.invalid++;
      else m.success++;
    }
  }
  return months;
}

export async function getTopProducts(limit = 5) {
  const rows = await db
    .select({
      id: s.products.id,
      name: s.products.name,
      imageUrl: s.products.imageUrl,
      category: s.products.category,
      scans: count(s.scans.id),
      points: sql<number>`coalesce(sum(${s.scans.points}),0)`,
    })
    .from(s.products)
    .leftJoin(s.scans, eq(s.scans.productId, s.products.id))
    .groupBy(s.products.id)
    .orderBy(desc(count(s.scans.id)))
    .limit(limit);
  return rows;
}

export async function getProductCategorySplit() {
  const rows = await db
    .select({ category: s.products.category, n: count() })
    .from(s.products)
    .groupBy(s.products.category);
  return rows;
}

export async function getTopUsers(limit = 6) {
  return db
    .select()
    .from(s.appUsers)
    .orderBy(desc(s.appUsers.totalPoints))
    .limit(limit);
}

export async function getRecentActivity(limit = 8) {
  return db
    .select({
      id: s.scans.id,
      points: s.scans.points,
      status: s.scans.status,
      createdAt: s.scans.createdAt,
      userName: s.appUsers.name,
      productName: s.products.name,
    })
    .from(s.scans)
    .leftJoin(s.appUsers, eq(s.appUsers.id, s.scans.userId))
    .leftJoin(s.products, eq(s.products.id, s.scans.productId))
    .orderBy(desc(s.scans.createdAt))
    .limit(limit);
}

/* --------------------------------------------------------- collections -- */

export const getProducts = () => db.select().from(s.products).orderBy(desc(s.products.createdAt));
export const getRewards = () => db.select().from(s.rewards).orderBy(desc(s.rewards.createdAt));
export const getCampaigns = () => db.select().from(s.campaigns).orderBy(desc(s.campaigns.createdAt));
export const getCatalogues = () => db.select().from(s.catalogues).orderBy(desc(s.catalogues.createdAt));
export const getNotifications = () => db.select().from(s.notifications).orderBy(desc(s.notifications.createdAt));

export async function getQrCodes(limit = 200) {
  return db
    .select({
      id: s.qrCodes.id,
      code: s.qrCodes.code,
      status: s.qrCodes.status,
      batch: s.qrCodes.batch,
      batchId: s.qrCodes.batchId,
      pointsAwarded: s.qrCodes.pointsAwarded,
      scannedAt: s.qrCodes.scannedAt,
      productName: s.products.name,
      productImageUrl: s.products.imageUrl,
      category: s.products.category,
    })
    .from(s.qrCodes)
    .leftJoin(s.products, eq(s.products.id, s.qrCodes.productId))
    .orderBy(desc(s.qrCodes.createdAt))
    .limit(limit);
}

export async function getQrStatusCounts() {
  const rows = await db
    .select({ status: s.qrCodes.status, n: count() })
    .from(s.qrCodes)
    .groupBy(s.qrCodes.status);
  const map: Record<string, number> = { unused: 0, used: 0, expired: 0, invalid: 0 };
  rows.forEach((r) => (map[r.status] = r.n));
  return map;
}

/* ----------------------------------------------------- qr batches -- */

export async function getQrBatches() {
  return db
    .select({
      id: s.qrBatches.id,
      name: s.qrBatches.name,
      description: s.qrBatches.description,
      count: s.qrBatches.count,
      source: s.qrBatches.source,
      designConfig: s.qrBatches.designConfig,
      createdAt: s.qrBatches.createdAt,
      productName: s.products.name,
      productImageUrl: s.products.imageUrl,
      productRewardPoints: s.products.rewardPoints,
      usedCount: sql<number>`(
        select count(*)::int from ${s.qrCodes} q
        where q.batch_id = ${s.qrBatches.id} and q.status = 'used'
      )`,
    })
    .from(s.qrBatches)
    .leftJoin(s.products, eq(s.products.id, s.qrBatches.productId))
    .orderBy(desc(s.qrBatches.createdAt));
}

export async function getQrBatchDetail(id: number) {
  const [batch] = await db
    .select({
      id: s.qrBatches.id,
      name: s.qrBatches.name,
      description: s.qrBatches.description,
      count: s.qrBatches.count,
      source: s.qrBatches.source,
      designConfig: s.qrBatches.designConfig,
      createdAt: s.qrBatches.createdAt,
      productName: s.products.name,
    })
    .from(s.qrBatches)
    .leftJoin(s.products, eq(s.products.id, s.qrBatches.productId))
    .where(eq(s.qrBatches.id, id));
  return batch;
}

export async function getQrCodesByBatch(batchId: number, limit = 200) {
  return db
    .select({
      id: s.qrCodes.id,
      code: s.qrCodes.code,
      status: s.qrCodes.status,
      scannedAt: s.qrCodes.scannedAt,
      pointsAwarded: s.qrCodes.pointsAwarded,
      productName: s.products.name,
      productImageUrl: s.products.imageUrl,
    })
    .from(s.qrCodes)
    .leftJoin(s.products, eq(s.products.id, s.qrCodes.productId))
    .where(eq(s.qrCodes.batchId, batchId))
    .orderBy(desc(s.qrCodes.createdAt))
    .limit(limit);
}

export async function getQrTemplates() {
  return db
    .select()
    .from(s.qrTemplates)
    .orderBy(desc(s.qrTemplates.createdAt));
}

export async function getAppUsers() {
  return db.select().from(s.appUsers).orderBy(desc(s.appUsers.joinedAt));
}

export async function getRedemptions() {
  return db
    .select({
      id: s.redemptions.id,
      status: s.redemptions.status,
      rewardName: s.redemptions.rewardName,
      pointsCost: s.redemptions.pointsCost,
      address: s.redemptions.address,
      createdAt: s.redemptions.createdAt,
      updatedAt: s.redemptions.updatedAt,
      userName: s.appUsers.name,
      membershipTier: s.appUsers.membershipTier,
    })
    .from(s.redemptions)
    .leftJoin(s.appUsers, eq(s.appUsers.id, s.redemptions.userId))
    .orderBy(desc(s.redemptions.createdAt));
}

/* ----------------------------------------------- mobile (session user) -- */

/** Gets the user from the current JWT session cookie. Used by all /app pages. */
export async function getSessionAppUser() {
  const session = await getUserSession();
  if (!session) return null;
  const [u] = await db.select().from(s.appUsers).where(eq(s.appUsers.id, session.userId)).limit(1);
  return u ?? null;
}

/** Legacy: gets the highest-scoring active user (for demo fallback only) */
export async function getDemoUser() {
  const [u] = await db
    .select()
    .from(s.appUsers)
    .where(eq(s.appUsers.status, "active"))
    .orderBy(desc(s.appUsers.totalPoints))
    .limit(1);
  return u;
}

export async function getUserTransactions(userId: number, limit = 30) {
  return db
    .select()
    .from(s.transactions)
    .where(eq(s.transactions.userId, userId))
    .orderBy(desc(s.transactions.createdAt))
    .limit(limit);
}

export async function getUserScans(userId: number, limit = 20) {
  return db
    .select({
      id: s.scans.id,
      points: s.scans.points,
      status: s.scans.status,
      createdAt: s.scans.createdAt,
      productName: s.products.name,
      productImageUrl: s.products.imageUrl,
      category: s.products.category,
    })
    .from(s.scans)
    .leftJoin(s.products, eq(s.products.id, s.scans.productId))
    .where(eq(s.scans.userId, userId))
    .orderBy(desc(s.scans.createdAt))
    .limit(limit);
}

export async function getUserNotifications(userId: number) {
  return db
    .select()
    .from(s.notifications)
    .where(sql`${s.notifications.userId} = ${userId} OR ${s.notifications.userId} IS NULL`)
    .orderBy(desc(s.notifications.createdAt))
    .limit(20);
}

export async function getProductById(id: number) {
  const [p] = await db.select().from(s.products).where(eq(s.products.id, id));
  return p;
}

export async function getRewardById(id: number) {
  const [r] = await db.select().from(s.rewards).where(eq(s.rewards.id, id));
  return r;
}

export async function getProductsByCategory(category: string, excludeId?: number, limit = 4) {
  const conditions = [eq(s.products.category, category), eq(s.products.status, "active")];
  const rows = await db.select().from(s.products).where(and(...conditions)).limit(limit + 1);
  return rows.filter((p) => p.id !== excludeId).slice(0, limit);
}

export async function getUserById(id: number) {
  const [u] = await db.select().from(s.appUsers).where(eq(s.appUsers.id, id));
  return u;
}

export async function getAuditLogs(limit = 100) {
  return await db.select().from(s.auditLogs).orderBy(desc(s.auditLogs.createdAt)).limit(limit);
}

export async function getLeaderboard(limit = 10) {
  return await db
    .select()
    .from(s.appUsers)
    .where(eq(s.appUsers.status, "active"))
    .orderBy(desc(s.appUsers.totalPoints))
    .limit(limit);
}
