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

/* ------------------------------ rewards ----------------------------- */

export async function createReward(input: {
  name: string;
  category: string;
  description: string;
  requiredPoints: number;
  stock: number;
  emoji: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!input.name?.trim()) return { ok: false, error: "Name is required" };
    const cid = await companyId();
    const [reward] = await db.insert(s.rewards).values({
      companyId: cid,
      name: input.name.trim(),
      category: input.category,
      description: input.description,
      requiredPoints: input.requiredPoints,
      stock: input.stock,
      imageUrl: input.emoji || "🎁",
      status: input.stock === 0 ? "out_of_stock" : "active",
    }).returning();
    await auditLog("CREATE_REWARD", "reward", reward.id, { name: input.name });
    revalidateAll(["/admin/rewards", "/admin"]);
    return { ok: true };
  } catch (e) {
    console.error("[createReward]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateReward(input: {
  id: number;
  name: string;
  category: string;
  description: string;
  requiredPoints: number;
  stock: number;
  emoji: string;
}) {
  try {
    await db.update(s.rewards).set({
      name: input.name,
      category: input.category,
      description: input.description,
      requiredPoints: input.requiredPoints,
      stock: input.stock,
      imageUrl: input.emoji || "🎁",
      status: input.stock === 0 ? "out_of_stock" : "active",
    }).where(eq(s.rewards.id, input.id));
    await auditLog("UPDATE_REWARD", "reward", input.id, { name: input.name });
    revalidateAll(["/admin/rewards", "/admin"]);
    return { ok: true };
  } catch (e) {
    console.error("[updateReward]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteReward(id: number) {
  try {
    await db.delete(s.rewards).where(eq(s.rewards.id, id));
    await auditLog("DELETE_REWARD", "reward", id);
    revalidateAll(["/admin/rewards", "/admin"]);
  } catch (e) { console.error("[deleteReward]", e); }
}

export async function deleteCampaign(id: number) {
  try {
    await db.delete(s.campaigns).where(eq(s.campaigns.id, id));
    await auditLog("DELETE_CAMPAIGN", "campaign", id);
    revalidateAll(["/admin/campaigns", "/admin"]);
  } catch (e) { console.error("[deleteCampaign]", e); }
}

