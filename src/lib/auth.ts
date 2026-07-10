/**
 * Full auth utilities for server-side use (Node.js runtime only — NOT Edge).
 * Combines JWT (from jwt.ts) with bcryptjs for password hashing.
 */
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  signAdminToken,
  signUserToken,
  verifyAdminToken,
  verifyUserToken,
  ADMIN_COOKIE,
  USER_COOKIE,
} from "@/lib/jwt";

export type { AdminPayload, UserPayload } from "@/lib/jwt";
export {
  ADMIN_COOKIE,
  USER_COOKIE,
  signAdminToken,
  signUserToken,
  verifyAdminToken,
  verifyUserToken,
};

const ADMIN_TTL = 60 * 60 * 24;
const USER_TTL = 60 * 60 * 24 * 7;

import type { AdminPayload, UserPayload } from "@/lib/jwt";

/* ── Password helpers ───────────────────────────────────── */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ── Cookie session helpers ─────────────────────────────── */

export async function getAdminSession(): Promise<AdminPayload | null> {
  try {
    const jar = await cookies();
    const token = jar.get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function getUserSession(): Promise<UserPayload | null> {
  try {
    const jar = await cookies();
    const token = jar.get(USER_COOKIE)?.value;
    if (!token) return null;
    return verifyUserToken(token);
  } catch {
    return null;
  }
}

export async function setAdminCookie(payload: AdminPayload): Promise<void> {
  const token = await signAdminToken(payload);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_TTL,
    path: "/",
  });
}

export async function setUserCookie(payload: UserPayload): Promise<void> {
  const token = await signUserToken(payload);
  const jar = await cookies();
  jar.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: USER_TTL,
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function clearUserCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(USER_COOKIE, "", { maxAge: 0, path: "/" });
}
