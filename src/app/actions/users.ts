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

/* ------------------------------ users ------------------------------- */

export async function toggleUserBlock(id: number, block: boolean) {
  try {
    await db.update(s.appUsers).set({ status: block ? "blocked" : "active" }).where(eq(s.appUsers.id, id));
    await auditLog("TOGGLE_USER", "app_users", id, { blocked: block });
    safeRevalidate("/admin/users");
  } catch (e) { console.error("[toggleUserBlock]", e); }
}

/* --------------------------- white-label ---------------------------- */

export async function updateCompanySettings(input: {
  name: string;
  appName: string;
  domain: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string;
}) {
  try {
    const cid = await companyId();
    await db.update(s.companies).set({
      name: input.name,
      appName: input.appName,
      domain: input.domain,
      industry: input.industry,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      accentColor: input.accentColor,
      tagline: input.tagline,
    }).where(eq(s.companies.id, cid));
    await auditLog("UPDATE_SETTINGS", "companies", cid);
    safeRevalidate("/");
    safeRevalidate("/admin");
    safeRevalidate("/admin/settings");
  } catch (e) { console.error("[updateCompanySettings]", e); }
}

