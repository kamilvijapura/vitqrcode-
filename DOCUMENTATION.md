# Enterprise QR Rewards Platform — Complete System Documentation

> **Version**: 2.0 | **Stack**: Next.js 16 · TypeScript · PostgreSQL · Drizzle ORM · Tailwind CSS v4  
> **Last Updated**: July 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Server Actions (API Layer)](#5-server-actions-api-layer)
6. [Feature Modules](#6-feature-modules)
7. [Business Workflows](#7-business-workflows)
8. [Security Model](#8-security-model)
9. [Setup & Local Development](#9-setup--local-development)
10. [Deployment](#10-deployment)
11. [White-Label System](#11-white-label-system)
12. [Testing & Verification](#12-testing--verification)
13. [Maintenance & Operations](#13-maintenance--operations)
14. [Known Issues & Troubleshooting](#14-known-issues--troubleshooting)

---

## 1. System Overview

The **Enterprise QR Rewards Platform** is a full-stack web application that enables paint manufacturers and similar industries to run a **QR-code-based customer loyalty programme**. Contractors, painters, and end-consumers scan unique QR codes printed on product packaging to earn reward points, which can then be redeemed for merchandise, tools, and electronics.

### Key Personas

| Persona | Interface | Purpose |
|---|---|---|
| **Company Admin** | `/admin` | Manage products, QR codes, campaigns, users, redemptions |
| **Mobile Consumer** | `/app` | Scan QR codes, earn points, redeem rewards, view history |
| **Guest / Landing** | `/` | View platform marketing & branding |

### Core Value Proposition

- Every product can carry a **unique, single-use QR code** guaranteeing fraud-proof one-time redemption
- **Atomic database transactions** prevent double-crediting or double-spending
- **White-label ready** — colours, logo, brand name, and app name are runtime-configurable without rebuilding
- **Multi-tenant architecture** — one codebase supports multiple companies (currently scoped to one company ID)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js 16 App Router               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  /admin/**   │  │   /app/**    │  │     /     │ │
│  │ Server Pages │  │ Server Pages │  │  Landing  │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┘ │
│         │ Server Actions  │ Server Actions           │
│  ┌──────▼─────────────────▼───────────────────────┐ │
│  │              src/app/actions.ts                 │ │
│  │   (All data mutations — "use server" scope)     │ │
│  └──────────────────────┬──────────────────────── ┘ │
│                         │                            │
│  ┌──────────────────────▼──────────────────────── ┐ │
│  │        Drizzle ORM + node-postgres Pool         │ │
│  └──────────────────────┬──────────────────────── ┘ │
└─────────────────────────┼───────────────────────────┘
                          │
           ┌──────────────▼──────────────┐
           │    PostgreSQL 16 (UTF-8)     │
           │  localhost:5432 / app_db     │
           └─────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.6 |
| Language | TypeScript | 5.9.3 |
| Database | PostgreSQL | 16.3 |
| ORM | Drizzle ORM | 0.31.10 |
| DB Driver | node-postgres (pg) | — |
| Styling | Tailwind CSS | 4.3.2 |
| Charts | Recharts | — |
| QR Codes | qrcode | — |
| PDF Export | jsPDF | — |
| Zip Export | JSZip | — |
| Animations | Framer Motion | — |
| Icons | Lucide React | — |

### Rendering Strategy

- **Server Components** (default): Admin pages, product lists, dashboard stats — rendered on the server for SEO and performance
- **Client Components** (`"use client"`): Interactive widgets — QR generator steps, charts, modals, forms with live state
- **Server Actions** (`"use server"`): All database mutations — called from client components via React Server Action RPCs
- **Force-dynamic**: Any page that must not be statically cached uses `export const dynamic = "force-dynamic"`

---

## 3. Project Structure

```
enterprise-qr-rewards-platform/
├── src/
│   ├── app/
│   │   ├── actions.ts              ← All server actions (mutations)
│   │   ├── globals.css             ← Design system + Tailwind v4 theme
│   │   ├── layout.tsx              ← Root layout (font + toast provider)
│   │   ├── page.tsx                ← Landing page redirect
│   │   ├── not-found.tsx           ← Global 404 page
│   │   ├── admin/                  ← Admin console pages
│   │   │   ├── page.tsx            ← Dashboard (stats + charts)
│   │   │   ├── products/           ← Product catalogue management
│   │   │   ├── qr/                 ← QR management (overview, generate, design, history)
│   │   │   ├── rewards/            ← Reward catalogue management
│   │   │   ├── campaigns/          ← Campaign management
│   │   │   ├── redemptions/        ← Redemption approval workflow
│   │   │   ├── users/              ← Consumer user management
│   │   │   ├── notifications/      ← Push notification sending
│   │   │   ├── catalogue/          ← Document/brochure library
│   │   │   ├── reports/            ← Analytics & exports
│   │   │   ├── settings/           ← White-label settings
│   │   │   └── login/              ← Admin authentication (demo)
│   │   └── app/                    ← Mobile app simulator (consumer portal)
│   │       ├── page.tsx            ← Consumer dashboard
│   │       ├── scan/               ← QR scan simulator
│   │       ├── rewards/            ← Reward catalogue + redemption
│   │       ├── wallet/             ← Points wallet + transaction history
│   │       ├── history/            ← Scan history
│   │       ├── notifications/      ← User notifications
│   │       ├── campaigns/          ← Active campaigns view
│   │       ├── catalogue/          ← Product brochure downloads
│   │       ├── products/           ← Product information
│   │       └── profile/            ← User profile
│   ├── components/
│   │   ├── admin/                  ← Admin-specific components
│   │   │   ├── AdminShell.tsx      ← Sidebar + top nav + page header
│   │   │   ├── qr-generator.tsx    ← 3-step QR generation wizard
│   │   │   ├── qr-design.tsx       ← QR visual designer
│   │   │   ├── qr-subnav.tsx       ← QR section tab navigation
│   │   │   ├── qr-download.tsx     ← PDF/ZIP export utilities
│   │   │   ├── login-view.tsx      ← Admin login form
│   │   │   └── ...                 ← (more admin components)
│   │   ├── mobile/                 ← Consumer portal components
│   │   ├── brand.tsx               ← White-label brand display
│   │   ├── charts.tsx              ← Recharts wrappers
│   │   ├── landing.tsx             ← Landing page UI
│   │   ├── modal.tsx               ← Reusable modal
│   │   ├── qr-frame.tsx            ← QR preview renderer
│   │   ├── qr-renderer.tsx         ← Low-level QR SVG/Canvas renderer
│   │   ├── toast.tsx               ← Toast notification system
│   │   ├── loaders.tsx             ← Skeleton loading components
│   │   └── ui.tsx                  ← Design system primitives (Button, Card, Input, etc.)
│   ├── db/
│   │   ├── index.ts                ← Drizzle client + pg pool singleton
│   │   ├── schema.ts               ← Full database schema (14 tables)
│   │   ├── migrate.ts              ← Auto-migration runner
│   │   └── seed.ts                 ← Demo data seeder
│   └── lib/
│       ├── data.ts                 ← Server-side data fetching helpers
│       ├── utils.ts                ← Utility functions (cn, formatNumber, etc.)
│       └── qr-types.ts             ← QR design config TypeScript types
├── .env                            ← Database connection string
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── next.config.ts
└── DOCUMENTATION.md                ← This file
```

---

## 4. Database Schema

The database uses **PostgreSQL 16** with **14 tables** managed by Drizzle ORM with automatic schema migration (`ensureSchema()` runs on first request).

### Enums

| Enum | Values |
|---|---|
| `product_status` | `active`, `inactive` |
| `qr_status` | `unused`, `used`, `expired`, `invalid` |
| `reward_status` | `active`, `inactive`, `out_of_stock` |
| `campaign_status` | `scheduled`, `active`, `ended` |
| `user_status` | `active`, `blocked` |
| `membership_tier` | `bronze`, `silver`, `gold`, `platinum` |
| `scan_status` | `success`, `duplicate`, `invalid`, `expired` |
| `redemption_status` | `pending`, `approved`, `rejected`, `dispatched`, `delivered` |
| `tx_type` | `earn`, `redeem` |
| `notif_type` | `reward`, `points`, `campaign`, `system` |
| `doc_type` | `pdf`, `brochure`, `datasheet`, `marketing` |

### Tables

#### `companies` — Multi-tenant root
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `name` | text | Legal company name |
| `app_name` | text | White-label app name |
| `logo` | text | URL or base64 |
| `domain` | text | White-label domain |
| `industry` | text | e.g. "Paint Manufacturer" |
| `primary_color` | text | Hex (#4f46e5) |
| `secondary_color` | text | Hex |
| `accent_color` | text | Hex |
| `contact_email` | text | — |
| `contact_phone` | text | — |
| `address` | text | — |
| `tagline` | text | Marketing tagline |
| `created_at` | timestamptz | — |

#### `products` — Product catalogue
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `company_id` | integer FK → companies | — |
| `name` | text NOT NULL | Product name |
| `sku` | text NOT NULL | Stock-keeping unit |
| `batch` | text NOT NULL | Manufacturing batch |
| `category` | text NOT NULL | Interior, Exterior, Primer, etc. |
| `description` | text | — |
| `reward_points` | integer | Points awarded on scan |
| `price` | numeric(10,2) | Retail price |
| `image_url` | text | URL or emoji |
| `specs` | jsonb | Key-value technical specs |
| `status` | product_status | active \| inactive |
| `created_at` | timestamptz | — |

#### `qr_codes` — Individual QR codes (one per physical product)
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `code` | text UNIQUE NOT NULL | Unique alphanumeric code (e.g. `CS-AUR-1L-XYZ001`) |
| `product_id` | integer FK → products | — |
| `batch` | text | Batch label |
| `batch_id` | integer FK → qr_batches | — |
| `status` | qr_status | `unused` → `used` \| `expired` \| `invalid` |
| `scanned_by_user_id` | integer | User who redeemed it |
| `scanned_at` | timestamptz | Timestamp of scan |
| `points_awarded` | integer | Points credited on scan |
| `expires_at` | timestamptz | Code validity window |
| `created_at` | timestamptz | — |

#### `qr_batches` — Groups of QR codes
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `company_id` | integer FK | — |
| `name` | text | Batch name |
| `description` | text | — |
| `product_id` | integer FK | Associated product |
| `count` | integer | Number of codes |
| `source` | text | `manual`, `csv`, `excel`, `template`, `single` |
| `design_config` | jsonb | Snapshot of QR visual design |
| `created_at` | timestamptz | — |

#### `qr_templates` — Saved QR visual designs
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `company_id` | integer FK | — |
| `name` | text | Template name |
| `category` | text | Product Label, Business Card, Sticker, etc. |
| `config` | jsonb | Full `QrDesign` object |
| `thumbnail` | text | Base64 preview image |
| `is_default` | boolean | Default template flag |
| `created_at` | timestamptz | — |

#### `rewards` — Redeemable prizes
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `company_id` | integer FK | — |
| `name` | text | Reward name |
| `category` | text | Electronics, Tools, Apparel, etc. |
| `description` | text | — |
| `required_points` | integer | Points cost |
| `stock` | integer | Available units |
| `image_url` | text | URL or emoji |
| `status` | reward_status | `active`, `inactive`, `out_of_stock` |
| `created_at` | timestamptz | — |

#### `campaigns` — Points multiplier campaigns
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `company_id` | integer FK | — |
| `name` | text | Campaign name |
| `type` | text | Festival, Product Promotion, Launch, Double Points |
| `description` | text | — |
| `points_multiplier` | numeric(3,1) | e.g. `2.0` for double points |
| `start_date` | date | — |
| `end_date` | date | — |
| `status` | campaign_status | `scheduled`, `active`, `ended` |
| `banner` | text | Emoji or banner URL |
| `created_at` | timestamptz | — |

#### `app_users` — Consumer / mobile app users
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `company_id` | integer FK | — |
| `name` | text NOT NULL | — |
| `phone` | text NOT NULL | Primary login identifier |
| `email` | text | Optional |
| `avatar_url` | text | — |
| `total_points` | integer | Lifetime points earned |
| `wallet_balance` | integer | Redeemable points balance |
| `lifetime_scans` | integer | Total successful scans |
| `membership_tier` | membership_tier | `bronze` → `silver` → `gold` → `platinum` |
| `status` | user_status | `active` \| `blocked` |
| `joined_at` | timestamptz | — |
| `created_at` | timestamptz | — |

#### `scans` — Audit log of every QR scan attempt
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `user_id` | integer FK → app_users | — |
| `qr_code_id` | integer FK → qr_codes | — |
| `product_id` | integer FK → products | — |
| `points` | integer | Points awarded (0 if failed) |
| `status` | scan_status | `success`, `duplicate`, `invalid`, `expired` |
| `created_at` | timestamptz | — |

#### `redemptions` — Reward redemption requests
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `user_id` | integer FK → app_users | — |
| `reward_id` | integer FK → rewards | — |
| `reward_name` | text | Snapshot of reward name at time of redemption |
| `points_cost` | integer | Points deducted |
| `status` | redemption_status | `pending` → `approved` / `rejected` → `dispatched` → `delivered` |
| `address` | text | Shipping address |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

#### `transactions` — Points wallet ledger
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `user_id` | integer FK → app_users | — |
| `type` | tx_type | `earn` \| `redeem` |
| `points` | integer | Positive (earn) or negative (redeem) |
| `description` | text | Human-readable description |
| `balance_after` | integer | Wallet snapshot after transaction |
| `created_at` | timestamptz | — |

#### `notifications` — In-app notification inbox
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `user_id` | integer nullable | `null` = broadcast to all |
| `title` | text NOT NULL | Notification title |
| `body` | text NOT NULL | Notification body |
| `type` | notif_type | `reward`, `points`, `campaign`, `system` |
| `read` | boolean | Read/unread state |
| `created_at` | timestamptz | — |

#### `catalogues` — Product document library
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `company_id` | integer FK | — |
| `title` | text NOT NULL | Document title |
| `doc_type` | doc_type | `pdf`, `brochure`, `datasheet`, `marketing` |
| `category` | text | Grouping category |
| `file_url` | text | File URL or anchor |
| `version` | text | e.g. "v3.2" |
| `size_kb` | integer | File size in KB |
| `downloads` | integer | Download counter |
| `created_at` | timestamptz | — |

#### `audit_logs` — Compliance audit trail
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | — |
| `actor` | text | User ID or "system" |
| `action` | text | e.g. `CREATE_PRODUCT`, `QR_REDEEMED` |
| `entity_type` | text | Table name |
| `entity_id` | integer | Row ID |
| `details` | jsonb | Action-specific metadata |
| `created_at` | timestamptz | — |

### Performance Indexes

```sql
-- QR codes (hot path — scan lookups)
CREATE INDEX idx_qr_codes_status       ON qr_codes (status);
CREATE INDEX idx_qr_codes_batch_id     ON qr_codes (batch_id);
CREATE INDEX idx_qr_codes_product_id   ON qr_codes (product_id);
CREATE INDEX idx_qr_codes_scanned_by   ON qr_codes (scanned_by_user_id);

-- Scans & wallet
CREATE INDEX idx_scans_user_id         ON scans (user_id);
CREATE INDEX idx_scans_product_id      ON scans (product_id);
CREATE INDEX idx_transactions_user_id  ON transactions (user_id);
CREATE INDEX idx_redemptions_user_id   ON redemptions (user_id);
CREATE INDEX idx_redemptions_status    ON redemptions (status);
CREATE INDEX idx_notifications_user_id ON notifications (user_id);

-- Admin queries
CREATE INDEX idx_qr_templates_company_id ON qr_templates (company_id);
CREATE INDEX idx_qr_batches_company_id   ON qr_batches (company_id);
CREATE INDEX idx_products_company_id     ON products (company_id);
CREATE INDEX idx_rewards_company_id      ON rewards (company_id);
CREATE INDEX idx_campaigns_company_id    ON campaigns (company_id);
CREATE INDEX idx_app_users_company_id    ON app_users (company_id);

-- Audit log
CREATE INDEX idx_audit_logs_entity  ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at);
```

---

## 5. Server Actions (API Layer)

All mutations are **Next.js Server Actions** defined in [`src/app/actions.ts`](./src/app/actions.ts). They run exclusively on the server and are called directly from React components.

### Product Management

| Action | Signature | Description |
|---|---|---|
| `createProduct` | `(input) → {ok, error?}` | Creates a new product with validation |
| `updateProduct` | `(input) → {ok, error?}` | Updates product fields |
| `deleteProduct` | `(id: number)` | Permanently deletes a product |
| `toggleProductStatus` | `(id, active) → void` | Activates or deactivates a product |

### Reward Management

| Action | Signature | Description |
|---|---|---|
| `createReward` | `(input) → {ok, error?}` | Creates a new reward item |
| `updateReward` | `(input) → {ok, error?}` | Updates reward details |
| `deleteReward` | `(id: number)` | Permanently deletes a reward |

### Campaign Management

| Action | Signature | Description |
|---|---|---|
| `createCampaign` | `(input) → {ok, error?}` | Creates a points multiplier campaign |
| `deleteCampaign` | `(id: number)` | Deletes a campaign |

### QR Code Operations

| Action | Signature | Description |
|---|---|---|
| `generateSingleQrCode` | `(productId, templateId?) → GenResult` | Generates one unique QR code |
| `generateBulkQrCodes` | `(input) → GenResult` | Generates up to 5,000 codes in chunks of 500 |
| `importQrCodes` | `(input) → {ok, generated, duplicates}` | Imports codes from CSV/Excel data |
| `getBatchCodesForDownload` | `(batchId) → Code[]` | Retrieves all codes in a batch for export |
| `getBatchCodes` | `(batchId) → Code[]` | Retrieves codes for history drill-down |
| `deleteQrBatch` | `(id: number)` | Deletes batch + all its codes |

### QR Template Operations

| Action | Signature | Description |
|---|---|---|
| `saveQrTemplate` | `(input) → {ok, error?}` | Creates a new QR design template |
| `updateQrTemplate` | `(input) → {ok, error?}` | Updates an existing template |
| `deleteQrTemplate` | `(id: number)` | Deletes a template |
| `setDefaultTemplate` | `(id: number)` | Sets a template as the company default |
| `duplicateQrTemplate` | `(id: number)` | Creates a copy of a template |

### Redemption Workflow

| Action | Signature | Description |
|---|---|---|
| `updateRedemptionStatus` | `(id, status)` | Updates status; auto-refunds points on `rejected` |

### Consumer Scan (Atomic Transaction)

| Action | Signature | Description |
|---|---|---|
| `simulateScan` | `(userId: number) → ScanResult` | Atomic QR scan with row-level locking |

### Consumer Redemption (Atomic Transaction)

| Action | Signature | Description |
|---|---|---|
| `redeemReward` | `(userId, rewardId) → {ok, redemption?, newBalance?}` | Atomic reward redemption with balance check |

### User Management

| Action | Signature | Description |
|---|---|---|
| `toggleUserBlock` | `(id, block: boolean)` | Blocks or unblocks a consumer user |

### Settings

| Action | Signature | Description |
|---|---|---|
| `updateCompanySettings` | `(input)` | Updates brand name, colours, domain, tagline |

### Notifications

| Action | Signature | Description |
|---|---|---|
| `sendNotification` | `(input)` | Broadcasts a notification to all users |

### System

| Action | Signature | Description |
|---|---|---|
| `resetDemoData` | `() → void` | Wipes all data and re-seeds the database |
| `incrementCatalogueDownload` | `(id: number)` | Increments download counter |

---

## 6. Feature Modules

### 6.1 Admin Console (`/admin`)

#### Dashboard (`/admin`)
- Live statistics: total products, QR codes generated, active users, total redemptions
- Revenue trend chart (6 months)
- Scan activity chart
- Top products by scan count
- Tier distribution chart (pie)
- Recent activity feed
- Quick-action "Reset Demo" button

#### Products (`/admin/products`)
- Paginated product table with search and category filter
- Add/Edit product modal with emoji picker + image upload
- Toggle product active/inactive status
- Delete products (with confirmation)
- Product specs displayed as collapsible key-value pairs

#### QR Management (`/admin/qr`)
- **Overview**: Total codes, used %, active batches
- **Generate** (`/admin/qr/generate`): 3-step wizard
  - Step 1: Select template
  - Step 2: Configure batch (product, name, quantity 1-5,000) or single QR
  - Step 3: Download center (PNG, SVG, ZIP, PDF sheets, roll stickers)
- **Design** (`/admin/qr/design`): Visual QR code designer
  - Module shapes: square, rounded, dots
  - Colour customisation with colour picker
  - Background image with opacity
  - Frame text with custom radius
  - Corner eye styles
  - Preview + save as template
- **History** (`/admin/qr/history`): All batches with drill-down code view + delete

#### Rewards (`/admin/rewards`)
- Reward catalogue table
- Add/Edit reward with points cost, stock, category, and emoji
- Stock management (auto-marks as out-of-stock at 0)

#### Campaigns (`/admin/campaigns`)
- Campaign table with date ranges and multiplier display
- Create new campaigns with start/end dates, multiplier, type
- Delete campaigns

#### Redemptions (`/admin/redemptions`)
- Pending, approved, dispatched, delivered pipeline view
- Approve / Reject / Dispatch / Mark Delivered actions
- Auto-refund on rejection (atomic transaction)
- Redemption timeline per request

#### Users (`/admin/users`)
- Consumer user table with tier badges, points, scan count
- Block/Unblock users
- View membership tier distribution

#### Notifications (`/admin/notifications`)
- Compose and broadcast system notifications
- View recent notification history

#### Reports (`/admin/reports`)
- Scan analytics by date range
- Points distribution report
- Product performance

#### Catalogue (`/admin/catalogue`)
- Document library (PDFs, datasheets, brochures, marketing assets)
- Download counter tracking

#### Settings (`/admin/settings`)
- Company name, app name, domain
- Brand colour editor (hex inputs with live CSS variable preview)
- Tagline and contact info

### 6.2 Mobile App Simulator (`/app`)

Simulates a white-label mobile loyalty app with full CRUD functionality.

#### Consumer Dashboard (`/app`)
- User greeting with avatar and tier badge
- Points balance (wallet) card
- Tier progress bar
- Quick-action grid: Scan, Rewards, Wallet, History
- Recent scans widget
- Active campaigns banner

#### Scan (`/app/scan`)
- Animated QR viewfinder with scanline animation
- "Start Scanning" triggers `simulateScan` server action
- Success modal: product name, emoji, points earned, multiplier badge
- Error states: no codes available, scan error

#### Rewards (`/app/rewards`)
- Grid of available rewards filtered by user's balance
- Lock icon on unaffordable rewards
- Redemption modal with address confirmation
- Points deduction is instant and atomic

#### Wallet (`/app/wallet`)
- Current balance display
- Complete transaction history (earn/redeem with descriptions)
- Wallet balance trend

#### History (`/app/history`)
- All past QR scans with product name, points, status, date

#### Notifications (`/app/notifications`)
- Inbox of system, points, reward, and campaign notifications
- Read/unread state

#### Profile (`/app/profile`)
- User info, tier, lifetime stats
- Logout option

---

## 7. Business Workflows

### 7.1 QR Code Lifecycle

```
Admin creates product
       ↓
Admin generates QR batch (bulk or single)
       ↓
Unique codes stored in DB with status = "unused"
       ↓
Codes printed on physical product packaging
       ↓
Consumer scans code → simulateScan() called
       ↓
ATOMIC TRANSACTION:
  BEGIN
  SELECT qr_code FOR UPDATE SKIP LOCKED   ← row lock prevents race
  SELECT app_user FOR UPDATE              ← lock user wallet
  Verify code is still "unused"           ← double-check inside txn
  UPDATE qr_code.status = "used"
  INSERT scans record
  UPDATE app_users (wallet, points, tier)
  INSERT transactions (earn)
  INSERT notifications
  COMMIT
       ↓
Consumer sees success screen with points earned
```

### 7.2 Reward Redemption Lifecycle

```
Consumer selects reward in /app/rewards
       ↓
Redemption modal confirms address
       ↓
redeemReward() called
       ↓
ATOMIC TRANSACTION:
  BEGIN
  SELECT app_user FOR UPDATE    ← lock wallet
  SELECT reward FOR UPDATE      ← lock stock
  Validate: not blocked, in stock, sufficient balance
  INSERT redemptions (status=pending)
  UPDATE app_users.wallet_balance -= cost
  UPDATE rewards.stock -= 1 (GREATEST 0)
  INSERT transactions (redeem)
  INSERT notifications
  COMMIT
       ↓
Admin sees pending redemption in /admin/redemptions
       ↓
Admin approves → status = "approved"
       ↓
Admin marks dispatched → status = "dispatched"
       ↓
Admin marks delivered → status = "delivered"
       ↓
[If rejected] → points automatically refunded (atomic)
```

### 7.3 Auto-Seeding Lifecycle

The database is **automatically seeded on first request** via:

1. `db/migrate.ts` → `ensureSchema()` runs `CREATE TABLE IF NOT EXISTS` for all 14 tables + indexes
2. `db/seed.ts` → `ensureSeeded()` checks if `companies` table has any rows; if empty, inserts:
   - 1 company (ChromaShield Coatings)
   - 12 products across 5 categories
   - 10 rewards across 5 categories
   - 6 campaigns with multipliers
   - 12 app users (mixed tiers)
   - 6 QR batches with ~120 individual codes
   - 5 QR design templates
   - 90 scan records
   - 14 redemption records
   - 60 transaction records
   - 8 notifications
   - 8 catalogue documents

---

## 8. Security Model

### 8.1 Input Validation
- All server actions validate required fields before any database operation
- String fields are `.trim()`'d and checked for emptiness
- Numeric bounds are enforced (e.g. QR count clamped to 1–5,000)
- `requireString()` helper throws uniformly for missing fields

### 8.2 Atomic Transactions
- The two most fraud-sensitive operations (`simulateScan` and `redeemReward`) use **PostgreSQL row-level locking** (`SELECT ... FOR UPDATE SKIP LOCKED`)
- This prevents:
  - Double-redeeming the same QR code under concurrent requests
  - Overdrawing a user's wallet under concurrent redemptions
  - Overselling reward stock

### 8.3 Error Isolation
- All server actions are wrapped in `try/catch` blocks
- Errors are logged server-side (`console.error`) but only generic messages are returned to the client
- Database transactions always `ROLLBACK` on any error
- The `auditLog()` helper is best-effort (never throws, never blocks the main flow)

### 8.4 Data Integrity
- FK constraints enforce referential integrity (product → company, QR code → product, etc.)
- The `UNIQUE` constraint on `qr_codes.code` prevents duplicate code insertion at the DB level
- `status` fields use PostgreSQL ENUMs (validated at the DB level)

### 8.5 Admin Authentication
- The demo ships with a simple login form at `/admin/login`
- In production, this should be replaced with a proper auth solution (NextAuth, Clerk, Auth0, etc.)
- The demo uses a hardcoded PIN for quick access

### 8.6 Production Recommendations
- Enable HTTPS / TLS in production (Nginx/Caddy reverse proxy)
- Set `POSTGRES_PASSWORD` as an environment secret (not in `.env`)
- Enable PostgreSQL connection pooling (PgBouncer for high-concurrency)
- Rate-limit the scan endpoint (Redis-based rate limiting)
- Add CSRF protection headers
- Rotate `qr_codes.code` seed to a cryptographically secure random string

---

## 9. Setup & Local Development

### Prerequisites
- Node.js 20+ (LTS)
- Windows 10/11 or Linux/macOS
- Git

### Quick Start (with bundled PostgreSQL)

The repo ships with a portable PostgreSQL 16.3 binary in `postgres_bin/`. Use the following steps to get running locally with zero external dependencies:

```powershell
# 1. Install Node dependencies
npm install

# 2. Initialize the database cluster (UTF-8 locale is required for emoji support)
postgres_bin/pgsql/bin/initdb.exe -D ./pgdata -U postgres --auth-host=trust --auth-local=trust -E UTF8 --locale=C

# 3. Start PostgreSQL server (keep this terminal open, or run as a background task)
postgres_bin/pgsql/bin/postgres.exe -D ./pgdata -p 5432

# 4. Create the application database (new terminal)
postgres_bin/pgsql/bin/createdb.exe -U postgres -h 127.0.0.1 app_db

# 5. Create .env file
echo DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db > .env

# 6. Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the schema migrates and demo data seeds automatically on first request.

### Environment Variables

| Variable | Example | Required |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/app_db` | Yes |

### NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbopack` | Start dev server with Turbopack |
| `dev-webpack` | `next dev` | Start dev server with webpack (fallback) |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `typecheck` | `tsc --noEmit` | TypeScript type checking |
| `lint` | `eslint .` | Lint source files |

### Turbopack vs. Webpack

The default `npm run dev` uses **Turbopack** (faster cold start). If you encounter CSS compilation errors (`$.map is not a function`) — a known Turbopack/Tailwind v4 integration issue — use the webpack fallback:

```powershell
npm run dev-webpack
```

---

## 10. Deployment

### Option A: Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set environment variable: `DATABASE_URL` → your managed PostgreSQL connection string (e.g. Supabase, Neon, Railway)
3. Deploy — Vercel handles build and global CDN
4. Schema migration and seeding run automatically on first request

### Option B: VPS / Docker

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Database in Production

Use a managed PostgreSQL provider:
- **Supabase** (free tier with 500 MB)
- **Neon** (serverless, free tier)
- **Railway** (easy setup)
- **AWS RDS** / **Google Cloud SQL** (enterprise)

Ensure the database uses **UTF-8 encoding** to support emoji characters in product/reward image fields.

---

## 11. White-Label System

The platform is fully white-label ready. Brand customisation is stored in the `companies` table and applied at runtime via CSS variables.

### Configuring the Brand

1. Navigate to `/admin/settings`
2. Update:
   - **Company Name** — legal name
   - **App Name** — displayed in the consumer portal header
   - **Domain** — used for QR code URL generation
   - **Industry** — displayed in metadata
   - **Primary Color** — main brand colour (hex, applied to buttons, highlights)
   - **Secondary Color** — secondary accent (links, tags)
   - **Accent Color** — tertiary accent (badges, stars)
   - **Tagline** — displayed on the landing page
3. Click **Save Settings** — changes apply immediately (no rebuild required)

### CSS Variable Injection

The [brand.tsx](./src/components/brand.tsx) component reads company settings from the database and injects a `<style>` tag with CSS custom property overrides:

```css
:root {
  --color-brand: {company.primaryColor};
  --color-secondary: {company.secondaryColor};
  --color-accent: {company.accentColor};
}
```

All UI components reference `var(--color-brand)` so they automatically update.

---

## 12. Testing & Verification

### Manual Smoke Test Checklist

**Infrastructure**
- [ ] PostgreSQL server running on port 5432
- [ ] `app_db` database exists with UTF-8 encoding
- [ ] `.env` has valid `DATABASE_URL`
- [ ] `npm run dev-webpack` starts without errors

**All Routes Return 200**
Run the following PowerShell snippet:
```powershell
$pages = @('/', '/admin', '/admin/products', '/admin/qr', '/admin/qr/generate',
  '/admin/qr/design', '/admin/settings', '/admin/redemptions', '/admin/campaigns',
  '/admin/users', '/admin/rewards', '/admin/reports', '/admin/notifications',
  '/admin/catalogue', '/app', '/app/scan', '/app/rewards', '/app/wallet',
  '/app/history', '/app/notifications', '/app/profile', '/app/catalogue')
foreach ($p in $pages) {
  $r = Invoke-WebRequest -Uri "http://localhost:3000$p" -UseBasicParsing
  Write-Host "$($r.StatusCode) $p"
}
```

**Core Business Flows**
- [ ] **Seeding**: Visit `/admin` — dashboard shows stats (products, QR codes, users)
- [ ] **Create Product**: `/admin/products` → Add Product → fill form → verify in table
- [ ] **Generate QR**: `/admin/qr/generate` → Step 1 → select template → Step 2 → configure → Generate → Step 3 Download
- [ ] **Scan**: `/app/scan` → Start Scanning → success modal with product name and points
- [ ] **Redeem**: `/app/rewards` → select reward → confirm → see pending in `/admin/redemptions`
- [ ] **Approve Redemption**: `/admin/redemptions` → approve → verify status updated
- [ ] **Reset Demo**: Admin dashboard → Reset Demo button → all data clears and re-seeds

**TypeScript**
```powershell
npm run typecheck   # Should exit 0 with no errors
```

---

## 13. Maintenance & Operations

### Daily Operations

| Task | How |
|---|---|
| Check server health | `GET /admin` should return 200 |
| Review pending redemptions | `/admin/redemptions` — approve/reject daily |
| Monitor audit logs | Query `audit_logs` table for anomalies |
| Reset demo data | Dashboard → Reset Demo button |

### Database Maintenance

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('app_db'));

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Recent audit trail
SELECT actor, action, entity_type, entity_id, created_at
FROM audit_logs ORDER BY created_at DESC LIMIT 50;
```

### Adding a New Company (Multi-tenant)

1. Insert a new row into `companies` table
2. Update the `companyId()` helper in `actions.ts` to accept a company ID parameter (currently returns the first company)
3. Add auth middleware to scope requests to the correct company ID

### Upgrading PostgreSQL

1. Stop the old server: `postgres_ctl stop -D ./pgdata`
2. Backup: `pg_dump -U postgres app_db > backup.sql`
3. Extract new PostgreSQL binaries to `postgres_bin/`
4. Run `pg_upgrade` or restore from backup into a fresh cluster

### Schema Migrations

New columns/tables are added via `src/db/migrate.ts`. The `ensureSchema()` function uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` so it is safe to re-run on every startup.

To add a new column:
```typescript
// In src/db/migrate.ts, append:
await client.query(`
  ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg numeric(6,3);
`);
```

---

## 14. Known Issues & Troubleshooting

### Issue: `$.map is not a function` CSS error in browser

**Cause**: Tailwind CSS v4 + Next.js 16 Turbopack have a known integration bug where the PostCSS transform crashes in Turbopack's Node.js worker.

**Fix**: Use the webpack-based dev server:
```powershell
npm run dev-webpack
```

### Issue: `character ... has no equivalent in encoding "WIN1252"` (PostgreSQL error)

**Cause**: Database cluster was initialised with Windows locale `English_United States.1252` which cannot store Unicode emoji characters.

**Fix**: Delete the old cluster and reinitialise with UTF-8 and C locale:
```powershell
Remove-Item -Recurse -Force pgdata
postgres_bin/pgsql/bin/initdb.exe -D ./pgdata -U postgres --auth-host=trust --auth-local=trust -E UTF8 --locale=C
# Then restart postgres and createdb app_db
```

### Issue: `npm` command not found in PowerShell

**Cause**: PowerShell script execution policy may block `.cmd` resolution.

**Fix**: Use explicit invocation:
```powershell
npm.cmd run dev-webpack
npm.cmd install
```

### Issue: TypeScript errors from `postgres_bin` or `pgdata`

**Cause**: `tsconfig.json` `include: **/*.ts` picks up TypeScript files inside the extracted PostgreSQL binary directories.

**Fix** (already applied): `tsconfig.json` has `"exclude": ["node_modules", "postgres_bin", "pgdata"]`.

### Issue: Database connection `ECONNREFUSED`

**Cause**: PostgreSQL server is not running.

**Fix**: Start the server:
```powershell
postgres_bin/pgsql/bin/postgres.exe -D ./pgdata -p 5432
```

### Issue: Port 5432 already in use

**Fix**: Find and stop the conflicting process:
```powershell
netstat -ano | findstr :5432
Stop-Process -Id <PID>
```

---

*Documentation generated July 2026 · Enterprise QR Rewards Platform v2.0*
