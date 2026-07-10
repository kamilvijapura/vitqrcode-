import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  numeric,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

/* ---------------------------------------------------------------- enums -- */

export const productStatus = pgEnum("product_status", ["active", "inactive"]);
export const qrStatus = pgEnum("qr_status", [
  "unused",
  "used",
  "expired",
  "invalid",
]);
export const rewardStatus = pgEnum("reward_status", [
  "active",
  "inactive",
  "out_of_stock",
]);
export const campaignStatus = pgEnum("campaign_status", [
  "scheduled",
  "active",
  "ended",
]);
export const userStatus = pgEnum("user_status", ["active", "blocked"]);
export const membershipTier = pgEnum("membership_tier", [
  "bronze",
  "silver",
  "gold",
  "platinum",
]);
export const scanStatus = pgEnum("scan_status", [
  "success",
  "duplicate",
  "invalid",
  "expired",
]);
export const redemptionStatus = pgEnum("redemption_status", [
  "pending",
  "approved",
  "rejected",
  "dispatched",
  "delivered",
]);
export const txType = pgEnum("tx_type", ["earn", "redeem"]);
export const notifType = pgEnum("notif_type", [
  "reward",
  "points",
  "campaign",
  "system",
]);
export const docType = pgEnum("doc_type", [
  "pdf",
  "brochure",
  "datasheet",
  "marketing",
]);

/* ----------------------------------------------------------- companies -- */

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  appName: text("app_name").notNull(),
  logo: text("logo"),
  domain: text("domain"),
  industry: text("industry"),
  primaryColor: text("primary_color").notNull().default("#4f46e5"),
  secondaryColor: text("secondary_color").notNull().default("#0ea5e9"),
  accentColor: text("accent_color").notNull().default("#f59e0b"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  tagline: text("tagline"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------ products -- */

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  batch: text("batch").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  rewardPoints: integer("reward_points").notNull().default(0),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  imageUrl: text("image_url"),
  specs: jsonb("specs").$type<Record<string, string>>(),
  status: productStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------- qr codes -- */

export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  batch: text("batch").notNull(),
  batchId: integer("batch_id"),
  status: qrStatus("status").notNull().default("unused"),
  scannedByUserId: integer("scanned_by_user_id"),
  scannedAt: timestamp("scanned_at", { withTimezone: true }),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------- qr batches -- */

export const qrBatches = pgTable("qr_batches", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  count: integer("count").notNull().default(0),
  source: text("source").notNull().default("manual"),
  designConfig: jsonb("design_config").$type<Record<string, unknown>>(),
  templateId: integer("template_id").references(() => qrTemplates.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------ qr templates -- */

export const qrTemplates = pgTable("qr_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  config: jsonb("config").notNull(),
  thumbnail: text("thumbnail"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------- rewards -- */

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  requiredPoints: integer("required_points").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  status: rewardStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ----------------------------------------------------------- campaigns -- */

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  pointsMultiplier: numeric("points_multiplier", { precision: 3, scale: 1 })
    .notNull()
    .default("1.0"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: campaignStatus("status").notNull().default("active"),
  banner: text("banner"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ----------------------------------------------------- mobile users -- */

export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  pin: text("pin").notNull().default("$2b$12$mq1g2zSh8oGfp1b3JW4Gw.jPZz4UzS.pJtw7qNx6YfDbxne9qMeA."),
  totalPoints: integer("total_points").notNull().default(0),
  walletBalance: integer("wallet_balance").notNull().default(0),
  lifetimeScans: integer("lifetime_scans").notNull().default(0),
  membershipTier: membershipTier("membership_tier").notNull().default("bronze"),
  status: userStatus("status").notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------- admin users -- */

export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "admin"]);

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: adminRoleEnum("role").notNull().default("admin"),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* --------------------------------------------------------------- scans -- */

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => appUsers.id),
  qrCodeId: integer("qr_code_id").references(() => qrCodes.id),
  productId: integer("product_id").references(() => products.id),
  points: integer("points").notNull().default(0),
  status: scanStatus("status").notNull().default("success"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* --------------------------------------------------------- redemptions -- */

export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => appUsers.id),
  rewardId: integer("reward_id")
    .notNull()
    .references(() => rewards.id),
  rewardName: text("reward_name").notNull(),
  pointsCost: integer("points_cost").notNull().default(0),
  status: redemptionStatus("status").notNull().default("pending"),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ---------------------------------------------------------- wallet tx -- */

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => appUsers.id),
  type: txType("type").notNull(),
  points: integer("points").notNull().default(0),
  description: text("description").notNull(),
  balanceAfter: integer("balance_after").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------- notifications -- */

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: notifType("type").notNull().default("system"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ----------------------------------------------------------- catalogue -- */

export const catalogues = pgTable("catalogues", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  title: text("title").notNull(),
  docType: docType("doc_type").notNull().default("pdf"),
  category: text("category").notNull(),
  fileUrl: text("file_url"),
  version: text("version").notNull().default("1.0"),
  sizeKb: integer("size_kb").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* --------------------------------------------------------- audit logs -- */

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull().default("system"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type Product = typeof products.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;
export type QrBatch = typeof qrBatches.$inferSelect;
export type QrTemplate = typeof qrTemplates.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type AppUser = typeof appUsers.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Catalogue = typeof catalogues.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
