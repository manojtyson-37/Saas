# Aureus — Claude Code Context

## Project overview

Aureus is a modular, multi-tenant hospitality ERP SaaS built as a NestJS + Next.js monorepo.
It covers the full operational stack: POS, Hotel PMS, Inventory, Procurement, Accounting, HR, CRM, Bar, and AI Analytics.

**Branch**: `claude/hospitality-erp-saas-big068`
**PR**: kbdcreditsolutions/Saas#1 (open, ready for review)
**CI**: GitHub Actions — `lint → typecheck → test → build → db:migrate → db:seed → web build`

---

## Monorepo layout

```
apps/
  api/          NestJS modular monolith — one module per bounded context
  web/          Next.js 14 app router — back-office + POS UI
packages/
  database/     Prisma schema (≈90 models), migrations, seed
  shared/       resource:action permission catalog, role definitions, shared types
docs/           PRD, architecture, DB design, API spec, permission matrix, design system, roadmap
infra/
  docker-compose.yml   Postgres 16 + Redis 7 + RabbitMQ 3.13
```

---

## Tech stack

| Layer | Technology |
|---|---|
| API | NestJS 10, TypeScript, class-validator/class-transformer |
| ORM | Prisma 5 (PostgreSQL 16) |
| Auth | JWT access + rotating refresh tokens, scrypt password hashing |
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Package manager | pnpm 10 with workspaces |
| Build orchestration | Turborepo 2 |
| Local infra | Docker Compose (Postgres, Redis, RabbitMQ) |
| CI | GitHub Actions |

---

## Local development setup

```bash
# Prerequisites: Node ≥20, pnpm, Docker Desktop running

pnpm install
docker compose -f infra/docker-compose.yml up -d   # starts postgres:5432 redis:6379 rabbitmq:5672
pnpm --filter @aureus/database db:migrate           # runs prisma migrate dev
pnpm --filter @aureus/database db:seed              # seeds demo tenant + users
pnpm dev                                            # api :4000, web :3000
```

**DB credentials (local):**
- Host: `localhost:5432`
- Database: `aureus`
- User: `aureus` / Password: `aureus_dev`

**Useful individual commands:**
```bash
pnpm --filter @aureus/api typecheck          # NestJS TypeScript check
pnpm --filter @aureus/web typecheck          # Next.js TypeScript check
pnpm --filter @aureus/database db:generate   # regenerate Prisma client after schema change
pnpm --filter @aureus/database db:deploy     # migrate without prompts (CI/prod)
pnpm test                                    # run all Jest tests via Turbo
```

---

## Architecture patterns

### Multi-tenancy

Every DB table has `tenantId`. The tenant is resolved from the JWT and stored in `AsyncLocalStorage` via `TenantContext` at request start. All service queries **must** scope by `tenantId` — never omit it.

```typescript
private ctx(): { tenantId: string; userId: string | undefined } {
  const c = TenantContext.get();
  if (!c?.tenantId) throw new BadRequestException('No tenant context');
  return { tenantId: c.tenantId, userId: c.userId };
}
```

### RBAC

Permissions follow the `resource:action` pattern (e.g. `pos.order:settle`, `hr.payroll:run`).
The full catalog lives in `packages/shared/src/permissions.ts`.
Guard controllers with `@RequirePermission('resource:action')`.

### Global modules

`IdentityModule` and `PrismaModule` are `@Global()` — `AuditService` and `PrismaService` are available in every module without explicit import.

### Decimal arithmetic

Always use Prisma's Decimal for money — never native `number`:

```typescript
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
```

### Audit logging

Call `this.audit.log(...)` in every mutating service method. Shape:

```typescript
await this.audit.log({
  action: 'module.entity:action',
  entityType: 'entity_name',
  entityId: entity.id,       // optional
  before: { ... },           // optional, for updates
  after: { ... },
});
```

### Sequence numbers

Use `SequenceService` for human-readable document numbers (PO-0001, GRN-0042, etc.).
It uses Postgres `ON CONFLICT DO UPDATE … RETURNING` for race-free atomic increments.

---

## API modules

All modules are registered in `apps/api/src/app.module.ts`.

| Module | Path | Key resources |
|---|---|---|
| **Identity** | `src/modules/identity` | auth, users, roles, permissions, audit |
| **Organization** | `src/modules/organization` | companies, brands, locations, outlets, floors, tables, stores, terminals |
| **Catalog** | `src/modules/catalog` | categories, menu items, variants, modifier groups, price lists |
| **Inventory** | `src/modules/inventory` | UoMs, item master, stock ledger (append-only), stock summary, WAC, transfers, adjustments, cycle counts |
| **Procurement** | `src/modules/procurement` | vendors, purchase requests, purchase orders, GRNs (auto-posts stock), invoices, payments |
| **Production** | `src/modules/production` | recipes (versioned), production orders (deducts stock on complete) |
| **POS** | `src/modules/pos` | cash sessions, orders (DRAFT→SETTLED), KOT/KDS, billing, settlement, split/merge |
| **Accounting** | `src/modules/accounting` | chart of accounts, journals (Dr=Cr enforced), fiscal years, periods, banking, reconciliation, financial reports |
| **Hotel** | `src/modules/hotel` | room types, rooms, rate plans, guests, reservations, stays, folios, housekeeping, night audit |
| **HR** | `src/modules/hr` | employees, shifts, roster, attendance (clock-in/out), leave types, leave requests, payroll runs, payslips |
| **Assets** | `src/modules/assets` | asset register, depreciation (SL + WDV), AMC contracts, maintenance tickets |
| **CRM** | `src/modules/crm` | customers, wallet ledger, loyalty program, gift cards, coupons, campaigns |
| **Bar** | `src/modules/bar` | bottle registry, pour recording, variance report, excise summary |
| **AI** | `src/modules/ai` | natural-language analytics, revenue forecast (SMA + trend), anomaly detection (Z-score) |

---

## Prisma model conventions

| Wrong | Correct |
|---|---|
| `prisma.order` | `prisma.posOrder` |
| `prisma.orderLine` | `prisma.posOrderItem` |
| `grandTotal` | `totalAmount` |
| `itemName` | `nameSnapshot` |
| `itemId` on PosOrderItem | `menuItemId` |
| `voidedAt: null` filter | `status: { not: 'VOIDED' }` |
| `qty` on StockSummary | `onHand` |

**Valid enum values:**

- `PosOrderStatus`: DRAFT, PLACED, IN_KITCHEN, SERVED, BILLED, **SETTLED**, CANCELLED, VOIDED
- `PayrollRunStatus`: DRAFT, PROCESSED, **POSTED**, PAID (no APPROVED)

---

## Web pages

App shell: `apps/web/src/components/shell/app-shell.tsx`
Nav rail + ⌘K command palette. Auth via JWT stored in localStorage.

| Route | Page |
|---|---|
| `/dashboard` | KPI overview |
| `/organization` | Company/brand/location hierarchy |
| `/users` | Team + role management |
| `/catalog` | Menu items, variants, price lists |
| `/inventory` | Stock levels, transfers, adjustments |
| `/procurement` | Vendors, POs, GRNs |
| `/production` | Recipes, production orders |
| `/pos` | POS terminal UI |
| `/accounting` | Journals, reports, banking |
| `/hotel` | PMS — reservations, front desk, housekeeping |
| `/hr` | Employees, attendance, leave, payroll |
| `/crm` | Customers, gift cards, coupons, campaigns |
| `/bar` | Bar module (pours, variance) |
| `/ai` | AI analytics — NL query, forecast, anomalies |
| `/settings` | Tenant settings |

---

## Implemented phases

| Phase | Scope | Status |
|---|---|---|
| P0 | Foundation: monorepo, schema, auth, RBAC, org, app shell | ✅ Done |
| P1 | Catalog, Inventory, Procurement | ✅ Done |
| P2 | Production, POS | ✅ Done |
| P3 | Accounting (CoA, journals, banking, reports) | ✅ Done |
| P4 | Hotel PMS | ✅ Done |
| P5 | HR + Assets | ✅ Done |
| P6 | CRM | ✅ Done |
| P7 | Bar + AI Analytics | ✅ Done |

---

## Key business rules

- **Payroll**: PF = 12% of gross, capped at ₹1800. ESI = 0.75% if gross ≤ ₹21,000.
- **Overtime**: anything beyond 480 minutes (8 hours) in a shift.
- **Stock ledger**: append-only — never update entries, only insert. `StockSummary` is the running balance.
- **Double-entry journals**: sum of all lines must be zero (Dr amounts positive, Cr negative). Enforced in service before commit.
- **Gift cards**: auto-set to REDEEMED status when balance reaches zero.
- **Wallet**: balance gate enforced before any REDEEM — throws `BadRequestException` if insufficient.
- **Bar pours**: remaining volume gate checked before recording — throws if pour exceeds `remainingMl`. Auto-empties bottle when `remainingMl` hits zero.
- **Anomaly detection**: Z-score over daily revenue buckets; |z| ≥ 2 flags as SPIKE or DIP. Requires ≥ 3 days of data.
- **Depreciation**: idempotent per `(assetId, period)`. Never depreciates below salvage value.
- **Night audit**: idempotent — safe to re-run for the same date.
- **GRN**: auto-posts stock to ledger and updates `StockSummary` in a single `$transaction`.

---

## Testing

```bash
pnpm test                          # all tests
pnpm --filter @aureus/api test     # API tests only
```

Tests use Jest. Integration tests use real Postgres via environment variables.
Cross-tenant denial is mandatory for every endpoint test.

---

## Environment variables

Copy `.env.example` to `.env` in `apps/api/`:

```
DATABASE_URL=postgresql://aureus:aureus_dev@localhost:5432/aureus
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production
REDIS_URL=redis://localhost:6379
```

---

## Git workflow

- **Branch**: `claude/hospitality-erp-saas-big068`
- **Remote**: `kbdcreditsolutions/Saas` (private)
- **PR**: #1 — open, ready for review, CI green
- Never push to `main` directly
- All typechecks must pass before committing: `pnpm typecheck`

---

## Deploying the API to Vercel

The API deploys as a single serverless function (`apps/api/api/index.js` → tsc-compiled `dist/serverless.js`). Config lives in `apps/api/vercel.json`.

**Vercel project settings (dashboard — required, not in the repo):**
- **Root Directory**: `apps/api`, with "Include files outside root directory" **enabled** (pnpm workspace + `workspace:*` symlinks need the repo root).
- **Env vars**: `DATABASE_URL` (must point at a **pooled** connection — pgbouncer / Neon / Supabase pooler port — serverless will exhaust direct connections), `JWT_ACCESS_SECRET`, `WEB_ORIGIN` (comma-separated allowed origins). Optional: `SWAGGER_ENABLED=true` to expose `/api/docs` in production.

Local server (`main.ts`) is unchanged: `pnpm --filter @aureus/api dev`.
