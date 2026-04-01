# UniPOS — Universal Commerce Platform

A full-featured, multi-tenant SaaS point-of-sale platform designed for retail businesses, restaurants, and service providers. UniPOS handles the complete commerce lifecycle — from product catalog and inventory management through order processing, tax calculation, discount application, payment collection, and audit trail generation — all within a single, unified system.

Built as a modern monorepo with a decoupled backend API, a web-based admin dashboard, and a native desktop POS client for fast, reliable in-store operations.

---

## Features

### Multi-Tenant Architecture
- Complete tenant isolation with organization → tenant → branch hierarchy
- Per-branch configuration for taxes, inventory, discounts, and product availability
- Branch-scoped operations ensure data never leaks across tenants

### Product & Catalog Management
- Full product CRUD with SKU, barcode, and pricing
- Hierarchical category system for product organization
- Per-product tax group assignment for accurate tax computation
- Product status management (active/inactive/draft)

### Tax Engine
- **Tax Groups** — logical groupings of tax rates assignable to products
- **Tax Configs** — per-branch tax rate definitions with support for both inclusive and exclusive tax types
- **Inclusive tax back-calculation** — automatically computes base amount from tax-inclusive prices using the formula: `base = discounted_amount / (1 + sum_inclusive_rates)`
- Multiple tax rates can stack on a single product (e.g., GST + service tax)
- Tax snapshots preserved on every order line item for audit compliance

### Discount System
- **Discount Presets** — reusable discount templates (percentage or fixed amount)
- **Scope control** — discounts can target the entire order or individual line items
- **Branch assignment** — restrict discounts to specific branches or make them available globally
- **Combinability rules** — enforce whether discounts can stack with others at the same scope level
- **Validity windows** — time-bound discounts with automatic expiration (valid_from / valid_until)
- **Min order amount** and **max discount cap** constraints
- Discount snapshots preserved on orders for historical accuracy

### Inventory Management
- **Real-time stock tracking** with atomic balance updates using PostgreSQL upsert
- **Stock-in operations** — receive inventory with batch tracking (supplier, cost, reference, expiry)
- **Stock adjustments** — correct inventory with reason tracking (damaged, lost, correction, returned)
- **Inventory movements** — full audit trail of every stock change with movement type and quantity
- **Low stock detection** — configurable per-product thresholds with event-driven alerts
- **Branch-product configuration** — per-branch availability and low-stock threshold settings
- **Race-condition-safe** — `INSERT ... ON CONFLICT ... DO UPDATE ... WHERE qty + delta >= 0` prevents negative stock atomically
- **CHECK constraint** on `on_hand_qty >= 0` as database-level safety net

### Order Lifecycle
- **State machine** — `draft → completed → cancelled` with strict transition validation
- **Draft orders** — add/remove items, apply discounts, modify quantities before checkout
- **Order completion** — atomic checkout flow: calculate totals → record payments → deduct inventory → generate order number → transition state
- **Order cancellation** — with required reason tracking
- **Order number generation** — atomic sequence per branch per day (`MAIN-20260315-0001`) with no race conditions
- **17-step total calculation** — line subtotals → line discounts → discounted amounts → per-line tax resolution → inclusive tax back-calculation → tax amounts → line totals → order subtotal → order-level discounts → grand total

### Payment Processing
- **Multiple payment methods** — cash, card, digital wallet, bank transfer, and custom types
- **Split payments** — multiple payment entries per order (e.g., part cash + part card)
- **Cash tendered tracking** — records amount given and calculates change
- **Payment validation** — ensures total payments match order amount exactly before completing

### Checkout Orchestrator
- **Atomic transactions** — entire checkout (totals + payments + inventory + order number + state transition) wrapped in a single database transaction
- **Event buffer pattern** — domain events are collected during the transaction and emitted only after successful commit
- **Inventory deduction** — automatically deducts stock for all order items during checkout
- **Rollback safety** — if any step fails, the entire checkout rolls back cleanly

### Event-Driven Audit System
- **Domain events** — `OrderCompleted`, `OrderCancelled`, `PaymentRecorded`, `InventoryDeducted`, `LowStock`, `StockIn`
- **Audit log handler** — subscribes to all domain events and persists them with JSONB payload
- **Fail-silent logging** — audit failures never break business operations
- **Full traceability** — every significant action is recorded with tenant, branch, user, and timestamp context

### Authentication & Authorization
- JWT-based authentication with configurable expiration
- Bearer token authorization on all API endpoints
- Admin seed script for initial setup
- Per-request tenant and branch context extraction

---

## Tech Stack

### Backend — `apps/backend`
| Layer | Technology |
|-------|------------|
| Framework | NestJS 11 (Express) |
| Language | TypeScript 5.x (strict mode) |
| ORM | TypeORM 0.3.x |
| Database | PostgreSQL 15+ (Neon cloud compatible) |
| Authentication | JWT (`@nestjs/jwt`, `bcryptjs`) |
| Validation | `class-validator` + `class-transformer` |
| API Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Events | `@nestjs/event-emitter` (EventEmitter2) |
| Runtime | Node.js 20+ |

### Admin Dashboard — `apps/admin`
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Language | TypeScript |

### POS Client — `apps/pos`
| Layer | Technology |
|-------|------------|
| Framework | Electron 41 |
| Build Tool | Vite + Electron Forge |
| Language | TypeScript |
| Distribution | Windows (Squirrel), Linux (deb, rpm), zip |

### Infrastructure
| Concern | Technology |
|---------|------------|
| Monorepo | pnpm 10 workspaces |
| Database Hosting | Neon (serverless PostgreSQL) |
| Migrations | TypeORM CLI with manual partial indexes |
| SSL | Auto-detected from connection string |

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10
- **PostgreSQL** 15+ (local or [Neon](https://neon.tech) cloud)

---

## Getting Started

```bash
# 1. Clone and install dependencies
git clone <repo-url> uni-pos
cd uni-pos
pnpm install

# 2. Configure environment
cp apps/backend/.env.example apps/backend/.env.local
# Edit .env.local — set DATABASE_URL, JWT_SECRET, admin credentials

# 3. Run database migrations
cd apps/backend
npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts

# 4. Seed the admin user
npx ts-node src/database/seeds/seed-admin.ts

# 5. (Optional) Seed full demo data
npx ts-node src/database/seeds/seed-demo.ts

# 6. Start the backend
cd ../..
pnpm dev:backend
```

## Seeded Dummy Credentials & Demo Data

The backend includes two seed scripts:

- `src/database/seeds/seed-admin.ts` (initial admin/bootstrap seed)
- `src/database/seeds/seed-demo.ts` (full multi-branch demo organization)

### Dummy Credentials (from seed files)

#### From `seed-admin.ts` — configured via `.env.local`

| Account | Email | Password |
|---------|-------|----------|
| Platform Admin | `admin@unipos.com` | `PlatformAdmin123!` |
| Demo Tenant Owner | `owner@example.com` | `ChangeThisPassword123` |

- Demo Tenant: `Demo Tenant` (slug: `demo-tenant`)
- Demo Branch: `Main Branch` (code: `MAIN`)

#### From `seed-demo.ts` — all accounts use password: `demo1234`

| Role | Email | Branch |
|------|-------|--------|
| Owner | `owner@unimart.demo` | HQ Flagship |
| Senior Manager | `sr.manager.dhaka@unimart.demo` | HQ Flagship |
| Senior Manager | `sr.manager.ctg@unimart.demo` | Agrabad |
| Senior Manager | `sr.manager.sylhet@unimart.demo` | Zindabazar |
| Manager | `manager.dhkhq@unimart.demo` | HQ Flagship |
| Manager | `manager.dhkban@unimart.demo` | Banani |
| Manager | `manager.dhkutt@unimart.demo` | Uttara |
| Manager | `manager.ctgagr@unimart.demo` | Agrabad |
| Manager | `manager.ctgnas@unimart.demo` | Nasirabad |
| Manager | `manager.sylzin@unimart.demo` | Zindabazar |
| Cashier | `cashier1.dhkhq@unimart.demo` | HQ Flagship |
| Cashier | `cashier2.dhkhq@unimart.demo` | HQ Flagship |
| Cashier | `cashier1.dhkban@unimart.demo` | Banani |
| Cashier | `cashier2.dhkban@unimart.demo` | Banani |
| Cashier | `cashier1.dhkutt@unimart.demo` | Uttara |
| Cashier | `cashier2.dhkutt@unimart.demo` | Uttara |
| Cashier | `cashier1.ctgagr@unimart.demo` | Agrabad |
| Cashier | `cashier2.ctgagr@unimart.demo` | Agrabad |
| Cashier | `cashier1.ctgnas@unimart.demo` | Nasirabad |
| Cashier | `cashier2.ctgnas@unimart.demo` | Nasirabad |
| Cashier | `cashier1.sylzin@unimart.demo` | Zindabazar |
| Cashier | `cashier2.sylzin@unimart.demo` | Zindabazar |
| Senior Staff | `sr.staff.dhkhq@unimart.demo` | HQ Flagship |
| Senior Staff | `sr.staff.dhkban@unimart.demo` | Banani |
| Senior Staff | `sr.staff.dhkutt@unimart.demo` | Uttara |
| Senior Staff | `sr.staff.ctgagr@unimart.demo` | Agrabad |
| Senior Staff | `sr.staff.ctgnas@unimart.demo` | Nasirabad |
| Senior Staff | `sr.staff.sylzin@unimart.demo` | Zindabazar |
| Staff | `staff.dhkhq@unimart.demo` | HQ Flagship |
| Staff | `staff.dhkban@unimart.demo` | Banani |
| Staff | `staff.dhkutt@unimart.demo` | Uttara |
| Staff | `staff.ctgagr@unimart.demo` | Agrabad |
| Staff | `staff.ctgnas@unimart.demo` | Nasirabad |
| Staff | `staff.sylzin@unimart.demo` | Zindabazar |

### Seeded Dummy Data (from seed files)

#### `seed-admin.ts`
- Ensures all RBAC permissions listed in the script (`ALL_PERMISSIONS`)
- Creates a platform admin user (if missing)
- Creates demo tenant (default: `Demo Tenant`, slug `demo-tenant`)
- Creates demo branch (default: `Main Branch`, code `MAIN`)
- Creates 6 system roles:
	- `owner`, `senior_manager`, `manager`, `cashier`, `senior_staff`, `staff`
- Assigns role-permission mappings
- Creates owner user for the demo tenant (if missing)

#### `seed-demo.ts`
- Tenant:
	- `UniMart Holdings` (slug: `unimart-holdings`)
- Branch groups (3):
	- `Dhaka Division`, `Chittagong Division`, `Sylhet Division`
- Branches (6):
	- `HQ Flagship Store` (`DHK-HQ`)
	- `Banani Outlet` (`DHK-BAN`)
	- `Uttara Outlet` (`DHK-UTT`)
	- `Agrabad Store` (`CTG-AGR`)
	- `Nasirabad Store` (`CTG-NAS`)
	- `Zindabazar Store` (`SYL-ZIN`)
- Users (34 total):
	- 1 owner
	- 3 senior managers
	- 6 managers
	- 12 cashiers
	- 6 senior staff
	- 6 staff
- Categories (8):
	- Beverages
	- Snacks & Confectionery
	- Dairy & Eggs
	- Bakery
	- Personal Care
	- Household
	- Frozen Foods
	- Stationery
- Products:
	- 60 demo products with SKU, barcode, price, cost, emoji, and category

> Note: Both seed scripts are idempotent (safe to re-run).

## Development

```bash
# Backend API — http://localhost:3000
pnpm dev:backend

# Admin dashboard — http://localhost:3001
pnpm dev:admin

# POS desktop app
pnpm dev:pos

# Build all apps
pnpm build

# Lint all apps
pnpm lint
```

---

## API Reference

Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <token>` (except login).

### Endpoints Overview

| Module | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| **Auth** | POST | `/auth/login` | Authenticate and receive JWT |
| **Products** | GET | `/products` | List products (filterable by category, status) |
| | POST | `/products` | Create a new product |
| | PATCH | `/products/:id` | Update product details |
| | DELETE | `/products/:id` | Archive a product |
| **Categories** | GET | `/categories` | List categories |
| | POST | `/categories` | Create a category |
| | PATCH | `/categories/:id` | Update a category |
| | DELETE | `/categories/:id` | Archive a category |
| **Tax Groups** | GET | `/tax-groups` | List tax groups |
| | POST | `/tax-groups` | Create a tax group |
| | PATCH | `/tax-groups/:id` | Update a tax group |
| | DELETE | `/tax-groups/:id` | Archive a tax group |
| **Tax Configs** | GET | `/tax-configs?branch_id=` | List tax configs for a branch |
| | POST | `/tax-configs` | Create a tax config |
| | PATCH | `/tax-configs/:id` | Update a tax config |
| | DELETE | `/tax-configs/:id` | Archive a tax config |
| **Discounts** | GET | `/discount-presets` | List discount presets |
| | POST | `/discount-presets` | Create a discount preset |
| | PATCH | `/discount-presets/:id` | Update a discount preset |
| | DELETE | `/discount-presets/:id` | Archive a discount preset |
| | PUT | `/discount-presets/:id/branches` | Assign branches to a preset |
| **Inventory** | GET | `/inventory/balances` | List stock balances |
| | GET | `/inventory/movements` | List inventory movements |
| | POST | `/inventory/stock-in` | Record stock receipt |
| | POST | `/inventory/adjustments` | Record stock adjustment |
| | PATCH | `/inventory/config/:productId` | Update branch-product config |
| **Orders** | GET | `/orders` | List orders (filterable by status, date) |
| | GET | `/orders/:id` | Get order with items, taxes, discounts |
| | POST | `/orders` | Create a draft order |
| | POST | `/orders/:id/items` | Add item to draft order |
| | PATCH | `/orders/:id/items/:itemId` | Update order item quantity |
| | DELETE | `/orders/:id/items/:itemId` | Remove item from draft order |
| | POST | `/orders/:id/discounts` | Apply discount to order |
| | DELETE | `/orders/:id/discounts/:discountId` | Remove discount from order |
| **Checkout** | POST | `/orders/:id/complete` | Complete order (atomic checkout) |
| | POST | `/orders/:id/cancel` | Cancel order with reason |
| **Payments** | GET | `/payments` | List payments for an order |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (pooled/Neon) |
| `DATABASE_URL_DIRECT` | No | — | Direct connection string (for migrations) |
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `1d` | JWT token expiration duration |
| `PORT` | No | `3000` | API server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `ADMIN_EMAIL` | Yes* | — | Initial admin user email (*required for seeding) |
| `ADMIN_PASSWORD` | Yes* | — | Initial admin user password (*required for seeding) |
| `ADMIN_FULL_NAME` | Yes* | — | Initial admin user display name |
| `ADMIN_ORGANIZATION_NAME` | Yes* | — | Organization name for seed data |
| `ADMIN_TENANT_NAME` | Yes* | — | Tenant name for seed data |
| `ADMIN_TENANT_SLUG` | Yes* | — | Tenant slug for seed data |
| `ADMIN_BRANCH_NAME` | Yes* | — | Default branch name |
| `ADMIN_BRANCH_CODE` | Yes* | — | Default branch code (used in order numbers) |

---

## Project Structure

```
uni-pos/
├── apps/
│   ├── backend/                    # NestJS REST API
│   │   ├── src/
│   │   │   ├── auth/               # JWT login, guards, decorators
│   │   │   ├── audit/              # Event-driven audit log persistence
│   │   │   ├── categories/         # Product category CRUD
│   │   │   ├── checkout/           # Atomic checkout orchestrator
│   │   │   ├── common/
│   │   │   │   ├── events/         # Domain event classes (6 event types)
│   │   │   │   └── transformers/   # Decimal transformer for numeric columns
│   │   │   ├── database/
│   │   │   │   ├── entities/       # Org, Tenant, Branch core entities
│   │   │   │   ├── migrations/     # TypeORM migrations (4 migration files)
│   │   │   │   └── seeds/          # Admin user + org seeding script
│   │   │   ├── discounts/          # Discount presets, branch assignment, combinability
│   │   │   ├── inventory/          # Stock-in, adjustments, balances, movements, batches
│   │   │   ├── orders/             # Order CRUD, items, taxes, discounts, number sequences
│   │   │   ├── payments/           # Payment recording and validation
│   │   │   ├── products/           # Product catalog with tax group linkage
│   │   │   ├── tax/                # Tax groups, tax configs, rate resolution
│   │   │   └── users/              # User entity and service
│   │   ├── test/                   # E2E test setup
│   │   ├── .env.example            # Environment template
│   │   └── package.json
│   ├── admin/                      # Next.js admin dashboard
│   │   ├── src/
│   │   ├── .env.example
│   │   └── package.json
│   └── pos/                        # Electron POS desktop client
│       ├── src/
│       └── package.json
├── .gitignore
├── package.json                    # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

---

## Database Schema

The backend uses **4 migration files** creating the following table groups:

| Migration | Tables Created |
|-----------|---------------|
| `InitSchema` | organizations, tenants, branches, users, categories, products |
| `AddTaxAndDiscounts` | tax_groups, tax_configs, discount_presets, discount_preset_branches |
| `AddInventory` | inventory_batches, inventory_movements, inventory_balances, branch_product_configs |
| `AddOrdersAndPayments` | orders, order_items, order_item_taxes, order_discounts, order_number_sequences, payments |
| `AddAuditLogs` | audit_logs (with GIN index on JSONB payload) |

Key design decisions:
- All financial columns use `numeric(12,2)` with decimal transformer
- Immutable entities (movements, batches, item taxes) have no `updated_at`
- Partial indexes on status columns for query performance
- CHECK constraint on `inventory_balances.on_hand_qty >= 0`
- All FK relationships use `onDelete: 'RESTRICT'` for financial data integrity

---

## License

Proprietary — All rights reserved.
