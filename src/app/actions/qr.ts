"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pool } from "@/db";
import * as s from "@/db/schema";
import { eq, sql, and, desc, inArray } from "drizzle-orm";
import type { AdminPayload, UserPayload } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

import {
  verifyPassword,
  setAdminCookie,
  clearAdminCookie,
  setUserCookie,
  clearUserCookie,
  getAdminSession,
  getUserSession,
} from "@/lib/auth";



async function companyId() {
  const [c] = await db.select().from(s.companies).limit(1);
  return c?.id ?? 1;
}

/** Safe revalidation — never throws. */
function safeRevalidate(path: string) {
  try { revalidatePath(path); } catch { /* noop */ }
}

/** Revalidate multiple paths at once. */
function revalidateAll(paths: string[]) {
  paths.forEach(safeRevalidate);
}

/** Write an audit log entry for compliance & traceability. */
async function auditLog(action: string, entityType?: string, entityId?: number, details?: Record<string, unknown>, actor = "admin") {
  try {
    await db.insert(s.auditLogs).values({ actor, action, entityType, entityId, details: details ?? null });
  } catch { /* audit logging is best-effort */ }
}

/** Validate a required string field. */
function requireString(value: string | undefined, field: string): string {
  if (!value || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

/* ------------------------------- QR --------------------------------- */

/**
 * Generate a unique, collision-resistant QR code that does not already exist.
 */
function makeCode(skuBase: string, seq: number): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const check = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `CS-${skuBase}-${rand}${check}${String(seq).padStart(3, "0")}`;
}

interface GenResult {
  ok: boolean;
  error?: string;
  code?: string;
  batchId?: number;
  count?: number;
}

/** Generate a single unique QR code from a template. */
export async function generateSingleQrCode(input: {
  productId: number;
  templateId?: number;
  campaignId?: number;
  rewardType?: string;
  expiryDate?: string;
  internalNote?: string;
}): Promise<GenResult> {
  try {
    const cid = await companyId();
    const [product] = await db
      .select()
      .from(s.products)
      .where(eq(s.products.id, input.productId));
    if (!product) return { ok: false, error: "Product not found" };

    const skuBase = String(product.sku || "GEN").slice(0, 8).toUpperCase();
    const batchLabel = `Single-${Date.now().toString().slice(-6)}`;
    let template: any = null;
    if (input.templateId) {
      [template] = await db.select().from(s.qrTemplates).where(eq(s.qrTemplates.id, input.templateId)).limit(1);
    }

    const [batch] = await db
      .insert(s.qrBatches)
      .values({ 
        companyId: cid, 
        name: batchLabel, 
        productId: input.productId, 
        templateId: input.templateId,
        count: 1, 
        source: "single", 
        designConfig: {
          ...(template?.config as Record<string, unknown> ?? {}),
          campaignId: input.campaignId,
          rewardType: input.rewardType,
          internalNote: input.internalNote,
        },
      })
      .returning();

    const code = makeCode(skuBase, 1);
    await db.insert(s.qrCodes).values({
      code,
      productId: input.productId,
      batch: batchLabel,
      batchId: batch.id,
      status: "unused",
      expiresAt: input.expiryDate ? new Date(input.expiryDate) : new Date(Date.now() + 365 * 86400000),
    });

    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/history");
    safeRevalidate("/admin");
    return { ok: true, code, batchId: batch.id };
  } catch (e) {
    console.error("[generateSingleQrCode] Error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Get all QR codes for a batch for downloading. */
export async function getBatchCodesForDownload(batchId: number) {
  const [batch] = await db.select().from(s.qrBatches).where(eq(s.qrBatches.id, batchId)).limit(1);
  const rows = await db
    .select({
      id: s.qrCodes.id,
      code: s.qrCodes.code,
      status: s.qrCodes.status,
      productName: s.products.name,
      productEmoji: s.products.imageUrl,
    })
    .from(s.qrCodes)
    .leftJoin(s.products, eq(s.products.id, s.qrCodes.productId))
    .where(eq(s.qrCodes.batchId, batchId))
    .orderBy(desc(s.qrCodes.createdAt))
    .limit(5000);
  return { codes: rows, batch };
}

export async function generateBulkQrCodes(input: {
  productId: number;
  templateId?: number;
  count: number;
  batchName: string;
  description?: string;
  source?: string;
  designConfig?: Record<string, unknown>;
  campaignId?: number;
  rewardType?: string;
  expiryDate?: string;
  internalNote?: string;
}): Promise<GenResult> {
  try {
    const cid = await companyId();
    const [product] = await db
      .select()
      .from(s.products)
      .where(eq(s.products.id, input.productId));
    if (!product) return { ok: false, error: "Product not found" };

    const count = Math.min(Math.max(1, input.count), 5000);
    const skuBase = String(product.sku || "GEN").slice(0, 8).toUpperCase();
    const batchLabel = input.batchName || `Batch-${Date.now().toString().slice(-6)}`;

    // create the batch record first
    const [batch] = await db
      .insert(s.qrBatches)
      .values({
        companyId: cid,
        name: batchLabel,
        description: input.description ?? null,
        productId: input.productId,
        templateId: input.templateId,
        count,
        source: input.source ?? "manual",
        designConfig: {
          ...(input.designConfig ?? {}),
          campaignId: input.campaignId,
          rewardType: input.rewardType,
          internalNote: input.internalNote,
        },
      })
      .returning();

    // generate codes with duplicate detection
    const rows: (typeof s.qrCodes.$inferInsert)[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < count; i++) {
      let code = makeCode(skuBase, i + 1);
      while (seen.has(code)) code = makeCode(skuBase, i + 1);
      seen.add(code);
      rows.push({
        code,
        productId: input.productId,
        batch: batchLabel,
        batchId: batch.id,
        status: "unused",
        expiresAt: input.expiryDate ? new Date(input.expiryDate) : new Date(Date.now() + 365 * 86400000),
      });
    }

    // Insert in chunks of 500 for performance
    for (let i = 0; i < rows.length; i += 500) {
      await db.insert(s.qrCodes).values(rows.slice(i, i + 500));
    }

    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/history");
    safeRevalidate("/admin");
    return { ok: true, batchId: batch.id, count };
  } catch (e) {
    console.error("[generateBulkQrCodes] Error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/**
 * Import QR codes from an uploaded CSV/Excel dataset (already parsed client-side
 * into rows). Each row may carry a custom product mapping; missing ones fall back
 * to the default product.
 */
export async function importQrCodes(input: {
  productId: number;
  batchName: string;
  description?: string;
  rows: { product?: string; code?: string; count?: number }[];
}) {
  try {
  const cid = await companyId();
  const [product] = await db
    .select()
    .from(s.products)
    .where(eq(s.products.id, input.productId));
  if (!product) return { ok: false, generated: 0, duplicates: 0, error: "Product not found" };

  // dedupe input codes (duplicate detection on import)
  const uniqueCodes = new Map<string, { productId: number }>();
  let duplicates = 0;
  for (const r of input.rows) {
    if (r.code) {
      const key = r.code.trim().toUpperCase();
      if (uniqueCodes.has(key)) {
        duplicates++;
      } else {
        uniqueCodes.set(key, { productId: input.productId });
      }
    }
  }

  // also detect codes already in the DB
  const codesArr = [...uniqueCodes.keys()];
  let existingInDb = 0;
  if (codesArr.length > 0) {
    const found = await db
      .select({ code: s.qrCodes.code })
      .from(s.qrCodes)
      .where(sql`${s.qrCodes.code} in ${codesArr}`);
    existingInDb = found.length;
    const existingSet = new Set(found.map((f) => f.code));
    for (const k of codesArr) {
      if (existingSet.has(k)) uniqueCodes.delete(k);
    }
  }

  const batchLabel = input.batchName || `Import-${Date.now().toString().slice(-6)}`;
  const entries = [...uniqueCodes.entries()];
  const skuBase = String(product.sku).slice(3, 9).toUpperCase();

  // if CSV had no explicit codes, generate count-based codes
  const totalImportRows = input.rows.reduce((a, r) => a + (r.count ?? 1), 0);
  let codesToInsert: (typeof s.qrCodes.$inferInsert)[];

  if (entries.length === 0) {
    // quantity-based import (no explicit codes)
    const [batch] = await db
      .insert(s.qrBatches)
      .values({
        companyId: cid,
        name: batchLabel,
        description: input.description ?? null,
        productId: input.productId,
        count: totalImportRows,
        source: "csv",
      })
      .returning();
    codesToInsert = [];
    const seen = new Set<string>();
    for (let i = 0; i < totalImportRows; i++) {
      let code = makeCode(skuBase, i + 1);
      while (seen.has(code)) code = makeCode(skuBase, i + 1);
      seen.add(code);
      codesToInsert.push({
        code,
        productId: input.productId,
        batch: batchLabel,
        batchId: batch.id,
        status: "unused",
        expiresAt: new Date(Date.now() + 365 * 86400000),
      });
    }
    await db.insert(s.qrCodes).values(codesToInsert);
    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/history");
    safeRevalidate("/admin");
    return {
      ok: true,
      generated: totalImportRows,
      duplicates,
      existing: existingInDb,
    };
  }

  // explicit-code import
  const [batch] = await db
    .insert(s.qrBatches)
    .values({
      companyId: cid,
      name: batchLabel,
      description: input.description ?? null,
      productId: input.productId,
      count: entries.length,
      source: "csv",
    })
    .returning();

  codesToInsert = entries.map(([code]) => ({
    code,
    productId: input.productId,
    batch: batchLabel,
    batchId: batch.id,
    status: "unused",
    expiresAt: new Date(Date.now() + 365 * 86400000),
  }));
  await db.insert(s.qrCodes).values(codesToInsert);

    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/history");
    safeRevalidate("/admin");
    return {
      ok: true,
      generated: entries.length,
      duplicates,
      existing: existingInDb,
    };
  } catch (e) {
    console.error("[importQrCodes] Error:", e);
    return { ok: false, generated: 0, duplicates: 0, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteQrBatch(id: number) {
  try {
    await db.delete(s.qrCodes).where(eq(s.qrCodes.batchId, id));
    await db.delete(s.qrBatches).where(eq(s.qrBatches.id, id));
    safeRevalidate("/admin/qr/history");
    safeRevalidate("/admin/qr");
    safeRevalidate("/admin");
  } catch (e) {
    console.error("[deleteQrBatch] Error:", e);
  }
}

export async function saveQrTemplate(input: {
  name: string;
  category: string;
  config: Record<string, unknown>;
  thumbnail?: string;
  isDefault?: boolean;
}) {
  try {
    const cid = await companyId();
    if (input.isDefault) {
      await db
        .update(s.qrTemplates)
        .set({ isDefault: false })
        .where(eq(s.qrTemplates.companyId, cid));
    }
    await db.insert(s.qrTemplates).values({
      companyId: cid,
      name: input.name,
      category: input.category,
      config: input.config,
      thumbnail: input.thumbnail ?? null,
      isDefault: input.isDefault ?? false,
    });
    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/design");
    safeRevalidate("/admin/qr/generate");
    return { ok: true };
  } catch (e) {
    console.error("[saveQrTemplate] Error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateQrTemplate(input: {
  id: number;
  name: string;
  category: string;
  config: Record<string, unknown>;
  thumbnail?: string;
  isDefault?: boolean;
}) {
  try {
    const cid = await companyId();
    if (input.isDefault) {
      await db.update(s.qrTemplates).set({ isDefault: false }).where(eq(s.qrTemplates.companyId, cid));
    }
    await db.update(s.qrTemplates).set({
      name: input.name,
      category: input.category,
      config: input.config,
      thumbnail: input.thumbnail ?? null,
      isDefault: input.isDefault ?? false,
    }).where(eq(s.qrTemplates.id, input.id));
    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/design");
    safeRevalidate("/admin/qr/generate");
    return { ok: true };
  } catch (e) {
    console.error("[updateQrTemplate] Error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function setDefaultTemplate(id: number) {
  try {
    const cid = await companyId();
    await db.update(s.qrTemplates).set({ isDefault: false }).where(eq(s.qrTemplates.companyId, cid));
    await db.update(s.qrTemplates).set({ isDefault: true }).where(eq(s.qrTemplates.id, id));
    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/generate");
  } catch (e) {
    console.error("[setDefaultTemplate] Error:", e);
  }
}

export async function duplicateQrTemplate(id: number) {
  try {
    const [src] = await db.select().from(s.qrTemplates).where(eq(s.qrTemplates.id, id)).limit(1);
    if (!src) return;
    const cid = await companyId();
    await db.insert(s.qrTemplates).values({
      companyId: cid,
      name: `${src.name} (Copy)`,
      category: src.category,
      config: src.config,
      thumbnail: src.thumbnail,
      isDefault: false,
    });
    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/design");
    safeRevalidate("/admin/qr/generate");
  } catch (e) {
    console.error("[duplicateQrTemplate] Error:", e);
  }
}

export async function deleteQrTemplate(id: number) {
  try {
    // 1. First clear FK references in qrBatches — the table has templateId FK
    //    that defaults to RESTRICT (no ON DELETE clause), so direct delete fails
    //    when any batch was generated using this template.
    await db
      .update(s.qrBatches)
      .set({ templateId: null })
      .where(eq(s.qrBatches.templateId, id));

    // 2. Now it's safe to delete the template
    await db.delete(s.qrTemplates).where(eq(s.qrTemplates.id, id));

    safeRevalidate("/admin/qr");
    safeRevalidate("/admin/qr/design");
    safeRevalidate("/admin/qr/generate");
  } catch (e) {
    console.error("[deleteQrTemplate] Error:", e);
    throw e; // rethrow so the client catch block can show an error toast
  }
}

/**
 * Load all codes belonging to a specific batch (used by history drill-down).
 * Returns the complete shape expected by the client so it can be passed
 * directly as a stable server-action reference.
 */
export async function getBatchCodes(batchId: number) {
  const rows = await db
    .select({
      id: s.qrCodes.id,
      code: s.qrCodes.code,
      status: s.qrCodes.status,
      scannedAt: s.qrCodes.scannedAt,
      pointsAwarded: s.qrCodes.pointsAwarded,
      productName: s.products.name,
      productEmoji: s.products.imageUrl,
    })
    .from(s.qrCodes)
    .leftJoin(s.products, eq(s.products.id, s.qrCodes.productId))
    .where(eq(s.qrCodes.batchId, batchId))
    .orderBy(desc(s.qrCodes.createdAt))
    .limit(300);
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    status: r.status,
    scannedAt: r.scannedAt ? new Date(r.scannedAt).toISOString() : null,
    pointsAwarded: r.pointsAwarded,
    productName: r.productName ?? null,
    productEmoji: r.productEmoji ?? null,
    batch: null as string | null,
    batchId,
  }));
}

