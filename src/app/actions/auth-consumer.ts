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

/* ------------------------- Consumer Auth ---------------- */

/**
 * Two-step consumer login: phone → PIN.
 * Returns the matched user on success.
 */
export async function userLoginStep1(phone: string): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const trimmed = phone.trim();
    if (!trimmed) return { ok: false, error: "Phone number is required." };

    if (!checkRateLimit(`user-login:${trimmed}`).ok) {
      return { ok: false, error: "Too many attempts. Please try again later." };
    }

    const [user] = await db
      .select({ id: s.appUsers.id, name: s.appUsers.name, status: s.appUsers.status })
      .from(s.appUsers)
      .where(eq(s.appUsers.phone, trimmed))
      .limit(1);

    if (!user) return { ok: false, error: "No account found with this phone number." };
    if (user.status === "blocked") return { ok: false, error: "Your account has been suspended. Contact support." };

    return { ok: true, name: user.name };
  } catch (e) {
    console.error("[userLoginStep1]", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Step 2: verify PIN and set session cookie.
 */
export async function userLoginStep2(phone: string, pin: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const trimmedPhone = phone.trim();
    const trimmedPin = pin.trim();
    if (!trimmedPhone || !trimmedPin) return { ok: false, error: "Phone and PIN are required." };

    if (!checkRateLimit(`user-login-pin:${trimmedPhone}`).ok) {
      return { ok: false, error: "Too many attempts. Please try again later." };
    }

    const [user] = await db
      .select()
      .from(s.appUsers)
      .where(eq(s.appUsers.phone, trimmedPhone))
      .limit(1);

    if (!user) return { ok: false, error: "Invalid credentials." };
    if (user.status === "blocked") return { ok: false, error: "Account suspended." };
    
    const validPin = await verifyPassword(trimmedPin, user.pin);
    if (!validPin) return { ok: false, error: "Incorrect PIN. Please try again." };

    await setUserCookie({
      userId: user.id,
      name: user.name,
      phone: user.phone,
    });

    return { ok: true };
  } catch (e) {
    console.error("[userLoginStep2]", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Clear consumer session cookie and redirect to login. */
export async function userLogout(): Promise<never> {
  await clearUserCookie();
  redirect("/app/login");
}

/** Return the current consumer session. */
export async function getSessionUser(): Promise<UserPayload | null> {
  return getUserSession();
}
