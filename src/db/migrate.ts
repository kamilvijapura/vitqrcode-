import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Idempotently creates all enums and tables if they don't exist.
 * This makes the app self-bootstrapping in any environment,
 * complementing `drizzle-kit push`.
 */
const DDL = `
DO $$ BEGIN CREATE TYPE "product_status" AS ENUM('active','inactive'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "qr_status" AS ENUM('unused','used','expired','invalid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "reward_status" AS ENUM('active','inactive','out_of_stock'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "campaign_status" AS ENUM('scheduled','active','ended'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "user_status" AS ENUM('active','blocked'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "membership_tier" AS ENUM('bronze','silver','gold','platinum'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "scan_status" AS ENUM('success','duplicate','invalid','expired'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "redemption_status" AS ENUM('pending','approved','rejected','dispatched','delivered'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "tx_type" AS ENUM('earn','redeem'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "notif_type" AS ENUM('reward','points','campaign','system'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "doc_type" AS ENUM('pdf','brochure','datasheet','marketing'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "companies" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "app_name" text NOT NULL,
  "logo" text,
  "domain" text,
  "industry" text,
  "primary_color" text NOT NULL DEFAULT '#4f46e5',
  "secondary_color" text NOT NULL DEFAULT '#0ea5e9',
  "accent_color" text NOT NULL DEFAULT '#f59e0b',
  "contact_email" text,
  "contact_phone" text,
  "address" text,
  "tagline" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "sku" text NOT NULL,
  "batch" text NOT NULL,
  "category" text NOT NULL,
  "description" text,
  "reward_points" integer NOT NULL DEFAULT 0,
  "price" numeric(10,2) NOT NULL DEFAULT '0',
  "image_url" text,
  "specs" jsonb,
  "status" "product_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "qr_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" text NOT NULL UNIQUE,
  "product_id" integer NOT NULL REFERENCES "products"("id"),
  "batch" text NOT NULL,
  "batch_id" integer,
  "status" "qr_status" DEFAULT 'unused' NOT NULL,
  "scanned_by_user_id" integer,
  "scanned_at" timestamptz,
  "points_awarded" integer NOT NULL DEFAULT 0,
  "expires_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE "qr_codes" ADD COLUMN IF NOT EXISTS "batch_id" integer;

CREATE TABLE IF NOT EXISTS "qr_batches" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "description" text,
  "product_id" integer NOT NULL REFERENCES "products"("id"),
  "count" integer NOT NULL DEFAULT 0,
  "source" text NOT NULL DEFAULT 'manual',
  "design_config" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "qr_templates" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "config" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rewards" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "category" text NOT NULL,
  "description" text,
  "required_points" integer NOT NULL DEFAULT 0,
  "stock" integer NOT NULL DEFAULT 0,
  "image_url" text,
  "status" "reward_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "type" text NOT NULL,
  "description" text,
  "points_multiplier" numeric(3,1) NOT NULL DEFAULT '1.0',
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" "campaign_status" DEFAULT 'active' NOT NULL,
  "banner" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "app_users" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text,
  "avatar_url" text,
  "total_points" integer NOT NULL DEFAULT 0,
  "wallet_balance" integer NOT NULL DEFAULT 0,
  "lifetime_scans" integer NOT NULL DEFAULT 0,
  "membership_tier" "membership_tier" DEFAULT 'bronze' NOT NULL,
  "status" "user_status" DEFAULT 'active' NOT NULL,
  "joined_at" timestamptz DEFAULT now() NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "scans" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "app_users"("id"),
  "qr_code_id" integer REFERENCES "qr_codes"("id"),
  "product_id" integer REFERENCES "products"("id"),
  "points" integer NOT NULL DEFAULT 0,
  "status" "scan_status" DEFAULT 'success' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "redemptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "app_users"("id"),
  "reward_id" integer NOT NULL REFERENCES "rewards"("id"),
  "reward_name" text NOT NULL,
  "points_cost" integer NOT NULL DEFAULT 0,
  "status" "redemption_status" DEFAULT 'pending' NOT NULL,
  "address" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "app_users"("id"),
  "type" "tx_type" NOT NULL,
  "points" integer NOT NULL DEFAULT 0,
  "description" text NOT NULL,
  "balance_after" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "type" "notif_type" DEFAULT 'system' NOT NULL,
  "read" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "catalogues" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "companies"("id"),
  "title" text NOT NULL,
  "doc_type" "doc_type" DEFAULT 'pdf' NOT NULL,
  "category" text NOT NULL,
  "file_url" text,
  "version" text NOT NULL DEFAULT '1.0',
  "size_kb" integer NOT NULL DEFAULT 0,
  "downloads" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Template metadata migrations (added in v2)
ALTER TABLE "qr_templates" ADD COLUMN IF NOT EXISTS "category" text NOT NULL DEFAULT 'General';
ALTER TABLE "qr_templates" ADD COLUMN IF NOT EXISTS "thumbnail" text;
ALTER TABLE "qr_templates" ADD COLUMN IF NOT EXISTS "is_default" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "actor" text NOT NULL DEFAULT 'system',
  "action" text NOT NULL,
  "entity_type" text,
  "entity_id" integer,
  "details" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Performance indexes (critical for production scale)
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON "qr_codes" ("status");
CREATE INDEX IF NOT EXISTS idx_qr_codes_batch_id ON "qr_codes" ("batch_id");
CREATE INDEX IF NOT EXISTS idx_qr_codes_product_id ON "qr_codes" ("product_id");
CREATE INDEX IF NOT EXISTS idx_qr_codes_scanned_by ON "qr_codes" ("scanned_by_user_id");
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON "scans" ("user_id");
CREATE INDEX IF NOT EXISTS idx_scans_product_id ON "scans" ("product_id");
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON "transactions" ("user_id");
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON "redemptions" ("user_id");
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON "redemptions" ("status");
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS idx_qr_templates_company_id ON "qr_templates" ("company_id");
CREATE INDEX IF NOT EXISTS idx_qr_batches_company_id ON "qr_batches" ("company_id");
CREATE INDEX IF NOT EXISTS idx_products_company_id ON "products" ("company_id");
CREATE INDEX IF NOT EXISTS idx_rewards_company_id ON "rewards" ("company_id");
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON "campaigns" ("company_id");
CREATE INDEX IF NOT EXISTS idx_app_users_company_id ON "app_users" ("company_id");
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON "audit_logs" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON "audit_logs" ("created_at");

-- Admin auth additions (v3)
DO $$ BEGIN CREATE TYPE "admin_role" AS ENUM('super_admin','admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" "admin_role" DEFAULT 'admin' NOT NULL,
  "last_login" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Consumer PIN login (v3)
ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "pin" text NOT NULL DEFAULT '123456';

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON "admin_users" ("email");
CREATE INDEX IF NOT EXISTS idx_app_users_phone ON "app_users" ("phone");
`;

export async function ensureSchema() {
  const statements = DDL.split(';\n').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt + ';'));
    } catch (e) {
      console.error("Migration error on statement:", stmt, e);
    }
  }
}
