# UniPOS — Universal Commerce Platform

Multi-tenant SaaS point-of-sale system with tax, discount, inventory, and order management.

## Architecture

| App | Stack | Purpose |
|-----|-------|---------|
| `apps/backend` | NestJS 11 + TypeORM + PostgreSQL | REST API server |
| `apps/admin` | Next.js 16 + React 19 + Tailwind | Admin dashboard |
| `apps/pos` | Electron 41 + Vite + TypeScript | Desktop POS client |

**Monorepo** managed with pnpm workspaces.

## Prerequisites

- Node.js >= 20
- pnpm >= 10
- PostgreSQL (or [Neon](https://neon.tech) cloud DB)

## Getting Started

```bash
# Install dependencies
pnpm install

# Configure environment
cp apps/backend/.env.example apps/backend/.env.local
# Edit .env.local with your database URL, JWT secret, etc.

# Run database migrations
pnpm dev:backend  # starts the backend first
# In a separate terminal:
cd apps/backend
npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts

# Seed admin user
npx ts-node src/database/seeds/seed-admin.ts
```

## Development

```bash
# Start backend API (port 3000)
pnpm dev:backend

# Start admin dashboard
pnpm dev:admin

# Start POS desktop app
pnpm dev:pos
```

## API Documentation

Swagger UI available at [http://localhost:3000/docs](http://localhost:3000/docs) when the backend is running.

All endpoints are prefixed with `/api/v1` and require Bearer token authentication (except login).

### Key Modules

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `POST /auth/login` | JWT authentication |
| Products | CRUD `/products` | Product catalog management |
| Categories | CRUD `/categories` | Product categorization |
| Tax Groups | CRUD `/tax-groups` | Tax group definitions |
| Tax Configs | CRUD `/tax-configs` | Per-branch tax rates (inclusive/exclusive) |
| Discounts | CRUD `/discount-presets` | Discount presets with branch assignment |
| Inventory | `/inventory` | Stock-in, adjustments, balances, movements |
| Orders | CRUD `/orders` | Order lifecycle (draft → complete → cancel) |
| Checkout | `POST /orders/:id/complete`, `/cancel` | Atomic checkout orchestration |
| Payments | `POST /payments` | Payment recording (cash, card, digital) |

## Environment Variables

See `apps/backend/.env.example` for all required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DATABASE_URL_DIRECT` | Direct connection (for migrations) |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiration (default: `1d`) |
| `PORT` | API server port (default: `3000`) |

## Project Structure

```
uni-pos/
├── apps/
│   ├── backend/          # NestJS API
│   │   └── src/
│   │       ├── auth/           # JWT authentication
│   │       ├── audit/          # Event-driven audit logging
│   │       ├── categories/     # Product categories
│   │       ├── checkout/       # Checkout orchestrator
│   │       ├── common/         # Shared utilities & events
│   │       ├── database/       # TypeORM config, migrations, seeds
│   │       ├── discounts/      # Discount presets & rules
│   │       ├── inventory/      # Stock management
│   │       ├── orders/         # Order lifecycle
│   │       ├── payments/       # Payment processing
│   │       ├── products/       # Product catalog
│   │       ├── tax/            # Tax groups & configs
│   │       └── users/          # User management
│   ├── admin/            # Next.js admin dashboard
│   └── pos/              # Electron POS client
└── package.json          # Monorepo root
```

## License

Proprietary — All rights reserved.
