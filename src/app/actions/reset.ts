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

/* ------------------------------ reset ------------------------------- */

export async function resetDemoData() {
  try {
    await db.delete(s.auditLogs);
    await db.delete(s.notifications);
    await db.delete(s.transactions);
    await db.delete(s.redemptions);
    await db.delete(s.scans);
    await db.delete(s.qrCodes);
    await db.delete(s.qrBatches);
    await db.delete(s.qrTemplates);
    await db.delete(s.rewards);
    await db.delete(s.campaigns);
    await db.delete(s.catalogues);
    await db.delete(s.products);
    await db.delete(s.appUsers);
    await db.delete(s.companies);
    const { ensureSeeded } = await import("@/db/seed");
    await ensureSeeded();
    safeRevalidate("/");
    safeRevalidate("/admin");
  } catch (e) { console.error("[resetDemoData]", e); }
}

