# Aureus — Hospitality ERP Platform

**One platform to run your entire hospitality business — from procurement to accounting.**

Aureus is a modular, multi-tenant SaaS ERP for the hospitality industry: hotels, restaurants,
fine dining, cafés, coffee shops, bakeries, cloud kitchens, pubs, bars, breweries, QSR chains,
food courts, multi-brand groups, franchises, and catering businesses.

It competes with Oracle Simphony, Petpooja, Posist, Toast POS, Lightspeed, Square,
Zoho Inventory, Restaurant365, SAP Business One, and MarginEdge — by unifying what those
products do separately into one coherent, real-time system.

## Why Aureus

Hospitality operators today run their business across 6–10 disconnected tools and a pile of
spreadsheets. Aureus replaces all of it:

| You know, in real time | Powered by |
|---|---|
| Revenue | POS, online orders, banquets, room revenue |
| Expenses | Procurement, payroll, expense capture |
| Profit | Live P&L from the built-in accounting ledger |
| Inventory | Recipe-driven perpetual inventory across every location |
| Food cost | Theoretical vs. actual costing per outlet, per dish |
| Employee performance | Attendance, sales-per-server, shift analytics |
| Purchases | PR → RFQ → PO → GRN → invoice, three-way matched |
| Taxes | GST/VAT-aware ledger with filing-ready reports |
| Cash flow | Cash sessions, bank recon, receivables/payables |

## Modular by design

Customers subscribe only to the modules they use. Every module shares one org model,
one ledger, one inventory truth, one identity system.

```
Core (always on)      Organization · Users & RBAC · Audit · Notifications
Revenue               POS · Online Ordering · QR Ordering · Banquets & Catering
Hotel                 Reservations · Front Desk · Housekeeping · Room Service
Supply                Inventory · Procurement · Recipes & Production · Bar Management
Back Office           Accounting · HR & Payroll · Assets & Maintenance
Growth                CRM & Loyalty · Marketing Automation
Intelligence          Dashboards · Reports · AI Forecasting & Insights
```

## Monorepo layout

```
apps/
  api/            NestJS modular monolith (module-per-bounded-context, extractable to services)
  web/            Next.js 14 app — back office, POS, KDS, dashboards
packages/
  database/       Prisma schema, migrations, seed
  shared/         Shared types, permission catalog, constants, utilities
docs/             PRD, architecture, database design, API spec, permission matrix,
                  design system, roadmap, testing/security/DR strategy
infra/            docker-compose for local dev, k8s manifests
```

## Quick start (local development)

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d   # postgres + redis + rabbitmq
pnpm --filter @aureus/database db:migrate
pnpm --filter @aureus/database db:seed
pnpm dev                                            # api :4000, web :3000
```

## Documentation

| Doc | Contents |
|---|---|
| [docs/01-prd.md](docs/01-prd.md) | Product requirements, personas, user stories, module scope |
| [docs/02-architecture.md](docs/02-architecture.md) | System architecture, multi-tenancy, scalability, service map |
| [docs/03-database-design.md](docs/03-database-design.md) | Schema design decisions, ER diagrams |
| [docs/04-api-specification.md](docs/04-api-specification.md) | API conventions, versioning, endpoint catalog |
| [docs/05-permission-matrix.md](docs/05-permission-matrix.md) | Roles × permissions matrix, RBAC model |
| [docs/06-design-system.md](docs/06-design-system.md) | UI foundations, tokens, components, screen specs |
| [docs/07-roadmap.md](docs/07-roadmap.md) | Phased roadmap, sprint plan, testing/deployment/security/DR strategy |

## Tech stack

**Frontend** Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion
**Backend** NestJS · PostgreSQL · Prisma · Redis · RabbitMQ
**Infra** Docker · Kubernetes · GitHub Actions · AWS S3/CloudFront
**Observability** Prometheus · Grafana · Sentry
