# Aureus — System Architecture

**Version** 1.0 · **Owner** Engineering

---

## 1. Architectural principles

1. **Modular monolith first, microservices when forced.** One NestJS codebase organized as
   strictly-bounded modules (DDD bounded contexts) communicating through in-process events.
   Modules that develop independent scaling needs (POS ordering, aggregator ingestion, AI
   inference, reporting) extract to services along the same seams. This avoids the operational
   tax of premature distribution while keeping extraction cheap.
2. **Event-driven core.** Every business fact (`order.settled`, `grn.posted`,
   `stock.adjusted`) is a domain event published to RabbitMQ. Inventory deduction, ledger
   posting, dashboard updates, loyalty accrual, and notifications are consumers — never
   synchronous side effects of the request path.
3. **The ledger and stock ledger are append-only.** Financial journals and stock movements are
   never updated in place; corrections are reversing entries. Balances are derived + cached.
4. **Tenant isolation is enforced in three layers** (§4): application guard, Prisma middleware,
   and Postgres RLS.
5. **POS is offline-first.** Terminals must sell without the cloud (§7).

## 2. System overview

```
                        ┌───────────────────────────────────────────────┐
                        │                 Edge / CDN (CloudFront)       │
                        └──────────────────────┬────────────────────────┘
        ┌──────────────┬──────────────┬────────┴───────┬────────────────┐
        │  Back office │  POS PWA     │  KDS / QR /    │  Vendor portal │
        │  (Next.js)   │  (offline-   │  Guest web     │  / Audit view  │
        │              │   first)     │  (Next.js)     │                │
        └──────┬───────┴──────┬───────┴────────┬───────┴───────┬────────┘
               │              │  HTTPS + WSS   │               │
        ┌──────┴──────────────┴────────────────┴───────────────┴────────┐
        │                    API Gateway (NestJS)                        │
        │   authn (JWT) · tenant resolution · rate limit · OpenAPI      │
        ├────────────────────────────────────────────────────────────────┤
        │                    Modular monolith — bounded contexts         │
        │                                                                │
        │  identity   organization   catalog(menu)   pos-orders   hotel  │
        │  inventory  procurement    production      bar          crm    │
        │  accounting hr-payroll     assets          reporting    ai     │
        │  integrations(webhooks, aggregators, payments, messaging)      │
        ├────────────────────────────────────────────────────────────────┤
        │  Domain event bus (outbox → RabbitMQ topic exchange)           │
        └───────┬───────────────┬───────────────┬───────────────┬────────┘
                │               │               │               │
        ┌───────┴─────┐ ┌───────┴─────┐ ┌───────┴──────┐ ┌──────┴───────┐
        │ PostgreSQL  │ │ Redis        │ │ RabbitMQ     │ │ S3           │
        │ (primary +  │ │ cache ·      │ │ events ·     │ │ documents ·  │
        │  read       │ │ sessions ·   │ │ jobs ·       │ │ images ·     │
        │  replicas)  │ │ pub/sub·locks│ │ webhooks     │ │ exports      │
        └─────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                Prometheus/Grafana metrics · Sentry errors · OTel traces
```

**Realtime:** WebSocket gateway (Socket.IO on Redis adapter) pushes order/KDS/dashboard updates;
rooms are scoped `tenant:{id}:location:{id}:{channel}`.

**Async workers:** BullMQ (Redis) for jobs (report generation, exports, campaign sends,
night audit); RabbitMQ for inter-context domain events with per-consumer queues, retries and DLQ.

## 3. Bounded contexts & ownership

| Context | Owns | Key events published |
|---|---|---|
| identity | users, roles, permissions, sessions, audit log | user.created, role.changed |
| organization | tenant, company, brand, location, outlet, floor/table, terminal, store, module activation | location.created, module.activated |
| catalog | menu items, categories, modifiers, combos, price lists, day-part pricing | menu.published, price.changed |
| pos-orders | orders, KOTs, bills, payments, cash sessions | order.placed, kot.fired, order.settled, cash-session.closed |
| hotel | room types, rates, reservations, stays, folios, housekeeping | stay.checked-in, folio.charged, stay.checked-out |
| inventory | items, UoM, stores, stock ledger, batches, counts, valuations | stock.moved, stock.adjusted, count.posted |
| procurement | vendors, PR/RFQ/PO/GRN/invoices, vendor ledger | po.approved, grn.posted, purchase-invoice.posted |
| production | recipes/BOM, versions, production orders, prep | recipe.updated, production.completed |
| bar | bottle lifecycle, pour config, variance | bottle.opened, pour.recorded |
| crm | customers, wallet, loyalty, campaigns | customer.visited, points.earned |
| accounting | CoA, journals, tax, banks, periods, budgets | journal.posted, period.closed |
| hr | employees, shifts, attendance, leave, payroll | attendance.punched, payroll.posted |
| assets | asset register, depreciation, AMC, maintenance | depreciation.posted |
| reporting | materialized read models, dashboard aggregates | (consumer only) |
| ai | forecasts, anomalies, NL analytics | forecast.generated, anomaly.detected |
| integrations | webhook registry, aggregator connectors, payment gateways, messaging | webhook.delivered, aggregator-order.received |

**Interaction rules:** contexts never reach into each other's tables. Synchronous needs go
through exported context APIs (in-process today, RPC after extraction); everything else through
events. Example: `order.settled` → inventory consumes (recipe deduction) → accounting consumes
(revenue + tax journal) → crm consumes (points) → reporting consumes (dashboard aggregates).

**Consistency:** the request path commits only its own aggregate + outbox row in one transaction
(transactional outbox). A relay publishes to RabbitMQ. Consumers are idempotent
(event id de-dup table). Cross-context flows that must not half-complete (e.g. GRN → stock +
accrual) are sagas with compensating actions.

## 4. Multi-tenancy

**Model:** shared database, shared schema, `tenant_id` column on every tenant-owned row —
the only model that serves 100 k tenants economically. Enterprise tier can be provisioned into a
dedicated database (same schema) — the data layer resolves a connection per tenant from a
directory, so both models coexist.

**Isolation layers:**
1. **JWT → TenantContext.** Tenant id is embedded in the access token at login and carried in
   `AsyncLocalStorage` per request; it is never accepted from request bodies or query params.
2. **Prisma client extension** injects `tenant_id` into every `where`/`create` for tenant-scoped
   models; queries without tenant scope on scoped models throw in CI tests.
3. **Postgres RLS** policies (`tenant_id = current_setting('app.tenant_id')::uuid`) as
   defense-in-depth; the app sets the GUC per transaction.

**Scoping within a tenant:** users hold role assignments scoped to companies/locations; every
query additionally filters by the user's permitted location set (see doc 05).

## 5. Scalability plan

| Layer | Mechanism |
|---|---|
| API | Stateless pods behind HPA (CPU + p95 latency); k8s across ≥ 3 AZs |
| Postgres | PgBouncer pooling; read replicas for reports/dashboards; partition high-volume tables (orders, order_items, stock_ledger, journal_lines, audit_log) by month + tenant hash; archive cold partitions to S3 |
| Hot reads | Redis: menu snapshots, permission sets, dashboard aggregates, table state |
| Dashboards | Incrementally-updated aggregates (per outlet per day) maintained by reporting consumers — dashboards never scan raw orders |
| Reports | Async generation on read replica → S3 → signed URL |
| Events | RabbitMQ quorum queues; consumers scale horizontally; partition-key = tenant for ordering where needed |
| Realtime | Socket.IO with Redis adapter, sharded by tenant |
| Extraction triggers | pos-orders (write QPS), integrations (burst webhooks), ai (GPU), reporting (read QPS) are first extraction candidates — each already owns its tables and communicates by events |

Capacity math (10 M orders/day ≈ 116 orders/s avg, ~10× peak = 1.2 k orders/s): each order ≈ 6
writes → ~7 k writes/s peak, well inside partitioned Postgres + async fan-out on commodity HA.

## 6. Security architecture

- **Authn:** short-lived JWT access (10 min) + rotating refresh token (httpOnly, per-device,
  revocable); Argon2id hashing; 2FA TOTP; POS PIN mapped to device-bound terminal session; SSO
  (OIDC/SAML) for enterprise.
- **Authz:** permission catalog compiled per user into a cached permission set (Redis, busted on
  role change); guards on every route (`@RequirePermission('inventory.item:create')`); scope
  filter joins user's location grants.
- **Data:** TLS 1.2+; AES-256 at rest; field-level encryption for PII (guest ID documents);
  card data never touches us (gateway tokenization → SAQ-A PCI scope).
- **App:** input validation on every DTO (class-validator, whitelist+forbidNonWhitelisted);
  output serialization allow-lists; rate limits per tenant + per IP; idempotency keys on all
  money/stock mutations; CSRF-safe (bearer tokens, SameSite cookies for web session).
- **Audit:** append-only `audit_log` (actor, action, entity, before/after JSON, ip, terminal)
  written via Prisma extension on every mutation.
- **Secrets:** k8s external-secrets → AWS Secrets Manager; no secrets in env files or images.

## 7. POS offline-first design

- Terminal is a PWA with IndexedDB: menu snapshot, table map, open orders, pending payments.
- Orders are created locally with UUIDv7 ids and a terminal-scoped monotonic sequence; invoice
  numbers are allocated from a pre-fetched per-terminal block (e.g. 200 numbers) so fiscal
  numbering never collides offline.
- Sync protocol: append-only op log per terminal, pushed when online; server applies
  idempotently (op id), returns authoritative state; conflicts (same table, two terminals)
  resolve by server ordering with operator notification.
- Payments while offline: cash and card-on-terminal always work; online tenders queue.
- 72 h autonomy target: menu + config cached; clock-skew guarded by server time on reconnect.

## 8. Deployment & environments

- **Envs:** dev (docker-compose) → staging (k8s, prod parity, synthetic tenants) → prod.
- **CI (GitHub Actions):** lint → typecheck → unit → integration (ephemeral Postgres/Redis/
  RabbitMQ services) → e2e (Playwright) → build images → scan (Trivy) → push ECR.
- **CD:** ArgoCD GitOps; progressive rollout (25/50/100) with automatic rollback on SLO burn;
  DB migrations run as pre-deploy job, always backward-compatible (expand → migrate → contract).
- **Observability:** RED metrics per route + domain metrics (orders/s, settle latency, event
  lag) → Prometheus/Grafana; Sentry with tenant tag; OTel tracing across HTTP → bus → consumer.

## 9. Disaster recovery

- Postgres: multi-AZ primary, PITR (WAL to S3, 35 d), cross-region replica. **RPO ≤ 5 min,
  RTO ≤ 1 h** via promoted replica + DNS failover.
- RabbitMQ/Redis: rebuilt from infra-as-code; events replay from outbox; caches rehydrate.
- S3: versioned + cross-region replication.
- Quarterly game-days: region-loss restore drill measured against RPO/RTO; runbooks in repo.
- Tenant-level export: any tenant can export full data (JSONL + CSV) at any time.

## 10. Repository & code structure

```
apps/api/src/
  main.ts, app.module.ts
  common/            guards, decorators, filters, interceptors, tenant-context, pagination
  modules/
    identity/        auth/, users/, roles/, audit/
    organization/    companies/, brands/, locations/, outlets/, tables/, terminals/, stores/
    catalog/         items/, categories/, modifiers/, price-lists/
    inventory/       stock/, transfers/, adjustments/, counts/, batches/
    procurement/     vendors/, purchase-requests/, purchase-orders/, grn/, invoices/
    pos/             orders/, kots/, payments/, cash-sessions/
    hotel/           rooms/, reservations/, stays/, folios/, housekeeping/
    production/      recipes/, production-orders/
    accounting/      accounts/, journals/, taxes/, banking/, periods/
    crm/             customers/, loyalty/, campaigns/
    hr/              employees/, attendance/, payroll/
    reporting/       dashboards/, reports/
    integrations/    payments/, aggregators/, messaging/, webhooks/
  events/            event bus, outbox relay, consumer base classes
apps/web/src/
  app/               Next.js App Router — route groups per module
  components/        design system (ui/) + module components
  lib/               api client, auth, realtime, stores
packages/database/   prisma schema, migrations, seed
packages/shared/     permission catalog, enums, DTO types, utilities
```

Each NestJS module = bounded context: `domain/` (entities, domain services, events),
`application/` (use-case services, DTOs), `infrastructure/` (Prisma repositories),
`presentation/` (controllers). Dependencies point inward (Clean Architecture); cross-context
imports are lint-banned except `@aureus/shared` and published context APIs.
