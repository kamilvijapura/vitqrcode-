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

/* ----------------------------- products ----------------------------- */

export async function createProduct(input: {
  name: string;
  sku: string;
  batch: string;
  category: string;
  description: string;
  rewardPoints: number;
  price: number;
  image: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!input.name?.trim()) return { ok: false, error: "Name is required" };
    if (!input.sku?.trim()) return { ok: false, error: "SKU is required" };
    const cid = await companyId();
    const imageUrl = input.image || null;
    const [product] = await db.insert(s.products).values({
      companyId: cid,
      name: input.name.trim(),
      sku: input.sku.trim(),
      batch: input.batch?.trim() || `B-${new Date().getFullYear()}NEW`,
      category: input.category,
      description: input.description,
      rewardPoints: input.rewardPoints,
      price: String(input.price),
      imageUrl,
      status: "active",
    }).returning();
    await auditLog("CREATE_PRODUCT", "product", product.id, { name: input.name });
    revalidateAll(["/admin/products", "/admin"]);
    return { ok: true };
  } catch (e) {
    console.error("[createProduct]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateProduct(input: {
  id: number;
  name: string;
  sku: string;
  batch: string;
  category: string;
  description: string;
  rewardPoints: number;
  price: number;
  image: string | null;
}) {
  try {
    const imageUrl = input.image || null;
    await db.update(s.products).set({
      name: input.name,
      sku: input.sku,
      batch: input.batch,
      category: input.category,
      description: input.description,
      rewardPoints: input.rewardPoints,
      price: String(input.price),
      imageUrl,
    }).where(eq(s.products.id, input.id));
    await auditLog("UPDATE_PRODUCT", "product", input.id, { name: input.name });
    revalidateAll(["/admin/products", "/admin"]);
    return { ok: true };
  } catch (e) {
    console.error("[updateProduct]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteProduct(id: number) {
  try {
    const batches = await db.select({ id: s.qrBatches.id }).from(s.qrBatches).where(eq(s.qrBatches.productId, id)).limit(1);
    if (batches.length > 0) return { ok: false, error: "Cannot delete product: It has generated QR batches. Please deactivate it instead." };
    
    await db.delete(s.products).where(eq(s.products.id, id));
    await auditLog("DELETE_PRODUCT", "product", id);
    revalidateAll(["/admin/products", "/admin"]);
    return { ok: true };
  } catch (e) {
    console.error("[deleteProduct]", e);
    return { ok: false, error: "Database error occurred." };
  }
}

export async function toggleProductStatus(id: number, active: boolean) {
  try {
    await db.update(s.products).set({ status: active ? "active" : "inactive" }).where(eq(s.products.id, id));
    await auditLog("TOGGLE_PRODUCT", "product", id, { active });
    safeRevalidate("/admin/products");
  } catch (e) { console.error("[toggleProductStatus]", e); }
}

