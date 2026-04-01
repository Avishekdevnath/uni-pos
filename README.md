# UniPOS — Universal Commerce Platform

A full-featured, multi-tenant SaaS point-of-sale platform designed for retail businesses, restaurants, and service providers. UniPOS handles the complete commerce lifecycle — from product catalog and inventory management through order processing, tax calculation, discount application, payment collection, and audit trail generation — all within a single, unified system.

Built as a modern monorepo with a decoupled backend API, a web-based admin dashboard, and a native desktop POS client for fast, reliable in-store operations.

---

## Features

### Multi-Tenant Architecture
- Complete tenant isolation with tenant → branch hierarchy
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

### Authentication & Authorization (RBAC)
- JWT-based authentication with configurable expiration
- Bearer token authorization on all API endpoints
- **Role-Based Access Control** — 43 granular permissions across 12 resources (`pos`, `orders`, `products`, `inventory`, `staff`, `roles`, etc.)
- **6 built-in roles** — `owner`, `senior_manager`, `manager`, `cashier`, `senior_staff`, `staff` — each with a curated permission set
- **Roles & Permissions UI** — owners and senior managers can assign/revoke permissions per role from the admin dashboard without touching the database
- **5-minute permission cache** — role permission lookups are cached in-memory with automatic invalidation on changes
- Platform admin module with tenant impersonation support

### Additional Modules
- **Customers** — customer profiles with notes
- **Reports** — revenue summaries, payment method breakdowns, top products, hourly sales
- **Receipts** — token-based shareable receipt URLs with printable HTML rendering
- **Transfers** — inter-branch stock transfer workflows
- **Pricing** — branch-level product price overrides
- **Branch Groups** — hierarchical branch group management (e.g., by region)
- **Settings** — per-tenant and per-branch configuration (currency, receipt config, payment methods)
- **Stats** — dashboard KPI endpoint (revenue, order count, AOV)

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
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui |
| Data Fetching | TanStack Query v5 |
| Language | TypeScript |

### POS Client — `apps/pos`
| Layer | Technology |
|-------|------------|
| Framework | Electron |
| Build Tool | Vite + Electron Forge |
| UI Library | React 19 |
| Language | TypeScript |
| Distribution | Windows (Squirrel), Linux (deb, rpm), zip |

### Infrastructure
| Concern | Technology |
|---------|------------|
| Monorepo | pnpm 10 workspaces |
| Database Hosting | Neon (serverless PostgreSQL) |
| Migrations | TypeORM CLI |
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

# 2. Configure backend environment
cp apps/backend/.env.example apps/backend/.env.local
# Edit .env.local — set DATABASE_URL, JWT_SECRET, PORT, and admin credentials

# 3. Configure admin dashboard environment
cp apps/admin/.env.example apps/admin/.env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:<PORT>/api/v1

# 4. Run database migrations
cd apps/backend
npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts

# 5. Seed the admin user and RBAC permissions
npx ts-node src/database/seeds/seed-admin.ts

# 6. (Optional) Seed full demo data
npx ts-node src/database/seeds/seed-demo.ts

# 7. Start the backend
cd ../..
pnpm dev:backend
```

---

## Development

```bash
# Backend API — http://localhost:8000  (default PORT in .env.local)
pnpm dev:backend

# Admin dashboard — http://localhost:3000
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

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <token>` (except login and public receipt HTML).

### Endpoints Overview

| Module | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| **Auth** | POST | `/auth/login` | Authenticate and receive JWT |
| | GET | `/auth/me` | Get current user with permissions |
| | PATCH | `/auth/password` | Change current user password |
| **Roles** | GET | `/roles` | List tenant roles with permission counts |
| | GET | `/roles/permissions` | List all available permissions |
| | GET | `/roles/:id/permissions` | Get permissions assigned to a role |
| | PUT | `/roles/:id/permissions` | Replace all permissions for a role |
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
| **Customers** | GET | `/customers` | List customers |
| | GET | `/customers/:id` | Get customer detail |
| | POST | `/customers` | Create customer |
| | PATCH | `/customers/:id` | Update customer |
| | POST | `/customers/:id/notes` | Add note to customer |
| | GET | `/customers/:id/notes` | Get customer notes |
| **Reports** | GET | `/reports/summary` | Revenue & order summary |
| | GET | `/reports/revenue` | Revenue over time |
| | GET | `/reports/payment-methods` | Payment method breakdown |
| | GET | `/reports/top-products` | Top-selling products |
| | GET | `/reports/hourly` | Hourly sales distribution |
| **Receipts** | GET | `/receipts/:token` | Get receipt data by token |
| | GET | `/receipts/html/:token` | Printable HTML receipt (public, no auth) |
| **Pricing** | GET | `/branches/:id/pricing` | Get branch price overrides |
| | PUT | `/branches/:id/pricing` | Set branch price overrides |
| | DELETE | `/branches/:id/pricing/:productId` | Remove price override |
| **Branches** | GET | `/branches` | List tenant branches |
| | PATCH | `/branches/:id/settings` | Update branch settings |
| **Branch Groups** | GET | `/branch-groups` | List branch groups |
| | GET | `/branch-groups/:id` | Get branch group with members |
| | POST | `/branch-groups` | Create branch group |
| | PATCH | `/branch-groups/:id` | Update branch group |
| | DELETE | `/branch-groups/:id` | Delete branch group |
| | POST | `/branch-groups/:id/members` | Add branch to group |
| | DELETE | `/branch-groups/:id/members/:branchId` | Remove branch from group |
| **Stats** | GET | `/stats/dashboard` | Dashboard KPIs |
| **Audit Logs** | GET | `/audit-logs` | List audit log entries |
| **Platform** | POST | `/platform/auth/login` | Platform admin login |
| | GET | `/platform/auth/me` | Platform admin profile |
| | GET | `/platform/tenants` | List all tenants |
| | GET | `/platform/tenants/:id` | Get tenant detail |
| | POST | `/platform/tenants` | Create tenant |
| | PATCH | `/platform/tenants/:id` | Update tenant |
| | POST | `/platform/tenants/:id/impersonate` | Impersonate tenant user |

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

> The default `PORT` is `3000` but the local development environment uses `PORT=8000`. Update `apps/admin/.env.local` → `NEXT_PUBLIC_API_BASE_URL` to match.

---

## Seeded Dummy Credentials & Demo Data

The backend includes two seed scripts:

- `src/database/seeds/seed-admin.ts` — bootstrap seed (permissions, roles, platform admin, demo tenant)
- `src/database/seeds/seed-demo.ts` — full multi-branch demo organization

Both scripts are **idempotent** (safe to re-run).

### Dummy Credentials

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

---

## Project Structure

```
uni-pos/
├── apps/
│   ├── backend/                    # NestJS REST API
│   │   ├── src/
│   │   │   ├── auth/               # JWT login, guards, tenant bootstrap
│   │   │   ├── audit/              # Event-driven audit log persistence
│   │   │   ├── branch-groups/      # Branch group hierarchy
│   │   │   ├── branches/           # Branch management and settings
│   │   │   ├── categories/         # Product category CRUD
│   │   │   ├── checkout/           # Atomic checkout orchestrator
│   │   │   ├── cloudinary/         # Image upload integration
│   │   │   ├── common/
│   │   │   │   ├── events/         # Domain event classes
│   │   │   │   └── transformers/   # Decimal transformer for numeric columns
│   │   │   ├── customers/          # Customer profiles and notes
│   │   │   ├── database/
│   │   │   │   ├── entities/       # Tenant, Branch core entities
│   │   │   │   ├── migrations/     # TypeORM migrations
│   │   │   │   └── seeds/          # seed-admin.ts, seed-demo.ts
│   │   │   ├── discounts/          # Discount presets, branch assignment
│   │   │   ├── health/             # Health check endpoint
│   │   │   ├── inventory/          # Stock-in, adjustments, balances, movements
│   │   │   ├── orders/             # Order CRUD, items, taxes, discounts
│   │   │   ├── payments/           # Payment recording and validation
│   │   │   ├── platform/           # Platform admin auth and tenant management
│   │   │   ├── pricing/            # Branch-level price overrides
│   │   │   ├── products/           # Product catalog
│   │   │   ├── rbac/               # Roles, permissions, guards, RolesController
│   │   │   ├── receipts/           # Token-based receipt URLs + HTML rendering
│   │   │   ├── reports/            # Revenue, top products, hourly sales
│   │   │   ├── settings/           # Tenant and branch settings
│   │   │   ├── stats/              # Dashboard KPI aggregation
│   │   │   ├── tax/                # Tax groups, configs, rate resolution
│   │   │   ├── transfers/          # Inter-branch stock transfers
│   │   │   └── users/              # User entity and service
│   │   ├── .env.example
│   │   └── package.json
│   ├── admin/                      # Next.js admin dashboard
│   │   ├── src/
│   │   │   ├── app/(dashboard)/    # Route pages (products, orders, roles, etc.)
│   │   │   ├── components/
│   │   │   │   ├── features/       # Feature-specific components
│   │   │   │   ├── layout/         # AppShell, AppSidebar
│   │   │   │   ├── shared/         # PageHeader, DataTable, StatusBadge, etc.
│   │   │   │   └── ui/             # shadcn/ui primitives
│   │   │   ├── hooks/              # useAuth, useBranch, useDebounce
│   │   │   ├── lib/                # api.ts, query-client.ts, utils.ts
│   │   │   ├── providers/          # AuthProvider, QueryProvider, BranchProvider
│   │   │   └── types/              # TypeScript types per domain
│   │   ├── .env.example
│   │   └── package.json
│   └── pos/                        # Electron POS desktop client
│       ├── src/
│       └── package.json
├── package.json                    # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

---

## Database Schema

| Migration | Purpose |
|-----------|---------|
| `InitSchema` | Core tables: tenants, branches, users, roles, permissions, role_permissions, products, categories, tax, discounts, inventory, orders, payments, audit_logs |
| `AddTenantSettings` | Tenant and branch settings tables |
| `AddCustomers` | Customer profiles and notes |
| `UpdateOrderItemsNullableProduct` | Allow nullable product FK on order items |
| `AddBranchSettings` | Per-branch configuration columns |
| `AddReportsPermissions` | Reports-scoped RBAC permissions |
| `AddProductIconAndOrderCurrency` | Product icon field, order currency snapshot |

Key design decisions:
- All financial columns use `numeric(12,2)` with decimal transformer
- Immutable entities (movements, batches, item taxes) have no `updated_at`
- Partial indexes on status columns for query performance
- CHECK constraint on `inventory_balances.on_hand_qty >= 0`
- All FK relationships use `onDelete: 'RESTRICT'` for financial data integrity

---

## License

Proprietary — All rights reserved.
