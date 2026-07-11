import "dotenv/config";

import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL || "";

console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is missing!");
}

// Neon serverless HTTP driver – works in Cloudflare Workers (no TCP sockets)
export const sql: NeonQueryFunction<false, false> = neon(databaseUrl);

export const db = drizzle(sql);

// Compatibility shim for files that use pool.connect() transactions.
// Neon HTTP runs each statement in its own implicit transaction.
// We wrap it so existing transaction blocks still work (serially via HTTP).
export const pool = {
  connect: async () => {
    const queries: string[] = [];
    const client = {
      query: async (text: string, values?: unknown[]) => {
        if (text.trim().toUpperCase() === "BEGIN" || text.trim().toUpperCase() === "ROLLBACK") {
          return { rows: [] };
        }
        if (text.trim().toUpperCase() === "COMMIT") {
          return { rows: [] };
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await sql(text, values as unknown[] | undefined);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { rows: result as any[] };
      },
      release: () => {},
    };
    return client;
  },
};