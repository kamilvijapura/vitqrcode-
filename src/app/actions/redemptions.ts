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

/* --------------------------- redemptions ---------------------------- */

export async function updateRedemptionStatus(id: number, status: string) {
  try {
    // If rejecting, refund the user's wallet points
    if (status === "rejected") {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const redemption = await client.query(
          `SELECT user_id, points_cost, status FROM redemptions WHERE id = $1 FOR UPDATE`,
          [id],
        );
        if (redemption.rows.length > 0 && redemption.rows[0].status === "pending") {
          const userId = redemption.rows[0].user_id;
          const cost = redemption.rows[0].points_cost;
          await client.query(`UPDATE app_users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [cost, userId]);
          await client.query(`INSERT INTO transactions (user_id, type, points, description, balance_after) VALUES ($1, 'earn', $2, $3, (SELECT wallet_balance FROM app_users WHERE id = $1))`, [userId, cost, `Refund — Rejected redemption #${id}`]);
          await client.query(`INSERT INTO notifications (user_id, title, body, type) VALUES ($1, '💰 Points Refunded', $2, 'reward')`, [userId, `${cost} points refunded for rejected redemption.`]);
        }
        await client.query(`UPDATE redemptions SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } else {
      await db.update(s.redemptions).set({ status: status as never, updatedAt: new Date() }).where(eq(s.redemptions.id, id));
    }
    await auditLog("UPDATE_REDEMPTION", "redemptions", id, { status });
    revalidateAll(["/admin/redemptions", "/admin", "/app", "/app/wallet", "/app/notifications"]);
  } catch (e) {
    console.error("[updateRedemptionStatus]", e);
  }
}

