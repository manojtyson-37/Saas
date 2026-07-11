# Aureus — API Specification

**Version** 1.0 · Live OpenAPI: `GET /api/docs` (Swagger UI) · `GET /api/docs-json`

---

## 1. Conventions

- Base URL `https://api.aureus.app/api/v1` (URI versioning; v1 stable, additive changes only).
- JSON everywhere; `snake_case` is not used — payloads are `camelCase`.
- **Auth:** `Authorization: Bearer <accessToken>` (JWT, 10 min TTL). Refresh via
  `POST /auth/refresh` with rotating httpOnly cookie. POS terminals authenticate with a device
  token + staff PIN → terminal-scoped session token.
- **Tenancy:** tenant is derived from the token — never from the payload. Location scoping via
  the caller's role assignments; list endpoints accept `locationId`/`companyId` filters that are
  intersected with the caller's grants.
- **Idempotency:** all money/stock mutating POSTs accept `Idempotency-Key` header; replays
  return the original result with `Idempotent-Replayed: true`.
- **Pagination:** cursor-based — `?limit=50&cursor=…` → `{ data, meta: { nextCursor, total? } }`.
- **Filtering/sort:** documented per endpoint; `?sort=-createdAt,name`.
- **Errors (RFC 7807-style):**

```json
{
  "statusCode": 422,
  "error": "ValidationError",
  "message": "quantity must be positive",
  "code": "INVENTORY_QTY_INVALID",
  "details": [{ "field": "lines[2].quantity", "issue": "min", "min": 0.0001 }],
  "traceId": "b1f4…"
}
```

- **Webhooks:** tenant-configurable endpoints per event type; HMAC-SHA256 signature header
  `X-Aureus-Signature`; at-least-once with exponential retry (1m→24h), DLQ visible in UI.
- **Rate limits:** per tenant + per token; `429` with `Retry-After`. POS endpoints have a
  separate, higher budget.
- **Realtime:** WSS `/realtime` (Socket.IO), rooms: `orders:{outletId}`, `kds:{stationId}`,
  `tables:{outletId}`, `dashboard:{locationId}`, `housekeeping:{locationId}`.

## 2. Endpoint catalog (summary)

Every route below is guarded by a permission from the catalog (doc 05), listed in brackets.

### Auth & identity
| Method & path | Purpose |
|---|---|
| POST `/auth/register` | Create tenant + owner (signup) |
| POST `/auth/login` | Email+password (+`otp` when 2FA on) → tokens |
| POST `/auth/refresh` · POST `/auth/logout` | Rotate / revoke session |
| POST `/auth/terminal/register` | Pair a POS terminal (activation code) |
| POST `/auth/terminal/pin-login` | Staff PIN → terminal session |
| GET `/me` · PATCH `/me` · POST `/me/2fa/enable` | Profile & 2FA |
| CRUD `/users` `[identity.user:*]` · CRUD `/roles` `[identity.role:*]` | User & role management |
| POST `/users/:id/assignments` | Grant role @ scope `[identity.user:assign-role]` |
| GET `/audit-logs` `[identity.audit:read]` | Filterable audit trail |

### Organization
| Route | Purpose |
|---|---|
| CRUD `/companies` `/brands` `/locations` `/outlets` `/stores` `[organization.*]` | Hierarchy |
| CRUD `/outlets/:id/floors` `/floors/:id/tables` | Floor plans & tables |
| CRUD `/terminals` · POST `/terminals/:id/activation-code` | Terminal registry |
| GET/PUT `/settings/modules` `[organization.module:manage]` | Module activation |
| CRUD `/document-sequences` | Numbering config |

### Catalog
CRUD `/categories` `/menu-items` (variants, modifier groups nested), `/modifier-groups`,
`/price-lists` (+ `/price-lists/:id/items` bulk), POST `/outlets/:id/menu/publish`,
GET `/outlets/:id/menu` (public snapshot for POS/QR — cached).

### POS
| Route | Purpose |
|---|---|
| POST `/pos/orders` | Create order (dine-in/takeaway/delivery/QR…) `[pos.order:create]` |
| PATCH `/pos/orders/:id` · POST `/pos/orders/:id/items` | Amend open order |
| POST `/pos/orders/:id/fire` | Fire KOT(s) to stations |
| POST `/pos/orders/:id/split` · `/merge` · `/transfer` | Bill/table operations `[pos.order:split]` etc. |
| POST `/pos/orders/:id/discounts` | Apply coupon/discount `[pos.discount:apply]` |
| POST `/pos/orders/:id/bill` | Generate bill (tax computed, number allocated) |
| POST `/pos/orders/:id/payments` | Add tender(s); settles when fully paid `[pos.payment:capture]` |
| POST `/pos/orders/:id/void` | Void with reason `[pos.order:void]` |
| POST `/pos/sync` | Offline op-log batch upsert (idempotent) |
| POST `/pos/cash-sessions` `/pos/cash-sessions/:id/close` | Shift & drawer lifecycle |
| GET `/pos/tables?outletId=` | Live table map |
| KDS: GET `/kds/tickets?stationId=` · POST `/kds/tickets/:id/bump|recall` | Kitchen display |

### Hotel
CRUD `/hotel/room-types` `/hotel/rooms` `/hotel/rate-plans`;
GET `/hotel/availability?from&to&roomTypeId`;
POST `/hotel/reservations` (+ PATCH, cancel) · POST `/hotel/reservations/:id/check-in` →
creates stay+folio · POST `/hotel/stays/:id/check-out`;
POST `/hotel/folios/:id/charges` (mini-bar, laundry, spa; POS posts room-charges internally);
POST `/hotel/folios/:id/payments`; housekeeping: GET `/hotel/housekeeping/board`,
POST `/hotel/housekeeping/tasks` (+ status transitions); POST `/hotel/night-audit/run`.

### Inventory
CRUD `/inventory/items` `/inventory/uoms`; GET `/inventory/stock?storeId&itemId` (summary) and
`/inventory/stock-ledger` (movements); POST `/inventory/opening-stock`;
POST `/inventory/transfers` → `/dispatch` → `/receive` (in-transit tracked);
POST `/inventory/adjustments` (waste/pilferage/damage, reason-coded) `[inventory.adjustment:create]`;
POST `/inventory/counts` → `/inventory/counts/:id/post` (variance → adjustments);
GET `/inventory/alerts` (low stock, expiry); GET `/inventory/analysis/abc|fsn|dead-stock`.

### Procurement
CRUD `/vendors` (+ `/vendors/:id/ledger` `/statement`); POST `/purchase-requests` (+ approve);
POST `/rfqs` (+ `/rfqs/:id/quotes`, GET comparison); POST `/purchase-orders` → `/approve`
(workflow by amount) → `/send`; POST `/goods-receipts` (against PO, partials, QC)
→ `/post` (stock in + accrual journal); POST `/purchase-invoices` → `/post` (3-way match);
POST `/debit-notes` `/credit-notes`; POST `/vendor-payments` (TDS aware);
GET `/procurement/suggestions` (reorder + forecast driven).

### Production
CRUD `/recipes` (ingredients, sub-recipes, yield; `/recipes/:id/versions`, `/cost` breakdown);
POST `/production-orders` → `/complete` (consumes raw, produces finished at computed cost).

### Bar
POST `/bar/bottles/:id/open`; GET `/bar/bottles?status=open`; POST `/bar/pours/waste`;
GET `/bar/variance?outletId&from&to`; GET `/bar/excise-report`.

### CRM
CRUD `/customers` (+ history `/customers/:id/timeline`); wallet: POST `/customers/:id/wallet/load`
`/wallet/redeem` (ledgered); loyalty: GET `/loyalty/program` PUT rules, auto accrual/redeem via
POS; CRUD `/campaigns` (+ `/campaigns/:id/send`), CRUD `/coupons`; CRUD `/gift-cards` (+ redeem).

### Accounting
CRUD `/accounting/accounts` (CoA tree); POST `/accounting/journals` (manual, maker-checker
`[accounting.journal:approve]`); GET `/accounting/ledger?accountId`;
CRUD `/accounting/tax-groups`; GET `/accounting/reports/trial-balance|pnl|balance-sheet|cash-flow`
(`?companyId&from&to&byOutlet=`); GET `/accounting/gst/gstr1|gstr3b` exports;
banking: CRUD `/accounting/bank-accounts`, POST `/bank-accounts/:id/statement-import`,
POST `/reconciliation/match`; periods: POST `/accounting/periods/:id/close|lock`;
budgets: CRUD `/accounting/budgets`; exports: POST `/accounting/exports/tally|zoho|quickbooks|xero`.

### HR
CRUD `/hr/employees` (+ documents); shifts: CRUD `/hr/shifts` `/hr/rosters`;
attendance: POST `/hr/attendance/punch` (terminal/biometric/geo), GET `/hr/attendance`;
leave: CRUD `/hr/leave-types`, POST `/hr/leave-requests` (+ approve);
payroll: POST `/hr/payroll-runs` → `/process` → `/post` (journal), GET payslips.

### Assets
CRUD `/assets` (+ assign location); GET `/assets/:id/depreciation-schedule`;
POST `/assets/depreciation/run`; CRUD `/assets/:id/amc-contracts`; CRUD `/maintenance-tickets`.

### Reporting & AI
GET `/dashboards/owner|operations|kitchen|finance|inventory|hr|sales?locationId&date`;
POST `/reports/:key/run` (async → `GET /reports/jobs/:id` → signed URL);
POST `/reports/:key/schedule`; AI: POST `/ai/query` (NL analytics), GET `/ai/forecast/demand`,
GET `/ai/suggestions/purchase`, GET `/ai/anomalies`.

### Integrations
CRUD `/webhooks` (+ deliveries log, redeliver); payment gateway config per outlet; aggregator
connections: POST `/integrations/aggregators/:provider/connect`, menu push, order webhook ingest
(`/integrations/aggregators/:provider/callback` — HMAC verified); messaging provider config.

## 3. Event catalog (webhooks & internal)

`order.placed` `order.settled` `order.voided` `kot.fired` `cash-session.closed`
`stock.low` `stock.expiring` `stock.adjusted` `transfer.received` `count.posted`
`po.approved` `grn.posted` `purchase-invoice.posted` `vendor-payment.made`
`production.completed` `bottle.opened` `stay.checked-in` `stay.checked-out` `folio.charged`
`journal.posted` `period.closed` `payroll.posted` `customer.created` `points.earned`
`campaign.sent` `anomaly.detected` `forecast.generated`

Payload envelope:

```json
{
  "id": "evt_01J…",
  "type": "order.settled",
  "tenantId": "…",
  "occurredAt": "2026-07-11T14:03:22Z",
  "data": { "orderId": "…", "outletId": "…", "grossAmount": "1240.00", "…": "…" }
}
```
