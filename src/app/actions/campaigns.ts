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

/* ----------------------------- campaigns ---------------------------- */

export async function createCampaign(input: {
  name: string;
  type: string;
  description: string;
  pointsMultiplier: number;
  startDate: string;
  endDate: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!input.name?.trim()) return { ok: false, error: "Name is required" };
    if (!input.startDate?.match(/^\d{4}-\d{2}-\d{2}$/)) return { ok: false, error: "Invalid start date format (YYYY-MM-DD required)" };
    if (!input.endDate?.match(/^\d{4}-\d{2}-\d{2}$/)) return { ok: false, error: "Invalid end date format (YYYY-MM-DD required)" };
    const cid = await companyId();
    const [campaign] = await db.insert(s.campaigns).values({
      companyId: cid,
      name: input.name.trim(),
      type: input.type,
      description: input.description,
      pointsMultiplier: String(input.pointsMultiplier),
      startDate: input.startDate,
      endDate: input.endDate,
      status: "active",
      banner: "✨",
    }).returning();
    await auditLog("CREATE_CAMPAIGN", "campaign", campaign.id, { name: input.name });
    revalidateAll(["/admin/campaigns", "/admin"]);
    return { ok: true };
  } catch (e) {
    console.error("[createCampaign]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

