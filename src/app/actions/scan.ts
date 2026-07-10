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

/* ------------------------------ scan -------------------------------- */

/**
 * ATOMIC QR Scan & One-Time Redemption
 *
 * Uses a PostgreSQL transaction with SELECT ... FOR UPDATE row-level locking
 * to guarantee that a QR code can only be redeemed exactly once, even under
 * concurrent requests. This prevents race conditions and double-crediting.
 *
 * Flow:
 * 1. BEGIN TRANSACTION
 * 2. SELECT an unused QR with FOR UPDATE SKIP LOCKED (row lock)
 * 3. Verify it's still "unused" inside the transaction
 * 4. UPDATE to "used" + INSERT scan + UPDATE wallet + INSERT tx log
 * 5. COMMIT (or ROLLBACK on any error)
 */
export async function processRealScan(userId: number, code: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Atomic select: pick the SPECIFIC unused QR with row-level lock
    const candidateRes = await client.query(
      `SELECT q.id, q.code, q.product_id, p.name as product_name, p.image_url, p.reward_points
       FROM qr_codes q
       INNER JOIN products p ON p.id = q.product_id
       WHERE q.code = $1 AND q.status = 'unused' AND p.status = 'active'
       FOR UPDATE OF q SKIP LOCKED`,
      [code]
    );

    if (candidateRes.rows.length === 0) {
      await client.query("ROLLBACK");
      // Check if it exists but is used
      const existsRes = await client.query(`SELECT status FROM qr_codes WHERE code = $1`, [code]);
      if (existsRes.rows.length > 0 && existsRes.rows[0].status !== 'unused') {
        return { ok: false, reason: "already_redeemed" as const };
      }
      return { ok: false, reason: "not_found" as const };
    }

    const pick = candidateRes.rows[0];

    // Lock the user row too (prevent concurrent wallet modifications)
    const userRes = await client.query(
      `SELECT id, wallet_balance, total_points, lifetime_scans FROM app_users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "no_user" as const };
    }
    const u = userRes.rows[0];

    // Award points with campaign multiplier
    const multiplier = Math.random() < 0.35 ? 2 : 1;
    const points = Number(pick.reward_points) * multiplier;
    const newBalance = Number(u.wallet_balance) + points;
    const newTotal = Number(u.total_points) + points;
    const newTier = newTotal > 9000 ? "platinum" : newTotal > 5000 ? "gold" : newTotal > 2000 ? "silver" : "bronze";

    // === All mutations in the transaction ===

    // 1. Mark QR as USED (this is the critical one-time lock)
    await client.query(
      `UPDATE qr_codes SET status = 'used', scanned_by_user_id = $1, scanned_at = NOW(), points_awarded = $2 WHERE id = $3`,
      [userId, points, pick.id],
    );

    // 2. Record the scan
    await client.query(
      `INSERT INTO scans (user_id, qr_code_id, product_id, points, status) VALUES ($1, $2, $3, $4, 'success')`,
      [userId, pick.id, pick.product_id, points],
    );

    // 3. Credit wallet + points + scan count
    await client.query(
      `UPDATE app_users SET wallet_balance = $1, total_points = $2, lifetime_scans = $3, membership_tier = $4 WHERE id = $5`,
      [newBalance, newTotal, Number(u.lifetime_scans) + 1, newTier, userId],
    );

    // 4. Transaction log
    await client.query(
      `INSERT INTO transactions (user_id, type, points, description, balance_after) VALUES ($1, 'earn', $2, $3, $4)`,
      [userId, points, multiplier > 1 ? `QR Scan Reward ×2 — ${pick.product_name}` : `QR Scan Reward — ${pick.product_name}`, newBalance],
    );

    // 5. Notification
    await client.query(
      `INSERT INTO notifications (user_id, title, body, type) VALUES ($1, $2, $3, 'points')`,
      [userId, multiplier > 1 ? "🎉 Bonus Points Earned!" : "⭐ Points Credited", `You earned ${points} points from scanning ${pick.product_name}.`],
    );

    await client.query("COMMIT");

    await auditLog("QR_REDEEMED", "qr_codes", pick.id, { userId, points, code: pick.code }, String(userId));
    safeRevalidate("/app");
    safeRevalidate("/admin");
    return { 
      ok: true, 
      outcome: "success" as const, 
      product: { name: pick.product_name, imageUrl: pick.image_url }, 
      points, 
      multiplier, 
      newBalance, 
      newTier 
    };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[processRealScan] Transaction failed:", e);
    return { ok: false, reason: "error" as const, message: e instanceof Error ? e.message : "Unknown error" };
  } finally {
    client.release();
  }
}

export async function simulateScan(userId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Atomic select: pick ONE unused QR with row-level lock, skip already-locked rows
    const candidateRes = await client.query(
      `SELECT q.id, q.code, q.product_id, p.name as product_name, p.image_url, p.reward_points
       FROM qr_codes q
       INNER JOIN products p ON p.id = q.product_id
       WHERE q.status = 'unused' AND p.status = 'active'
       ORDER BY RANDOM()
       LIMIT 1
       FOR UPDATE OF q SKIP LOCKED`,
    );

    if (candidateRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "no_codes" as const };
    }

    const pick = candidateRes.rows[0];

    // Lock the user row too (prevent concurrent wallet modifications)
    const userRes = await client.query(
      `SELECT id, wallet_balance, total_points, lifetime_scans FROM app_users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "no_user" as const };
    }
    const u = userRes.rows[0];

    // Double-check QR is still unused (belt + suspenders)
    const verifyRes = await client.query(
      `SELECT status FROM qr_codes WHERE id = $1`,
      [pick.id],
    );
    if (verifyRes.rows[0]?.status !== "unused") {
      await client.query("ROLLBACK");
      return { ok: false, reason: "already_redeemed" as const };
    }

    // Award points with campaign multiplier
    const multiplier = Math.random() < 0.35 ? 2 : 1;
    const points = Number(pick.reward_points) * multiplier;
    const newBalance = Number(u.wallet_balance) + points;
    const newTotal = Number(u.total_points) + points;
    const newTier = newTotal > 9000 ? "platinum" : newTotal > 5000 ? "gold" : newTotal > 2000 ? "silver" : "bronze";

    // === All mutations in the transaction ===

    // 1. Mark QR as USED (this is the critical one-time lock)
    await client.query(
      `UPDATE qr_codes SET status = 'used', scanned_by_user_id = $1, scanned_at = NOW(), points_awarded = $2 WHERE id = $3`,
      [userId, points, pick.id],
    );

    // 2. Record the scan
    await client.query(
      `INSERT INTO scans (user_id, qr_code_id, product_id, points, status) VALUES ($1, $2, $3, $4, 'success')`,
      [userId, pick.id, pick.product_id, points],
    );

    // 3. Credit wallet + points + scan count
    await client.query(
      `UPDATE app_users SET wallet_balance = $1, total_points = $2, lifetime_scans = $3, membership_tier = $4 WHERE id = $5`,
      [newBalance, newTotal, Number(u.lifetime_scans) + 1, newTier, userId],
    );

    // 4. Transaction log
    await client.query(
      `INSERT INTO transactions (user_id, type, points, description, balance_after) VALUES ($1, 'earn', $2, $3, $4)`,
      [userId, points, multiplier > 1 ? `QR Scan Reward ×2 — ${pick.product_name}` : `QR Scan Reward — ${pick.product_name}`, newBalance],
    );

    // 5. Notification
    await client.query(
      `INSERT INTO notifications (user_id, title, body, type) VALUES ($1, $2, $3, 'points')`,
      [userId, multiplier > 1 ? "🎉 Bonus Points Earned!" : "⭐ Points Credited", `You earned ${points} points from scanning ${pick.product_name}.`],
    );

    await client.query("COMMIT");

    // Audit log (outside transaction — best effort)
    await auditLog("QR_REDEEMED", "qr_codes", pick.id, { userId, points, code: pick.code }, String(userId));

    revalidateAll(["/app", "/app/wallet", "/app/history", "/app/notifications", "/admin", "/admin/users"]);

    return {
      ok: true,
      outcome: "success" as const,
      product: { name: pick.product_name, imageUrl: pick.image_url },
      points,
      multiplier,
      newBalance,
      newTier,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[simulateScan] Transaction failed:", e);
    return { ok: false, reason: "error" as const };
  } finally {
    client.release();
  }
}

/* --------------------------- redeem (mobile) ------------------------ */

/**
 * ATOMIC Reward Redemption
 *
 * Uses a PostgreSQL transaction with row-level locking to prevent
 * double-spending of wallet points and overselling of stock.
 */
export async function redeemReward(userId: number, rewardId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock both user and reward rows
    const userRes = await client.query(
      `SELECT id, name, wallet_balance, status FROM app_users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "not_found" as const };
    }
    const u = userRes.rows[0];

    const rewardRes = await client.query(
      `SELECT id, name, required_points, stock, status FROM rewards WHERE id = $1 FOR UPDATE`,
      [rewardId],
    );
    if (rewardRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "not_found" as const };
    }
    const r = rewardRes.rows[0];

    // Validation checks (server-side, never trust client)
    if (u.status === "blocked") {
      await client.query("ROLLBACK");
      return { ok: false, reason: "blocked" as const };
    }
    if (r.status === "out_of_stock" || Number(r.stock) <= 0) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "out_of_stock" as const };
    }
    const balance = Number(u.wallet_balance);
    const cost = Number(r.required_points);
    if (balance < cost) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "insufficient" as const, deficit: cost - balance };
    }

    const newBalance = balance - cost;

    // === All mutations atomic ===

    // 1. Create redemption record
    const redemptionRes = await client.query(
      `INSERT INTO redemptions (user_id, reward_id, reward_name, points_cost, status, address)
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING id`,
      [userId, rewardId, r.name, cost, `${u.name}'s Residence, Pune, MH`],
    );
    const redemptionId = redemptionRes.rows[0].id;

    // 2. Deduct wallet atomically
    await client.query(
      `UPDATE app_users SET wallet_balance = $1 WHERE id = $2`,
      [newBalance, userId],
    );

    // 3. Decrement stock atomically
    await client.query(
      `UPDATE rewards SET stock = GREATEST(0, stock - 1) WHERE id = $1`,
      [rewardId],
    );

    // 4. Transaction log
    await client.query(
      `INSERT INTO transactions (user_id, type, points, description, balance_after)
       VALUES ($1, 'redeem', $2, $3, $4)`,
      [userId, -cost, `Redeemed — ${r.name}`, newBalance],
    );

    // 5. Notification
    await client.query(
      `INSERT INTO notifications (user_id, title, body, type)
       VALUES ($1, '🎁 Redemption Placed', $2, 'reward')`,
      [userId, `Your request for ${r.name} is pending approval.`],
    );

    await client.query("COMMIT");

    await auditLog("REDEEM_REWARD", "redemptions", redemptionId, { userId, rewardId, points: cost }, String(userId));

    revalidateAll(["/app", "/app/wallet", "/app/rewards", "/app/notifications", "/admin/redemptions", "/admin/rewards", "/admin"]);

    return { ok: true, redemption: { id: redemptionId }, newBalance };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[redeemReward] Transaction failed:", e);
    return { ok: false, reason: "error" as const };
  } finally {
    client.release();
  }
}

