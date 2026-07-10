/**
 * Edge-safe JWT utilities (no bcryptjs, no Node.js APIs).
 * Used by middleware.ts which runs in the Edge runtime.
 */
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "qr_admin_session";
export const USER_COOKIE = "qr_user_session";
const ADMIN_TTL = 60 * 60 * 24;
const USER_TTL = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) throw new Error("JWT_SECRET missing or too short");
  return new TextEncoder().encode(raw);
}

export interface AdminPayload {
  adminId: number;
  email: string;
  name: string;
  role: string;
}

export interface UserPayload {
  userId: number;
  name: string;
  phone: string;
}

export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_TTL}s`)
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function signUserToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${USER_TTL}s`)
    .sign(getSecret());
}

export async function verifyUserToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}
