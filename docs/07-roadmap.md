# Aureus — Roadmap, Delivery & Operations Strategy

**Version** 1.0

---

## 1. Phased roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| **P0 — Foundation** (this repo, now) | Monorepo, design docs, full DB schema, identity (auth/RBAC/audit), organization hierarchy, app shell + design system, CI, local infra | Tenant signup → login → create company/brand/location/outlet → invite users with roles; CI green |
| **P1 — Sell & stock** | Catalog/menu, Inventory core (stock ledger, transfers, adjustments, counts), Procurement (vendor → PO → GRN → invoice), Recipes & costing | A café runs purchasing + stock fully in-app |
| **P2 — POS** | Full POS (dine-in/takeaway/delivery, split/merge, tenders, cash sessions), KOT/KDS, recipe-based auto-deduction, QR ordering, realtime dashboards | Live restaurant billing with live food cost |
| **P3 — Money** | Accounting (CoA, auto-posting, GST, banking/recon, P&L/BS/CF, period close), vendor payments/TDS, exports (Tally/Zoho/QB/Xero) | Month close inside the platform |
| **P4 — Hotel** | PMS: rooms/rates/reservations, front desk, folios + room-charge from POS, housekeeping, night audit | Hotel with F&B runs end-to-end |
| **P5 — People & things** | HR (attendance, shifts, leave, payroll), Assets (depreciation, AMC, maintenance) | Payroll posts to ledger |
| **P6 — Growth** | CRM, loyalty/wallet/gift cards, campaigns, aggregator integrations (Swiggy/Zomato/UberEats), WhatsApp/SMS/email | Aggregator orders reconcile automatically |
| **P7 — Intelligence** | Bar module, AI forecasting/anomalies/NL analytics, franchise HQ analytics, report scheduler | AI purchase suggestions adopted by pilot tenants |

## 2. Sprint plan (2-week sprints, P0–P2 detail)

| Sprint | Deliverables |
|---|---|
| S1 | Monorepo, CI, docker-compose, Prisma schema v1 + migrations + seed, shared permission catalog |
| S2 | Auth (signup/login/refresh/2FA), tenant context, RBAC guards, audit log, user/role CRUD |
| S3 | Organization CRUD (company→table hierarchy, terminals, stores), module activation, web app shell (nav, theming, ⌘K), login/onboarding UI |
| S4 | Catalog: items/variants/modifiers/price lists, menu publish + cached snapshot |
| S5 | Inventory: item master, stock ledger + summary, opening stock, transfers |
| S6 | Inventory: adjustments, counts, batches/expiry, alerts; analyses (ABC/FSN) |
| S7 | Procurement: vendors, PR→PO with approval workflow |
| S8 | Procurement: GRN, purchase invoice 3-way match, debit/credit notes, vendor ledger |
| S9 | Recipes/BOM + costing + versions; production orders |
| S10–13 | POS: order engine + tables + KOT/KDS → tenders/split/cash sessions → offline sync → QR ordering; recipe auto-deduction; live dashboard |

Definition of Done per story: code + unit tests + integration test + OpenAPI annotations +
permission wiring + audit coverage + docs updated.

## 3. Testing strategy

- **Unit** (Jest): domain services — pricing, tax, costing, valuation, split-bill math,
  numbering. Target ≥ 80 % on `domain/` + `application/`.
- **Integration** (Jest + Testcontainers Postgres/Redis/RabbitMQ): repository + API level per
  module; every endpoint exercised with authz matrix (allowed role / denied role / cross-tenant
  denial — **cross-tenant tests are mandatory for every table**).
- **E2E** (Playwright): golden paths — signup→sale, PO→GRN→invoice, check-in→room-charge→
  checkout, month-close. Runs on staging nightly + PR-gated smoke subset.
- **Contract**: OpenAPI schema diff check in CI (breaking-change gate); event payload schemas
  versioned & validated.
- **Load** (k6): POS order commit at 1.2 k orders/s peak profile before each release; p95
  budgets asserted.
- **Offline chaos**: sync-protocol property tests (op-log replay idempotence, invoice-number
  uniqueness under partition).

## 4. Deployment strategy

GitHub Actions: `lint → typecheck → test → build → scan → publish images → deploy`.
Environments dev → staging → prod (k8s/EKS, 3 AZ). GitOps via ArgoCD; canary 25/50/100 with
auto-rollback on SLO burn (error rate, p95). Migrations: expand→migrate→contract, backward
compatible, run as pre-deploy job with lock + timeout. Feature flags (per-tenant) gate
incomplete features; module activation doubles as commercial flagging.

## 5. Security strategy

Threat model per module at design time (STRIDE-lite). Controls: OWASP ASVS L2 checklist in PR
template for auth/money/stock code; dependency & container scanning (Dependabot + Trivy) gating
CI; secret scanning; annual external pentest + continuous internal scans; SOC 2 Type II program
from P3; PCI SAQ-A posture (gateway tokenization only); PII field encryption + DSR (export/
delete) tooling; per-tenant rate limits & anomaly alerts on auth endpoints; audit log immutable
(append-only + hash chain) with 7-year retention for financial records.

## 6. Disaster recovery plan

| Scenario | Response | Objective |
|---|---|---|
| AZ loss | Multi-AZ Postgres failover + k8s reschedule | Zero-touch, minutes |
| Region loss | Promote cross-region replica, DNS failover, replay outbox | RPO ≤ 5 min, RTO ≤ 1 h |
| Bad deploy | Argo rollback + down-migration runbook | ≤ 10 min |
| Data corruption (bug/operator) | PITR to side-instance, surgical tenant restore tooling | ≤ 4 h for affected tenants |
| Ransom/compromise | Isolated backup account (write-once S3), key rotation runbook, IR retainer | Restore from immutable backups |

Quarterly game-days test region-loss and tenant-restore; results logged against objectives.
POS terminals ride out any backend incident ≥ 72 h offline (doc 02 §7).
