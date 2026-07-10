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

/* ------------------------- Admin Auth ------------------- */

/**
 * Real credential-based admin login.
 * Verifies email + password against admin_users table,
 * then sets an HTTP-only JWT session cookie.
 */
export async function adminLogin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return { ok: false, error: "Email and password are required." };

    if (!checkRateLimit(`admin-login:${trimmedEmail}`).ok) {
      return { ok: false, error: "Too many login attempts. Please try again later." };
    }

    const [admin] = await db
      .select()
      .from(s.adminUsers)
      .where(eq(s.adminUsers.email, trimmedEmail))
      .limit(1);

    if (!admin) return { ok: false, error: "Invalid email or password." };

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) return { ok: false, error: "Invalid email or password." };

    // Update last_login timestamp
    await db.update(s.adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(s.adminUsers.id, admin.id));

    await setAdminCookie({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    return { ok: true };
  } catch (e) {
    console.error("[adminLogin]", e);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}

/** Clear admin session cookie and redirect to login page. */
export async function adminLogout(): Promise<never> {
  await clearAdminCookie();
  redirect("/admin/login");
}

/** Return the current admin session (safe to call from server components). */
export async function getSessionAdmin(): Promise<AdminPayload | null> {
  return getAdminSession();
}

