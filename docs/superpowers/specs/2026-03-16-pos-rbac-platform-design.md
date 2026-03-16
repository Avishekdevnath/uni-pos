# POS Terminal, RBAC, & Platform Admin — Design Spec

**Date:** 2026-03-16
**Status:** Draft
**Scope:** Phase 1 — Online POS, database RBAC, platform admin, self-service signup, Tier 3 chain support

---

## 1. Overview

Transform uni-pos from a single-tenant admin back-office into a multi-tenant SaaS POS platform with:

1. **Database-driven RBAC** — roles and permissions stored in DB, customizable per tenant
2. **Platform Admin system** — separate auth, tenant management, impersonation
3. **Self-service business signup** — owners register and start immediately
4. **POS Terminal app** — `apps/pos`, cashier-facing, touch-first, single-page checkout
5. **Receipt system** — ESC/POS thermal printing (WebUSB) + browser fallback + WhatsApp sharing
6. **Tier 3 chain support** — branch groups, regional pricing, branch-level access control
7. **Database reset** — drop all tables/migrations, redesign schema from scratch

### Target Market Tiers

| Tier | Scale | Phase 1 Support |
|------|-------|-----------------|
| **Tier 1** | Small shop (1-5 branches) | Fully supported |
| **Tier 2** | Medium chain (5-50 branches) | Fully supported (branch access control) |
| **Tier 3** | Large chain (50-500 branches) | Schema ready; branch groups, regional pricing, access control built. Inter-branch transfer, POs, bulk ops deferred to Phase 3 |
| **Tier 4** | Enterprise (500+) | Not our market (SAP/Oracle territory) |

### Phase 1 vs Phase 2

| Phase 1 (this sprint) | Phase 2 (later) | Phase 3 (Tier 3 chains) |
|---|---|---|
| Online POS | Offline POS (IndexedDB + sync) | Purchase orders + GRN |
| Cash payment only | Card payment | Inter-branch stock transfer |
| ESC/POS USB + browser print | Bluetooth printing | Bulk operations (batch product/branch) |
| WhatsApp receipt sharing | SMS sharing | Regional reports & analytics |
| Anonymous sales | Customer membership + loyalty points | Shift management & cash reconciliation |
| Tenant list + impersonate | Growth metrics, announcements | Refund/return flow |
| Manual password sharing | Email service for invites | |
| Hardcoded receipt footer | Custom receipt templates | |
| Branch groups + regional pricing | | |
| Branch-level access control | | |

---

## 2. Database Schema Changes

### 2.1 Full Database Reset

- Drop all existing tables and migrations
- Delete all migration files in `apps/backend/src/database/migrations/`
- Redesign entities with new RBAC system
- Generate fresh migrations
- New seed script (idempotent — safe to run multiple times):
  1. Seed all permissions (upsert by code)
  2. Create platform admin from env vars (bcrypt hash, cost factor 10, skip if exists)
  3. Create demo tenant + branch
  4. Create 6 default roles + assign permissions for demo tenant
  5. Create demo owner user assigned to owner role

### 2.2 Existing Tables (retained with modifications noted in 2.4)

These tables survive the reset with the same schema:

| Table | Key Columns |
|-------|-------------|
| `tenants` | id, name, slug (unique), default_currency, default_timezone, industry_type, status — **`organizations` table merged into `tenants`; `organization_id` FK removed; `industry_type` moved here** |
| `branches` | id, tenant_id, name, code, address, phone, status |
| `products` | id, tenant_id, category_id, tax_group_id, name, sku, **barcode** (varchar 128, unique, nullable), unit, price, cost, status |
| `categories` | id, tenant_id, parent_id, name, status |
| `tax_groups` | id, tenant_id, name, status |
| `tax_configs` | id, tenant_id, branch_id, tax_group_id, name, rate, is_inclusive, sort_order, status |
| `discount_presets` | id, tenant_id, name, type (`percentage`/`fixed`), value, scope (`order`/`item`), max_discount_amount, min_order_amount, valid_from, valid_until, is_combinable, status |
| `discount_preset_branches` | id, discount_preset_id, branch_id |
| `orders` | id, tenant_id, branch_id, customer_id, order_number, status (`draft`/`completed`/`cancelled`), subtotal_amount, discount_amount, tax_amount, total_amount, paid_amount, notes, client_event_id, completed_at, cancelled_at, cancelled_by, cancellation_reason |
| `order_items` | id, order_id, product_id, quantity, unit_price, line_subtotal, line_discount_amount, order_discount_share, discounted_amount, base_amount, tax_amount, line_total, product_name_snapshot, sku_snapshot |
| `order_discounts` | id, order_id, discount_preset_id, computed_amount, preset_name_snapshot, type_snapshot, value_snapshot, scope_snapshot |
| `order_item_taxes` | id, order_item_id, tax_config_id, tax_name_snapshot, tax_rate_snapshot, is_inclusive, tax_amount |
| `payments` | id, order_id, tenant_id, branch_id, method, amount, cash_tendered, status, client_event_id, received_at |
| `inventory_batches` | id, tenant_id, branch_id, type, description, status, created_by |
| `inventory_movements` | id, tenant_id, branch_id, product_id, movement_type, quantity, unit_cost, order_id, batch_id, client_event_id, note |
| `inventory_balances` | id, tenant_id, branch_id, product_id, on_hand_qty |
| `branch_product_configs` | id, tenant_id, branch_id, product_id, low_stock_threshold, is_available |
| `order_number_sequences` | id, branch_id, sequence_date, last_sequence |
| `audit_logs` | id, tenant_id, branch_id, actor_id, event_type, entity_type, entity_id, payload (jsonb), occurred_at |
| `users` | id, tenant_id, default_branch_id, full_name, email (**globally UNIQUE — changed from per-tenant unique, see 2.4**), phone (varchar 32, nullable — **new column, see 2.4**), password_hash, status (**role column removed — see 2.4**) |

**Note:** `products.barcode` already exists in the schema. POS scanning matches against this field.

### 2.3 New Tables

#### `platform_admins`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| email | varchar(255) | UNIQUE, NOT NULL |
| password_hash | varchar(255) | NOT NULL |
| full_name | varchar(255) | NOT NULL |
| status | varchar(32) | DEFAULT 'active' |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

Separate from `users`. No `tenant_id`. Created only via seed script (env vars). No self-registration.

#### `permissions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| code | varchar(100) | UNIQUE, NOT NULL |
| resource | varchar(50) | NOT NULL |
| action | varchar(50) | NOT NULL |
| description | varchar(255) | |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

Seeded once. Static. Contains all possible permissions in the system. Timestamps for operational debugging ("when was this permission added?").

**Full permissions list:**

| Code | Resource | Action | Description |
|------|----------|--------|-------------|
| products:create | products | create | Create products |
| products:read | products | read | View products |
| products:update | products | update | Edit products |
| products:delete | products | delete | Archive products |
| categories:create | categories | create | Create categories |
| categories:read | categories | read | View categories |
| categories:update | categories | update | Edit categories |
| categories:delete | categories | delete | Archive categories |
| tax:create | tax | create | Create tax groups/configs |
| tax:read | tax | read | View tax configuration |
| tax:update | tax | update | Edit tax configuration |
| tax:delete | tax | delete | Archive tax configuration |
| discounts:create | discounts | create | Create discount presets |
| discounts:read | discounts | read | View discounts |
| discounts:update | discounts | update | Edit discounts |
| discounts:delete | discounts | delete | Archive discounts |
| discounts:apply | discounts | apply | Apply discounts at POS |
| inventory:read | inventory | read | View stock balances |
| inventory:receive | inventory | receive | Stock-in operations |
| inventory:adjust | inventory | adjust | Stock adjustments |
| orders:create | orders | create | Create orders (POS checkout) |
| orders:read | orders | read | View all orders |
| orders:cancel | orders | cancel | Cancel/void orders |
| pos:sell | pos | sell | Access POS terminal |
| pos:void | pos | void | Void a sale in progress |
| pos:open_drawer | pos | open_drawer | Open cash drawer |
| staff:create | staff | create | Add staff members |
| staff:read | staff | read | View staff list |
| staff:update | staff | update | Edit staff details |
| staff:delete | staff | delete | Remove staff |
| staff:assign_role | staff | assign_role | Assign roles to staff (owner only) |
| settings:read | settings | read | View business settings |
| settings:update | settings | update | Change business settings |
| branches:create | branches | create | Add branches |
| branches:read | branches | read | View branches |
| branches:update | branches | update | Edit branches |
| audit:read | audit | read | View audit logs |
| reports:read | reports | read | View reports/dashboard |
| branch_groups:create | branch_groups | create | Create branch groups/regions |
| branch_groups:read | branch_groups | read | View branch groups |
| branch_groups:update | branch_groups | update | Edit branch groups |
| branch_groups:delete | branch_groups | delete | Delete branch groups |
| pricing:read | pricing | read | View branch-specific pricing |
| pricing:update | pricing | update | Set branch-specific prices |
| transfers:create | transfers | create | Initiate stock transfers (Phase 3) |
| transfers:read | transfers | read | View stock transfers (Phase 3) |
| transfers:receive | transfers | receive | Receive stock transfers (Phase 3) |

#### `roles`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants, NOT NULL |
| name | varchar(100) | NOT NULL |
| slug | varchar(50) | NOT NULL |
| is_system | boolean | DEFAULT true |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

- UNIQUE constraint on (tenant_id, slug)
- `is_system = true` → can't delete or rename (default roles)
- Business owners can create custom roles with `is_system = false`

#### `role_permissions`

| Column | Type | Constraints |
|--------|------|-------------|
| role_id | uuid | FK → roles, NOT NULL |
| permission_id | uuid | FK → permissions, NOT NULL |
| created_at | timestamp | auto |

- Composite PK on (role_id, permission_id)
- CASCADE delete on role deletion
- `created_at` for audit: "when was this permission granted to this role?"

#### `receipt_tokens`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| order_id | uuid | FK → orders, UNIQUE |
| tenant_id | uuid | FK → tenants |
| token | varchar(16) | UNIQUE, indexed |
| expires_at | timestamp | DEFAULT now() + 2 years |
| created_at | timestamp | auto |

- Token generated via nanoid(12), URL-safe. On collision (UNIQUE violation), retry once with new nanoid.
- Retention: 2 years from creation. `expires_at` column set on creation. Expired tokens return 404 on public endpoint. Cleanup via scheduled job (Phase 2) or manual DB query.
- One token per order (UNIQUE on order_id)
- **Indexes:** UNIQUE on `token` (primary lookup), UNIQUE on `order_id` (checkout response), index on `tenant_id` (tenant-scoped cleanup queries)

#### `user_branches` (branch-level access control)

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | FK → users, NOT NULL |
| branch_id | uuid | FK → branches, NOT NULL |
| created_at | timestamp | auto |

- Composite PK on (user_id, branch_id)
- CASCADE delete on user or branch deletion
- `created_at` for audit: "when was this user given access to this branch?"
- **Indexes:** Composite PK covers (user_id, branch_id) lookups. Add index on `branch_id` alone for reverse lookups ("which users have access to this branch?")
- **Access rules:**
  - No entries for a user → user can access ALL branches (owner/sr.manager — backward compatible)
  - Has entries → user can ONLY access those branches
  - POS selling is always locked to `default_branch_id` regardless of user_branches
  - Admin UI branch selector only shows accessible branches
  - Services filter queries by accessible branches for data modification
  - Read-only access to all branches for inventory visibility (a manager can SEE other branch stock but not modify it)

#### `branch_groups` (Tier 3: regional hierarchy)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants, NOT NULL |
| name | varchar(255) | NOT NULL |
| parent_id | uuid | FK → branch_groups, nullable |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

- UNIQUE constraint on (tenant_id, name)
- `parent_id` enables hierarchy: Region → Zone → Area
- **Index:** on `parent_id` for tree traversal queries; on `tenant_id` for tenant-scoped listing
- Maximum depth: 3 levels (enforced at service layer). Service rejects `parent_id` that would exceed depth 3. Prevents infinite recursion.
- Example: "Dhaka North" (region) → "Gulshan Area" (zone) → branches within

#### `branch_group_members`

| Column | Type | Constraints |
|--------|------|-------------|
| branch_group_id | uuid | FK → branch_groups, NOT NULL |
| branch_id | uuid | FK → branches, NOT NULL |

- Composite PK on (branch_group_id, branch_id)
- A branch can belong to multiple groups (e.g., "Dhaka North" AND "Premium Stores")
- CASCADE delete on branch or group deletion

#### `branch_product_prices` (Tier 3: regional pricing)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants, NOT NULL |
| branch_id | uuid | FK → branches, NOT NULL |
| product_id | uuid | FK → products, NOT NULL |
| price | numeric(12,2) | NOT NULL |
| cost | numeric(12,2) | nullable |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

- Uses `numeric(12,2)` matching `products.price`/`products.cost` precision — no rounding mismatches on LEFT JOIN
- UNIQUE constraint on (branch_id, product_id) — also serves as index
- **Indexes:** on `tenant_id` for tenant-scoped listing ("list all branch prices for this tenant")
- **ON DELETE:** CASCADE on both `branch_id` and `product_id` FKs — deleting a branch or product removes its price overrides
- Overrides `products.price` for a specific branch
- If no entry exists → fall back to `products.price` (tenant default)
- `cost` override is optional — falls back to `products.cost`

**POS pricing resolution:**
```
1. SELECT price FROM branch_product_prices WHERE branch_id = :bid AND product_id = :pid
2. If found → use branch-specific price
3. If not found → use products.price (tenant default)
```

This is a single query with LEFT JOIN — no performance impact.

#### `stock_transfers` (schema only — built in Phase 3)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants, NOT NULL |
| transfer_number | varchar(50) | UNIQUE |
| from_branch_id | uuid | FK → branches, NOT NULL |
| to_branch_id | uuid | FK → branches, NOT NULL |
| status | varchar(32) | DEFAULT 'draft' |
| initiated_by | uuid | FK → users |
| received_by | uuid | FK → users, nullable |
| notes | text | nullable |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |
| completed_at | timestamp | nullable |

- Status: `draft` → `in_transit` → `received` | `cancelled`. `updated_at` tracks last status change.
- **Not built in Phase 1** — table created in migration but no controller/service/UI

#### `stock_transfer_items` (schema only — built in Phase 3)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| transfer_id | uuid | FK → stock_transfers, NOT NULL |
| product_id | uuid | FK → products, NOT NULL |
| quantity | numeric(12,2) | NOT NULL |
| received_quantity | numeric(12,2) | nullable |

- `received_quantity` can differ from `quantity` (partial receipt, damage)
- **Not built in Phase 1**

### 2.4 Dropped Tables

#### `organizations` — REMOVED

Merged into `tenants`. The `organizations` table was always 1:1 with `tenants` — every signup created one org + one tenant. This added a useless join in every tenant-scoped query.

**Migration:**
- Move `industry_type` column to `tenants`
- Remove `organization_id` FK from `tenants`
- Drop `organizations` table and entity
- Update all services that referenced `Organization` to use `Tenant` directly

### 2.5 Modified Tables

#### `users` — changes

| Change | Details |
|--------|---------|
| REMOVE | `role` column (enum) |
| REMOVE | `users_role_enum` PostgreSQL type |
| CHANGE | `email` unique constraint: DROP composite `(tenantId, email)`, ADD simple `UNIQUE(email)` — email is now globally unique across all tenants. Prevents multi-tenant login disambiguation. |
| ADD | `role_id` uuid FK → roles, NOT NULL |
| ADD | `phone` varchar(32), nullable — for staff contact info |

#### `orders` — changes

| Change | Details |
|--------|---------|
| ADD | `created_by` uuid FK → users, NOT NULL — every order must track who created it. Since this is a full DB reset with no legacy data, no migration backfill needed. |
| ADD | Index on `(branch_id, created_by, created_at)` for POS "my orders today" query |

Used for "my orders" filtering in POS (cashier sees own orders). Set from `user.sub` in JWT during `POST /orders`.

#### `tenants` — changes

| Change | Details |
|--------|---------|
| ADD | `signup_source` varchar(32) DEFAULT 'self_service' |
| ADD | `onboarded_by` uuid nullable (FK → platform_admins) |
| ADD | `receipt_footer` text DEFAULT 'Thank you!' |

### 2.5 Default Role Permissions (seeded per tenant)

When a tenant is created, 6 system roles are auto-created with these permissions:

| Permission | owner | senior_manager | manager | cashier | senior_staff | staff |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| products:create | ✅ | ✅ | | | | |
| products:read | ✅ | ✅ | ✅ | | | |
| products:update | ✅ | ✅ | | | | |
| products:delete | ✅ | ✅ | | | | |
| categories:create | ✅ | ✅ | | | | |
| categories:read | ✅ | ✅ | ✅ | | | |
| categories:update | ✅ | ✅ | | | | |
| categories:delete | ✅ | ✅ | | | | |
| tax:create | ✅ | ✅ | | | | |
| tax:read | ✅ | ✅ | | | | |
| tax:update | ✅ | ✅ | | | | |
| tax:delete | ✅ | ✅ | | | | |
| discounts:create | ✅ | ✅ | | | | |
| discounts:read | ✅ | ✅ | ✅ | | | |
| discounts:update | ✅ | ✅ | | | | |
| discounts:delete | ✅ | ✅ | | | | |
| discounts:apply | ✅ | ✅ | ✅ | | | |
| inventory:read | ✅ | ✅ | ✅ | | | |
| inventory:receive | ✅ | ✅ | ✅ | | ✅ | |
| inventory:adjust | ✅ | ✅ | ✅ | | | |
| orders:create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| orders:read | ✅ | ✅ | ✅ | | | |
| orders:cancel | ✅ | ✅ | ✅ | | | |
| pos:sell | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| pos:void | ✅ | ✅ | ✅ | ✅ | ✅ | |
| pos:open_drawer | ✅ | ✅ | ✅ | ✅ | | |
| staff:create | ✅ | | | | | |
| staff:read | ✅ | ✅ | | | | |
| staff:update | ✅ | | | | | |
| staff:delete | ✅ | | | | | |
| staff:assign_role | ✅ | | | | | |
| settings:read | ✅ | | | | | |
| settings:update | ✅ | | | | | |
| branches:create | ✅ | | | | | |
| branches:read | ✅ | ✅ | ✅ | | | |
| branches:update | ✅ | | | | | |
| audit:read | ✅ | ✅ | ✅ | | | |
| reports:read | ✅ | ✅ | ✅ | | | |
| branch_groups:create | ✅ | | | | | |
| branch_groups:read | ✅ | ✅ | | | | |
| branch_groups:update | ✅ | | | | | |
| branch_groups:delete | ✅ | | | | | |
| pricing:read | ✅ | ✅ | ✅ | | | |
| pricing:update | ✅ | ✅ | | | | |
| transfers:create | ✅ | ✅ | ✅ | | | |
| transfers:read | ✅ | ✅ | ✅ | | | |
| transfers:receive | ✅ | ✅ | | | | |

**Note:** The seed script inserts individual `role_permissions` rows for each permission. No wildcards are stored in the database. Wildcard matching (e.g., `products:*`) is a runtime feature for custom roles created by business owners, not used in default system roles.

---

## 3. Platform Admin System

### 3.1 Authentication

Separate from business user auth. Different table, different JWT strategy, different login endpoint.

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /platform/auth/login | none | Platform admin login |
| GET | /platform/auth/me | PlatformJwt | Current platform admin |

**JWT payload (platform admin):**

```json
{
  "sub": "platform-admin-uuid",
  "email": "admin@unipos.com",
  "fullName": "Platform Admin",
  "isPlatform": true
}
```

**Guard separation:**
- `JwtAuthGuard` — uses `JWT_SECRET` env var, validates business user tokens
- `PlatformJwtGuard` — uses `PLATFORM_JWT_SECRET` env var, validates platform admin tokens
- **Separate secrets** — compromise of one does not affect the other
- Each guard rejects tokens signed with the wrong secret (signature mismatch = 401)

**Seed:** Platform admin created from env vars only. No self-registration.

```env
PLATFORM_ADMIN_EMAIL=admin@unipos.com
PLATFORM_ADMIN_PASSWORD=...
PLATFORM_ADMIN_FULL_NAME=Platform Admin
PLATFORM_JWT_SECRET=...   # separate from JWT_SECRET
```

### 3.2 Tenant Management Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /platform/tenants | PlatformJwt | List all tenants (search, paginate) |
| GET | /platform/tenants/:id | PlatformJwt | Tenant detail (owner, branches, user count) |
| POST | /platform/tenants | PlatformJwt | Manually create tenant + owner |
| PATCH | /platform/tenants/:id | PlatformJwt | Suspend/activate tenant |
| POST | /platform/tenants/:id/impersonate | PlatformJwt + password confirmation | Get short-lived JWT as tenant owner |

### 3.3 Manual Tenant Creation

```json
// POST /platform/tenants
{
  "business_name": "Karim Textiles",
  "owner_name": "Karim Mia",
  "owner_email": "karim@example.com",
  "owner_phone": "+880-1812-345678"
}
```

Backend creates (in one transaction):
1. Tenant (signup_source: 'manual', onboarded_by: platformAdminId)
2. Default branch ("Main Branch", code: "MAIN")
3. 6 system roles with default permissions
4. Owner user with temporary password

Returns: tenant details + temporary password. Platform admin shares the password manually (phone/WhatsApp).

### 3.4 Impersonation Flow

1. Platform admin clicks "Login as" on a tenant row → prompted for their password (re-authentication)
2. `POST /platform/tenants/:id/impersonate` with `{ password }` → backend verifies platform admin password, then finds tenant's owner user
3. Backend creates 1-hour JWT with owner's identity + `impersonatedBy: platformAdminId`, **signed with `JWT_SECRET`** (not `PLATFORM_JWT_SECRET`) so that regular `JwtAuthGuard` accepts it — the impersonation token IS a business user token
4. Audit log: `platform.impersonation.start`
5. Frontend stores:
   - `uni-pos.platform.access-token` → platform admin's own token (untouched)
   - `uni-pos.admin.access-token` → impersonation token
6. Redirects from `/(platform)/tenants` → `/(dashboard)`
7. Yellow banner: "Viewing as [Business Name] — [Exit]"
8. Any mutations during impersonation include `impersonated_by` in audit payload
9. "Exit" → remove `uni-pos.admin.access-token`, redirect to `/(platform)/tenants`
10. Audit log: `platform.impersonation.end`

### 3.5 Frontend Routes (Platform Admin)

Same `apps/admin` app, separate route group:

```
apps/admin/src/app/
├── login/                → business user login
├── register/             → self-service business signup
├── platform/
│   └── login/            → platform admin login
├── (dashboard)/          → business users (existing, AuthProvider + BranchProvider)
│   └── layout.tsx        → guard: must have tenantId, no isPlatform
├── (platform)/           → platform admin only (different layout, no BranchProvider)
│   ├── layout.tsx        → guard: must have isPlatform
│   ├── tenants/
│   │   ├── page.tsx      → tenant list
│   │   └── [id]/page.tsx → tenant detail
│   └── page.tsx          → redirect to /tenants (or simple dashboard with tenant count)
```

Platform admin sidebar: Tenants, Settings, Logout. No business pages.

---

## 4. Self-Service Business Signup

### 4.1 Registration Endpoint

```
POST /auth/register
```

```json
{
  "business_name": "Rahim's Super Shop",
  "owner_name": "Rahim Ahmed",
  "email": "rahim@example.com",
  "password": "SecurePass123",
  "phone": "+880-1712-345678"  // optional
}
```

**One atomic transaction creates:**
1. Tenant `{ name: business_name, slug: auto-generated, signup_source: 'self_service' }`
2. Branch `{ name: 'Main Branch', code: 'MAIN' }`
3. 6 system roles with default permission mappings
4. User `{ fullName: owner_name, email, passwordHash, role_id: owner_role.id }`

**Returns:** `{ access_token, user }` — owner is logged in immediately.

**Shared tenant bootstrap logic:** The seed script and the registration endpoint both create tenant → branch → roles → user. This logic MUST be extracted into a shared `TenantBootstrapService.createTenant()` method to prevent drift. Both the seed script and `POST /auth/register` call the same service. The platform admin's `POST /platform/tenants` also calls this service.

**Slug generation:**
- `"Rahim's Super Shop"` → `"rahims-super-shop"`
- On unique constraint violation → retry with nanoid(4) suffix: `"rahims-super-shop-x7k2"`

### 4.2 Registration Page

Location: `apps/admin/src/app/register/page.tsx`

Fields:
- Business Name (required)
- Your Name (required)
- Email (required)
- Password (required)
- Phone (optional)

On success → redirect to `/dashboard`. Dashboard shows welcome card: "Welcome! Start by adding your products →"

### 4.3 Change Password

```
PATCH /auth/password
Body: { current_password, new_password }
Auth: JwtAuthGuard
```

Accessible from a settings/profile page in the admin app. Needed for manually onboarded owners who received a temp password.

---

## 5. RBAC Guard System

### 5.1 Backend Implementation

**Permission decorator:**

```ts
@RequirePermission('products:create')
// or multiple (ANY match = allowed):
@RequirePermission('products:create', 'products:update')
```

**PermissionGuard logic:**

```
1. Extract role_id from JWT (user.roleId)
2. Query: SELECT p.code FROM role_permissions rp
          JOIN permissions p ON p.id = rp.permission_id
          WHERE rp.role_id = :roleId
3. Check: does any user permission match the required permission?
4. Wildcard matching:
   - 'products:*' matches 'products:create', 'products:read', etc.
   - '*' matches everything
5. No match → 403 Forbidden
```

**Caching:** In-memory Map cache keyed by `role_id`, TTL 5 minutes. Invalidated when role permissions are updated via `RbacService.invalidateRoleCache(roleId)`. Avoids per-request DB query for permission resolution.

**Tenant status check (NEW behavior added to JwtAuthGuard):** The existing `JwtAuthGuard` only verifies JWT signature. It must be extended to also check `tenants.status`. Cached in-memory, TTL 60 seconds, keyed by `tenant_id`. A suspended tenant is kicked within 60 seconds max. This is a behavioral change to the core auth guard that affects ALL authenticated endpoints.

Implementation: After JWT validation, the guard calls `RbacService.isTenantActive(tenantId)` which checks the cache first, then DB. If suspended → throw `ForbiddenException('Your business account has been suspended. Contact support.')`.

**JWT payload (business users):**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "fullName": "User Name",
  "roleId": "role-uuid",
  "tenantId": "tenant-uuid",
  "defaultBranchId": "branch-uuid",
  "isPlatform": false
}
```

Note: `role_id` in JWT, not permissions. Permissions resolved server-side per request.

### 5.2 Auth Me Endpoint Changes

```
GET /auth/me
Returns: {
  user: { sub, email, fullName, tenantId, defaultBranchId },
  role: { id, name, slug },
  permissions: ['products:create', 'products:read', ...],
  branch: { id, name, code },           // default branch details (for POS header display)
  tenant: { name, defaultCurrency }      // for receipt/display purposes
}
```

Permissions are resolved on the backend and sent as a flat string array. Frontend never queries role_permissions directly.

### 5.3 Frontend Permission System

**AuthProvider changes:**
- Stores `permissions: string[]` alongside `user`
- Fetched from `/auth/me` on login and page refresh

**Permission hook:**

```ts
function usePermission(code: string): boolean {
  const { permissions } = useAuth();
  return permissions.some(p => matchPermission(p, code));
}

function matchPermission(userPerm: string, required: string): boolean {
  if (userPerm === '*') return true;
  if (userPerm === required) return true;
  const [resource, action] = userPerm.split(':');
  const [reqResource] = required.split(':');
  if (action === '*' && resource === reqResource) return true;
  return false;
}
```

**Usage in admin app:**

```tsx
// Sidebar: hide items user can't access
{usePermission('products:read') && <SidebarItem href="/products" />}

// Buttons: hide actions user can't perform
{usePermission('products:create') && <Button>Add Product</Button>}

// Pages: redirect if no access
if (!usePermission('products:read')) redirect('/dashboard');
```

### 5.4 Role Assignment Security

- `staff:assign_role` permission required to change user roles
- Additional check: a user cannot assign a role that has more permissions than their own role
- Only `owner` has `staff:assign_role` by default

---

## 6. POS Terminal App

### 6.1 App Setup

Location: `apps/pos/` — separate Next.js app in the monorepo.

Separate from `apps/admin`:
- Different UX paradigm (touch-first, full-screen)
- Different users (cashier vs admin)
- Independent deployment (admin on web, POS on tablet)
- Performance optimized for fast interactions

### 6.2 Auth & Access

- Same `POST /auth/login` endpoint as admin
- After login, call `GET /auth/me` which returns user + role + permissions + branch name
- Check permissions: must have `pos:sell`
- If no `pos:sell` permission → "You don't have POS access" error
- POS uses branch name from `/auth/me` response for header display — no extra API call needed
- POS users without admin permissions never see admin UI

### 6.3 File Structure

```
apps/pos/
├── package.json
├── next.config.ts
├── .env.local                  → NEXT_PUBLIC_API_BASE_URL
├── src/
│   ├── app/
│   │   ├── layout.tsx          → root layout (fonts, providers)
│   │   ├── page.tsx            → redirect to /terminal
│   │   ├── login/page.tsx      → POS login
│   │   ├── (terminal)/         → auth-guarded route group
│   │   │   ├── layout.tsx      → POS layout (header, cart+data providers)
│   │   │   ├── page.tsx        → main terminal (product grid + cart panel)
│   │   │   ├── orders/page.tsx → my orders today
│   │   │   └── settings/page.tsx → printer, scanner config
│   ├── components/
│   │   ├── cart/
│   │   │   ├── cart-panel.tsx       → right panel (cart/checkout/receipt states)
│   │   │   ├── cart-item.tsx        → single item row with +/- qty
│   │   │   └── cart-summary.tsx     → subtotal, tax, discount, total
│   │   ├── products/
│   │   │   ├── product-grid.tsx     → responsive grid of product cards
│   │   │   ├── product-card.tsx     → single product (name, price, tap to add)
│   │   │   ├── product-search.tsx   → search input
│   │   │   └── category-tabs.tsx    → horizontal category filter
│   │   ├── scanner/
│   │   │   ├── camera-scanner.tsx   → html5-qrcode camera UI
│   │   │   └── barcode-overlay.tsx  → scan success feedback
│   │   ├── checkout/
│   │   │   ├── payment-form.tsx     → cash tendered input
│   │   │   └── quick-amounts.tsx    → preset cash amount buttons
│   │   ├── receipt/
│   │   │   ├── receipt-view.tsx     → on-screen receipt preview
│   │   │   ├── receipt-actions.tsx  → print, share, new sale buttons
│   │   │   └── thermal-receipt.tsx  → print-optimized receipt component
│   │   └── layout/
│   │       ├── pos-header.tsx       → branch name, cashier, held orders count
│   │       └── pos-menu.tsx         → slide-out menu (orders, settings, logout)
│   ├── lib/
│   │   ├── api.ts                → POS-specific API client (slim, ~7 functions)
│   │   ├── query-client.ts       → TanStack Query client factory
│   │   ├── printer.ts            → ReceiptPrinter interface
│   │   ├── escpos-printer.ts     → WebUSB ESC/POS implementation
│   │   ├── browser-printer.ts    → window.print() fallback
│   │   ├── escpos-commands.ts    → ESC/POS command builder
│   │   └── barcode-detector.ts   → USB scanner keystroke detection
│   ├── providers/
│   │   ├── auth-provider.tsx     → POS auth context (user, permissions)
│   │   ├── query-provider.tsx    → TanStack Query provider
│   │   ├── cart-provider.tsx     → cart state (Context + useReducer)
│   │   └── printer-provider.tsx  → printer connection state
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-cart.ts
│   │   ├── use-scanner.ts
│   │   ├── use-printer.ts
│   │   └── use-barcode-listener.ts → USB scanner keystroke detection hook
│   └── types/
│       └── index.ts              → POS-specific types (slim subset)
```

### 6.4 Screen Layout

Main terminal — single page, left/right split:

```
┌─────────────────────────────────────────────────────┐
│  [≡]    Branch: Main     Held: 2    [Rahim ▾]      │
├──────────────────────────┬──────────────────────────┤
│                          │                          │
│   PRODUCT PANEL (left)   │   RIGHT PANEL            │
│                          │   (state machine)        │
│  [🔍 Search] [📷 Scan]   │                          │
│                          │   State: CART             │
│  ┌──────┐ ┌──────┐      │   → items, totals        │
│  │Prod 1│ │Prod 2│      │   → [Hold] [Checkout →]  │
│  │ ৳70  │ │ ৳220 │      │                          │
│  └──────┘ └──────┘      │   State: CHECKOUT         │
│  ┌──────┐ ┌──────┐      │   → payment method        │
│  │Prod 3│ │Prod 4│      │   → cash tendered         │
│  │ ৳45  │ │ ৳180 │      │   → [← Back] [Complete]  │
│  └──────┘ └──────┘      │                          │
│                          │   State: RECEIPT          │
│  [All] [Rice] [Snacks]  │   → receipt preview       │
│                          │   → [Print] [Share]      │
│                          │   → [New Sale]           │
└──────────────────────────┴──────────────────────────┘
```

Left panel (product grid) stays constant. Right panel transitions: CART → CHECKOUT → RECEIPT → CART (new sale).

### 6.5 Product Entry Methods

**Product pricing in POS:**
- POS loads products with branch-specific pricing via LEFT JOIN on `branch_product_prices`
- If `branch_product_prices` row exists for (branch_id, product_id) → use that price
- Otherwise → use `products.price` (tenant default)
- Product cards show the resolved price — cashier never sees the fallback logic
- Backend checkout service uses the same resolution when calculating line totals

**1. Search by name/SKU:**
- Search input at top of product panel
- Debounced (300ms), filters product grid live
- Matches against product name and SKU

**2. Camera QR/barcode scan:**
- Click scan icon → opens camera overlay using `html5-qrcode` library
- Supports: QR Code, EAN-13, Code-128, UPC-A (most retail barcodes)
- On scan → matches `product.barcode` field → adds to cart → closes camera
- Uses rear camera on mobile, webcam on desktop

**3. USB barcode scanner:**
- Listens for rapid keystroke pattern globally
- Detection: 6+ characters arriving within 100ms total **AND** terminated by Enter key (CR/LF)
- Enter terminator prevents false positives from paste, autocomplete, autofill
- On detection → matches barcode → adds to cart
- Invisible to user — just works when scanner is plugged in

### 6.6 Cart State Management

React Context + useReducer. No Redux.

**Cart state shape:**

```ts
interface CartState {
  items: CartItem[];
  discounts: AppliedDiscount[];
  phase: 'cart' | 'checkout' | 'receipt';
  completedOrder: Order | null;   // set after checkout
  heldCarts: CartItem[][];        // parked orders
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;              // can override if discounts:apply permission
}
```

**Cart actions:**

```ts
type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'SET_PRICE'; productId: string; price: number }
  | { type: 'APPLY_DISCOUNT'; discount: AppliedDiscount }
  | { type: 'REMOVE_DISCOUNT'; discountId: string }
  | { type: 'HOLD_CART' }
  | { type: 'RECALL_CART'; index: number }
  | { type: 'SET_PHASE'; phase: 'cart' | 'checkout' | 'receipt' }
  | { type: 'SET_COMPLETED_ORDER'; order: Order }
  | { type: 'NEW_SALE' }
```

### 6.7 Checkout Flow

1. Cashier taps "Checkout →" (cart must have ≥1 item)
2. Right panel transitions to CHECKOUT state
3. Payment form shows:
   - Total amount (read-only)
   - Cash tendered input
   - Quick amount buttons (round-up amounts + exact)
   - Calculated change
4. Cashier enters cash tendered, taps "Complete Sale"
5. Frontend:
   - `POST /orders` with `{ branch_id, items: [...], created_by: userId }` → draft order
   - `POST /orders/:id/complete` with `{ payments: [{ method: 'cash', amount, cash_tendered }] }` → completes order, calculates tax, deducts stock
6. Backend returns completed order with all computed fields
7. Right panel transitions to RECEIPT state
8. Auto-actions (based on settings):
   - If auto-print → print customer copy + shop copy
   - If cash drawer enabled + `pos:open_drawer` permission → kick drawer

### 6.8 Hold/Park Orders

- "Hold" button saves current cart items to `heldCarts[]` array and clears the active cart
- Header shows held count: "Held: 2"
- Tap held count → dropdown/modal showing held carts (summary of items + total)
- Tap a held cart → recall it into the active cart
- Held carts stored in component state (lost on page refresh for Phase 1)
- Phase 2: persist held carts to localStorage or backend

### 6.9 Data Fetching

Phase 1: Direct API calls via `api.ts` service functions + TanStack Query. No abstraction layer.

When Phase 2 offline support is planned, refactor service functions behind an interface at that time. The refactor is trivial (extract interface from existing functions) and avoids premature abstraction.

---

## 7. Receipt & Printing System

### 7.1 Receipt Generation

On checkout complete, backend:
1. Returns completed order (items, taxes, payments, totals)
2. Generates receipt token: `nanoid(12)` → saves to `receipt_tokens` table
3. Returns `receipt_url` in response

### 7.2 Receipt Printing — Two Copies

On checkout complete:
1. Print customer copy (no label)
2. Print shop copy (with "SHOP COPY" header)
3. Kick cash drawer (if enabled + permission)

**Settings:**

```
Print copies:
( ) Customer only
(●) Customer + Shop copy    ← default
( ) Shop copy only
```

### 7.3 ESC/POS Thermal Printing (Primary)

Uses WebUSB API. Chrome + HTTPS required (localhost exempt).

**ReceiptPrinter interface:**

```ts
interface ReceiptPrinter {
  isAvailable(): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  print(receipt: ReceiptData, options?: PrintOptions): Promise<void>;
  openDrawer(): Promise<void>;
}

interface PrintOptions {
  copies?: number;        // default: 2 (customer + shop)
  shopCopy?: boolean;     // adds "SHOP COPY" header
}

interface ReceiptData {
  businessName: string;
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  orderNumber: string;
  date: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  taxDetails: { name: string; rate: number; amount: number }[];
  discountAmount: number;
  total: number;
  payments: { method: string; amount: number; cashTendered?: number; change?: number }[];
  currency: string;
  footer: string;         // from tenant.receipt_footer
}
```

**ESC/POS command sequence (per copy):**

```
ESC @               → initialize printer
ESC a 1             → center align
[If shop copy: ESC E 1, "=== SHOP COPY ===", ESC E 0]
ESC E 1             → bold ON
{businessName}
ESC E 0             → bold OFF
{branchName}
{branchAddress}
{branchPhone}
{orderNumber}
{date} | Cashier: {cashierName}
────────────────    → separator (dashes to fill width)
ESC a 0             → left align
{item lines — name left-padded, amount right-padded to paper width}
────────────────
Subtotal        {subtotal}
{tax lines}
Discount        -{discountAmount}
════════════════
TOTAL           {total}
────────────────
{payment lines}
ESC a 1             → center
{footer}
"Powered by uniPOS"
GS V 66 3          → partial cut paper
```

After both copies:
```
ESC p 0 25 250      → kick cash drawer (pin 2, pulse)
```

**Paper widths:**
- 58mm = 32 characters/line
- 80mm = 48 characters/line
- User selects in settings, stored in localStorage

**Printer disconnect handling:**
- Print attempt fails → toast: "Printer disconnected. Receipt saved."
- Receipt panel still visible with manual retry button
- Never blocks checkout flow

### 7.4 Browser Print Fallback

When WebUSB is not available (Safari, Firefox, or no printer paired):

- Render receipt in a hidden iframe at correct width (58mm or 80mm from settings)
- Both copies in single continuous layout with dashed separator: `─ ─ ─ ✂ ─ ─ ─`
- `iframe.contentWindow.print()` → browser print dialog
- Monospace font, no margins

For regular printers (A4), CSS `@page` break between copies.

**Browser detection message:** If WebUSB unavailable, show in settings: "Direct printing requires Chrome. Using browser print as fallback."

### 7.5 WhatsApp Sharing

```ts
function shareReceipt(receiptUrl: string, orderNumber: string, total: string) {
  const text = `Your receipt for order ${orderNumber}\nTotal: ${total}\n${receiptUrl}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}
```

### 7.6 Public Receipt Page

**Backend endpoint (outside /api/v1 prefix):**

```
GET /receipts/:token          → server-rendered HTML page
GET /api/v1/receipts/:token   → JSON (for POS app's receipt panel)
```

**JSON response:**

```json
{
  "data": {
    "business_name": "Rahim's Super Shop",
    "branch_name": "Main Branch",
    "branch_address": "123 Dhaka Road",
    "branch_phone": "+880-1234-5678",
    "order_number": "ORD-2026-0042",
    "date": "2026-03-16T14:34:00Z",
    "cashier_name": "Rahim",
    "items": [...],
    "subtotal": 405,
    "tax_amount": 20,
    "discount_amount": 0,
    "total": 425,
    "payments": [{ "method": "cash", "amount": 500, "cash_tendered": 500, "change": 75 }],
    "currency": "BDT",
    "footer": "Thank you!"
  }
}
```

**HTML version:** Server-rendered HTML using NestJS with raw template literal strings (no templating engine dependency). Inline CSS, no JavaScript. Works on any phone browser for WhatsApp link previews. This is a deliberate simplicity choice — the receipt is a single static page, not worth adding Handlebars/EJS for. Phase 3 moves this to Next.js edge-rendered for scalability.

### 7.7 Printer Settings Page

Location: `apps/pos/src/app/(terminal)/settings/page.tsx`

```
Printer:
  Status: ● Connected | ○ Not connected
  Device: Epson TM-T82 (or "None")
  Paper Width: (●) 80mm  ( ) 58mm
  [Connect Printer] [Test Print]

Auto-print:
  [✓] Print after checkout
  Print copies: ( ) Customer only (●) Customer + Shop (  ) Shop only

Cash Drawer:
  [✓] Open drawer on checkout

Scanner:
  Camera: [✓] Enable camera scan button
  USB: [✓] Enable USB barcode detection
```

All settings stored in localStorage. Per-browser, per-device.

---

## 8. Backend Endpoint Changes Summary

### 8.1 New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | none | Self-service business signup |
| PATCH | /auth/password | Jwt | Change password |
| POST | /platform/auth/login | none | Platform admin login |
| GET | /platform/auth/me | PlatformJwt | Current platform admin |
| GET | /platform/tenants | PlatformJwt | List tenants |
| GET | /platform/tenants/:id | PlatformJwt | Tenant detail |
| POST | /platform/tenants | PlatformJwt | Create tenant manually |
| PATCH | /platform/tenants/:id | PlatformJwt | Update tenant status |
| POST | /platform/tenants/:id/impersonate | PlatformJwt | Impersonate tenant owner |
| GET | /api/v1/receipts/:token | none | Receipt data (JSON) |
| GET | /receipts/:token | none | Receipt page (HTML) |
| GET | /branch-groups | Jwt | List branch groups (tree) |
| POST | /branch-groups | Jwt | Create branch group |
| PATCH | /branch-groups/:id | Jwt | Update branch group |
| DELETE | /branch-groups/:id | Jwt | Delete branch group |
| POST | /branch-groups/:id/members | Jwt | Add branch to group |
| DELETE | /branch-groups/:id/members/:branchId | Jwt | Remove branch from group |
| GET | /branches/:id/pricing | Jwt | List branch-specific prices |
| PUT | /branches/:id/pricing | Jwt | Set/update branch product prices (batch) |
| DELETE | /branches/:id/pricing/:productId | Jwt | Remove branch price override |
| GET | /users/:id/branches | Jwt | List user's accessible branches |
| PUT | /users/:id/branches | Jwt | Set user's branch access list |

### 8.2 Modified Endpoints

| Endpoint | Change |
|----------|--------|
| GET /auth/me | Returns `permissions: string[]` alongside user and `role: { id, name, slug }` |
| POST /orders | Accepts `created_by` field (set from JWT user.sub) |
| POST /orders/:id/complete | Existing — used by POS checkout flow, generates receipt_token |
| POST /orders/:id/cancel | Existing — requires `orders:cancel` permission |
| All business endpoints | Add `@RequirePermission()` decorators |

### 8.3 New Modules

| Module | Contents |
|--------|----------|
| PlatformModule | PlatformAdminEntity, PlatformAuthController, PlatformTenantsController, PlatformAuthService, PlatformTenantsService |
| RbacModule | PermissionEntity, RoleEntity, RolePermissionEntity, PermissionGuard, RequirePermission decorator, RbacService |
| ReceiptsModule | ReceiptTokenEntity, ReceiptsController (public), ReceiptsService |
| BranchGroupsModule | BranchGroupEntity, BranchGroupMemberEntity, BranchGroupsController, BranchGroupsService |
| PricingModule | BranchProductPriceEntity, PricingController, PricingService |
| UserBranchesModule | UserBranchEntity, integrated into UsersController (PUT /users/:id/branches), UserBranchesService |

---

## 9. Frontend Changes Summary (Admin App)

### 9.1 Auth Changes

- AuthProvider stores `permissions: string[]`
- `usePermission(code)` hook for checking access
- `matchPermission()` utility for wildcard matching

### 9.2 New Pages

| Page | Purpose |
|------|---------|
| /register | Self-service business signup form |
| /platform/login | Platform admin login |
| /(platform)/tenants | Tenant list with search, impersonate, create |
| /(platform)/tenants/[id] | Tenant detail |
| /(dashboard)/branch-groups | Branch groups tree view with CRUD |
| /(dashboard)/branches/[id]/pricing | Branch-specific pricing overrides |
| /(dashboard)/staff | Staff list with role assignment + branch access |
| /(dashboard)/staff/[id] | Staff detail — edit profile, assign role, set branch access |
| /(dashboard)/settings | Business settings + change password |

### 9.3 Modified Pages

| Page | Change |
|------|--------|
| /(dashboard)/layout.tsx | Guard: reject isPlatform tokens |
| All sidebar items | Permission-based visibility |
| All action buttons | Permission-based visibility |
| app-header.tsx | Yellow impersonation banner when impersonatedBy present |

---

## 10. State Management

| State | Where | Tool |
|-------|-------|------|
| Server data (products, orders) | Both apps | TanStack Query v5 |
| Auth (user, token, permissions) | Both apps | React Context |
| Branch selection | Admin only | React Context |
| Cart (items, discounts, phase) | POS only | React Context + useReducer |
| Printer connection | POS only | React Context |
| Held carts | POS only | Component state (Phase 1) |
| Settings (printer, scanner) | POS only | localStorage |

No Redux. No Zustand. Context + useReducer + TanStack Query covers all needs.

---

## 11. Key Libraries

### POS App (new)

| Library | Purpose |
|---------|---------|
| next | App framework |
| @tanstack/react-query | Server state management |
| react-hook-form + zod | Settings forms |
| html5-qrcode | Camera barcode/QR scanning |
| nanoid | Receipt token generation (backend) |
| tailwindcss | Styling |
| shadcn/ui | UI components |

### Backend (additions)

| Library | Purpose |
|---------|---------|
| nanoid | Receipt token generation |
| @nestjs/throttler | Rate limiting for auth endpoints |

No other new major dependencies. ESC/POS commands are raw bytes — no library needed.

---

## 12. Edge Cases & Error Handling

### 12.1 Suspended Tenant Behavior

When platform admin suspends a tenant:
- `tenants.status` set to `'suspended'`
- `JwtAuthGuard` checks tenant status on every request — if suspended → 403 with message: "Your business account has been suspended. Contact support."
- Active POS sessions get kicked on next API call
- All data is retained (not deleted) — can be reactivated
- No new logins allowed for that tenant's users

### 12.2 Registration Error Handling

| Scenario | Response |
|----------|----------|
| Duplicate email | 409 Conflict: "An account with this email already exists" |
| Missing required fields | 422 Validation Error with field-specific messages |
| Slug collision | Auto-retry with nanoid(4) suffix (internal, transparent to user) |
| Transaction failure | 500 with generic message, full rollback, no partial state |

**Same person, two businesses:** Not allowed with the same email. Email is globally unique. If a person needs two businesses, they use a different email (e.g. rahim+shop2@gmail.com). This avoids the multi-tenant login disambiguation problem entirely.

### 12.3 Error Response Format (all endpoints)

```json
{
  "statusCode": 403,
  "message": "You do not have permission to perform this action",
  "error": "Forbidden"
}
```

Follows existing NestJS exception filter pattern. PermissionGuard returns 403 with the required permission code in logs (not in response, to avoid leaking permission structure).

### 12.4 Impersonation Token Expiry

- 1-hour impersonation JWT expires → next API call returns 401
- Frontend detects 401 → checks if `uni-pos.platform.access-token` exists
- If exists → auto-revert to platform admin view, toast: "Impersonation session expired"
- If not → redirect to login

### 12.5 Concurrent Checkout & Stock

- Stock deduction happens inside `POST /orders/:id/complete` transaction
- Uses `SELECT ... FOR UPDATE` on `inventory_balances` row → serialized at DB level
- If stock insufficient after lock → 409 Conflict: "Insufficient stock for [product name]"
- Order remains in `draft` status, frontend shows error, cashier can adjust quantity

### 12.6 Cart Recall Conflict

- If active cart has items and cashier recalls a held cart → **prompt**: "You have items in your current cart. Hold current cart and recall, or cancel?"
- Options: "Hold & Recall" (parks current, loads held) or "Cancel"
- Never silently discards items

### 12.7 Receipt Recovery After "New Sale"

- Receipt data is always accessible via `GET /api/v1/receipts/:token` (permanent)
- "My Orders" page shows all orders created by this cashier today, each with a "View Receipt" / "Reprint" action
- Clicking "New Sale" before printing is safe — receipt is not lost

### 12.8 Role Deletion Safety

- System roles (`is_system = true`) cannot be deleted — backend rejects with 400
- Custom roles: before deletion, check if any users are assigned to it
- If users assigned → 409 Conflict: "Cannot delete role '[name]' — [N] users are assigned to it. Reassign them first."
- No CASCADE from roles to users — FK constraint protects against orphans

### 12.9 Role Assignment — "More Permissions" Check

- When assigning a role to a user, the backend checks: the target role's permission set must be a **subset** of the assigning user's role permissions
- If Role A has `{products:create, orders:read}` and Role B has `{categories:create}`, B is NOT a subset of A → assignment denied
- This prevents privilege escalation even with `staff:assign_role` permission

### 12.10 USB Barcode Scanner — False Positive Prevention

- Detection heuristic: 6+ characters within 100ms **AND** ends with Enter key (CR/LF)
- This eliminates false positives from: paste events (no Enter suffix), autocomplete, browser autofill
- Most barcode scanners are factory-configured to send Enter after the barcode — this is industry standard
- If a scanner doesn't send Enter, user can configure it in scanner settings (most scanners support this via programming barcodes)

### 12.11 Discount Application at POS

Discounts are applied from the existing `discount_presets` catalog (already built in admin):
- Cashier with `discounts:apply` permission taps "Discount" button on cart
- Shows list of active discount presets assigned to the current branch (via `discount_preset_branches`)
- Cashier selects one → applied to cart based on `scope`:
  - `scope: 'order'` → applies to entire order
  - `scope: 'item'` → cashier picks which item
- `type` determines calculation: `'percentage'` or `'fixed'`
- `is_combinable` controls stacking — if false, only one discount allowed
- `min_order_amount` and `max_discount_amount` validated before applying
- The actual tax/discount math is computed by the backend's existing checkout service during `POST /orders/:id/complete`

### 12.12 Tax Calculation (existing, documented for reference)

Tax is computed by the backend checkout service (already implemented):
- Each order item inherits `tax_group_id` from its product
- Tax configs for that group + branch are looked up
- `is_inclusive: false` → tax added on top of item price
- `is_inclusive: true` → tax extracted from item price (price already includes tax)
- Results saved as `order_item_taxes` snapshots
- Order-level `tax_amount` is the sum of all item tax amounts

### 12.13 Permission Boundary: `orders:create` vs `pos:sell`

- `pos:sell` → grants access to the POS terminal UI (login to POS app)
- `orders:create` → backend permission to call `POST /orders` endpoint
- Both are needed for a cashier to sell: `pos:sell` gates the UI, `orders:create` gates the API
- A user with only `orders:create` (no `pos:sell`) cannot access the POS app but could theoretically create orders via API (admin-created orders for phone orders, etc.)

### 12.14 Temporary Password for Manual Onboarding

- Generated as a random 8-character alphanumeric string
- Hashed with bcrypt (cost factor 10) before storing
- Returned in plaintext in the `POST /platform/tenants` response (visible only to platform admin)
- No `must_change_password` flag for Phase 1 — platform admin verbally instructs the owner to change it
- Owner changes password via `PATCH /auth/password` from admin settings page

### 12.15 Branch Access Enforcement

**Write operations** (stock adjust, settings change, price override):
- Service checks `user_branches` — if user has entries AND target branch is NOT in the list → 403 Forbidden
- If user has NO entries in `user_branches` → allowed (owner/sr.manager pattern)

**Read operations** (view inventory, orders, reports):
- All branches visible for read — a manager at Branch A can SEE Branch B's stock levels
- This is intentional: enables inventory visibility across the chain ("Branch B has 50 units, request a transfer")
- Admin UI labels other-branch data as read-only (greyed out actions)

**POS selling:**
- Always locked to `default_branch_id` — not affected by `user_branches`
- Stock deducted from `default_branch_id` only
- Cashier cannot switch branches in POS (must log out and log in to a different branch account)

**Branch selector in admin header:**
- Shows only accessible branches (filtered by `user_branches`)
- Owner/sr.manager (no entries) → sees all branches
- Manager with 3 assigned branches → sees only those 3
- Data on screen changes when branch is switched

### 12.16 Branch-Specific Pricing Edge Cases

- **Product with no branch price:** Falls back to `products.price` — transparent to cashier
- **Price updated mid-sale:** Cart shows the price at time of adding to cart. Checkout service re-resolves price from DB — if price changed, the order total reflects the latest price. This is correct behavior (price is locked at checkout, not cart).
- **Bulk price import:** `PUT /branches/:id/pricing` accepts an array of `{ product_id, price, cost? }` — upserts all in one transaction

### 12.17 Rate Limiting

- `POST /auth/login` and `POST /auth/register` — rate limited to 10 requests per minute per IP (NestJS `@nestjs/throttler`)
- `POST /platform/auth/login` — rate limited to 5 requests per minute per IP
- `POST /platform/tenants/:id/impersonate` — rate limited to 5 requests per minute per IP
- `GET /receipts/:token` — no rate limit (public, read-only, no auth, no sensitive data beyond receipt content)
- Other authenticated endpoints — no rate limit (auth itself is the gate)

---

## 13. Security Considerations

1. **JWT separation**: Separate JWT secrets (`JWT_SECRET` and `PLATFORM_JWT_SECRET`) prevent cross-contamination between platform admin and business user tokens
2. **Privilege escalation**: `staff:assign_role` is owner-only; users cannot assign roles with more permissions than their own
3. **Tenant isolation**: All business queries scoped by `tenantId` from JWT
4. **Branch isolation**: `user_branches` enforces data modification scope; services check branch access on every write operation
5. **Receipt tokens**: nanoid(12) uses 64-char URL-safe alphabet (A-Za-z0-9_-) = 64^12 ≈ 4.7 × 10^21 combinations, brute force impractical
6. **Impersonation audit**: All actions during impersonation logged with `impersonated_by`
7. **WebUSB security**: Requires HTTPS (except localhost), user grants device access explicitly
8. **Public receipt endpoint**: Read-only, returns only receipt data, no mutation possible
9. **Branch pricing integrity**: POS resolves price server-side during checkout — frontend price is for display only, backend is authoritative

---

## 14. Validation Rules

### 14.1 Registration (`POST /auth/register`)

| Field | Validation |
|-------|-----------|
| business_name | required, string, 2-255 chars, trimmed |
| owner_name | required, string, 2-255 chars, trimmed |
| email | required, valid email format, lowercase, globally unique |
| password | required, min 8 chars, max 128 chars |
| phone | optional, string, 7-32 chars |

### 14.2 Login (`POST /auth/login`, `POST /platform/auth/login`)

| Field | Validation |
|-------|-----------|
| email | required, valid email format |
| password | required, non-empty |

### 14.3 Change Password (`PATCH /auth/password`)

| Field | Validation |
|-------|-----------|
| current_password | required, non-empty |
| new_password | required, min 8 chars, max 128 chars, must differ from current |

### 14.4 Manual Tenant Creation (`POST /platform/tenants`)

| Field | Validation |
|-------|-----------|
| business_name | required, string, 2-255 chars, trimmed |
| owner_name | required, string, 2-255 chars, trimmed |
| owner_email | required, valid email format, globally unique |
| owner_phone | optional, string, 7-32 chars |

### 14.5 Pagination Standard (all list endpoints)

Offset-based pagination. Query params: `page` (default 1), `pageSize` (default 20, max 100), `search` (optional text search).

**Response envelope:**

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

This matches the existing pagination pattern used in products, orders, and other list endpoints.

### 14.6 Error Response Format

All validation errors return 422 with machine-readable error codes:

```json
{
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "email", "code": "EMAIL_TAKEN", "message": "An account with this email already exists" },
    { "field": "password", "code": "TOO_SHORT", "message": "Password must be at least 8 characters" }
  ]
}
```

**Standard error codes:**

| Code | HTTP | When |
|------|------|------|
| VALIDATION_ERROR | 422 | Field validation failed |
| EMAIL_TAKEN | 409 | Duplicate email on registration |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| FORBIDDEN | 403 | Missing permission |
| TENANT_SUSPENDED | 403 | Tenant has been suspended |
| STOCK_INSUFFICIENT | 409 | Not enough stock for checkout |
| ROLE_HAS_USERS | 409 | Cannot delete role with assigned users |
| NOT_FOUND | 404 | Resource not found |

---

## 15. Production Considerations

### 15.1 Greenfield Statement

**No production data exists.** The existing database contains only development seed data. The full database reset (drop all tables + migrations, regenerate) is safe. No data migration plan is needed.

### 15.2 Health Check

Add `GET /health` endpoint (excluded from global prefix, no auth):
- Returns 200 with `{ status: 'ok', db: 'connected', timestamp }` if DB is reachable
- Returns 503 if DB connection fails
- Used by deployment platforms and uptime monitors

### 15.3 Logging

- Use NestJS built-in Logger with structured JSON output
- Log every: auth attempt (success/fail), impersonation event, permission denial, checkout completion
- Application errors logged with full stack trace
- No sensitive data in logs (no passwords, no full JWTs)

### 15.4 Password Security

- Hashed with bcrypt, cost factor 10
- Minimum 8 characters, maximum 128 characters
- No character complexity requirements (length is the primary defense, per NIST guidelines)

### 15.5 CORS Configuration

Backend must accept requests from both frontend origins:
- `apps/admin` — e.g., `http://localhost:3001` (dev), `https://admin.yourdomain.com` (prod)
- `apps/pos` — e.g., `http://localhost:3002` (dev), `https://pos.yourdomain.com` (prod)

Configure via `CORS_ORIGINS` env var (comma-separated). Example: `CORS_ORIGINS=http://localhost:3001,http://localhost:3002`

### 15.6 Auth Decision: localStorage Tokens

Tokens stored in localStorage (not httpOnly cookies). Tradeoffs:
- **Pro:** Simpler implementation, works with same-origin API calls, no CSRF concern
- **Con:** Vulnerable to XSS
- **Mitigation:** Content Security Policy headers, input sanitization, React's built-in XSS protection
- If security posture needs upgrading later, switch to httpOnly cookies + CSRF tokens

---

## 16. Business Operations (addressed warnings)

### 16.1 Standalone Cash Drawer Open

POS menu includes "Open Drawer" button (gated by `pos:open_drawer` permission). Sends ESC/POS drawer kick command without a sale. Used for cash counts and making change.

### 16.2 Void/Cancel Flow from POS

From "My Orders" screen or the Receipt state:
- Cashier taps "Void" on a completed order
- Requires `orders:cancel` permission
- Confirmation dialog: "Void order #ORD-2026-0042? This will reverse the sale."
- Backend: `POST /orders/:id/cancel` → reverses stock deductions, marks order cancelled
- Receipt reprints as "VOIDED" if printed

### 16.3 POS Product Filtering

POS product query filters by:
- `products.status = 'active'`
- `branch_product_configs.is_available = true` (if config exists for the branch)
- Products without a branch config are shown by default

### 16.4 Held Carts — sessionStorage

Phase 1 improvement: held carts stored in `sessionStorage` instead of pure component state. Survives accidental page refresh within the same tab. Lost only on tab close.

---

## 17. Not In Scope (Phase 2+)

### Phase 2 (next sprint)

| Feature | Description |
|---------|-------------|
| Offline POS | IndexedDB + sync queue + conflict resolution |
| Card payment | Payment gateway integration (Stripe, SSLCommerz) |
| Bluetooth printing | Web Bluetooth API for wireless thermal printers |
| SMS receipt sharing | SMS gateway integration (Twilio, etc.) |
| Customer membership + loyalty | Customer database, points ledger, earn/redeem rules |
| Platform growth metrics | Signups over time, active tenants, revenue dashboard |
| Announcement system | Push updates to all businesses |
| Email service | Automated invite/welcome emails |
| Custom receipt templates | Business owner editable receipt layout |
| Held carts persistence | Backend-persisted held carts (survive tab close) |

### Phase 3 (Tier 3 chain features)

| Feature | Description |
|---------|-------------|
| Inter-branch stock transfer | Transfer stock between branches with shipment tracking (`stock_transfers` table already in schema) |
| Purchase orders | PO → supplier → GRN → stock-in workflow |
| Bulk operations | Batch add product to 500 branches, batch price update |
| Regional reports | Revenue by region/zone/branch group, top/bottom performers |
| Refund/return flow | Full return with stock reversal and refund tracking |
| Shift management | Opening float, end-of-day cash count, expected vs actual reconciliation |
| Edge-rendered receipts | Move public receipt page from backend HTML to Next.js edge for scalability |
