import "dotenv/config";

import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Fallback prevents neon() from throwing during Next.js build when DATABASE_URL is not set.
// At runtime on Cloudflare the real DATABASE_URL env var is always present.
const rawUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost/dummy";
// Strip channel_binding — TCP-only SSL feature, not supported by Neon HTTP/WebSocket drivers
const databaseUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");

console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is missing!");
}

// Use the global WebSocket (available in both Cloudflare Workers and Node.js 22+)
// This enables the Neon Pool to use WebSockets instead of TCP
if (typeof globalThis.WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

// HTTP driver for Drizzle ORM queries (fastest for edge/serverless)
export const sql = neon(databaseUrl);
export const db = drizzle(sql);

// Neon Pool uses WebSockets – works in Cloudflare Workers, same API as pg Pool
// Existing code that uses pool.connect() + BEGIN/COMMIT will work unchanged
export const pool = new Pool({ connectionString: databaseUrl });