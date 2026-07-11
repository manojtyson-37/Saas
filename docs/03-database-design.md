# Aureus — Database Design

**Version** 1.0 · Source of truth: [`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma)

---

## 1. Conventions

- **PostgreSQL 16**, accessed via Prisma. All ids are **UUID v7** (time-ordered → index-friendly).
- Every tenant-owned table has `tenant_id` (indexed, part of RLS policy). Child tables carry it
  denormalized — never rely on joins for isolation.
- Money is `DECIMAL(14,4)` plus `currency` (ISO 4217) at document level; quantities
  `DECIMAL(14,4)`; tax rates `DECIMAL(6,3)`.
- Soft delete (`deleted_at`) only on master data (items, customers, vendors); **documents are
  never deleted** — they are cancelled/reversed with status + reversing entries.
- Timestamps `TIMESTAMPTZ`; business dates use the **location's timezone**; documents also store
  `business_date` (the operational day, which rolls at the outlet's day-close, not midnight).
- Append-only tables: `stock_ledger`, `journal`/`journal_line`, `audit_log`, `wallet_ledger`,
  `loyalty_ledger`, `vendor_ledger`. Balances are derived and cached in summary tables.
- High-volume tables (`pos_order`, `pos_order_item`, `stock_ledger`, `journal_line`,
  `audit_log`) are range-partitioned by month in production (managed by migration SQL, invisible
  to Prisma).
- Document numbering: `document_sequence` table (per tenant + company + doc type + fiscal year
  + optional terminal block) allocated with `SELECT … FOR UPDATE`; POS terminals pre-allocate
  blocks for offline operation.

## 2. Domain clusters

### 2.1 Organization & identity

```mermaid
erDiagram
    TENANT ||--o{ COMPANY : has
    TENANT ||--o{ USER : has
    TENANT ||--o{ ROLE : defines
    COMPANY ||--o{ BRAND : operates
    COMPANY ||--o{ LOCATION : owns
    BRAND ||--o{ LOCATION : "branded as"
    LOCATION ||--o{ OUTLET : contains
    LOCATION ||--o{ STORE : contains
    LOCATION ||--o{ KITCHEN_STATION : contains
    OUTLET ||--o{ FLOOR : has
    FLOOR ||--o{ DINING_TABLE : has
    OUTLET ||--o{ POS_TERMINAL : has
    USER ||--o{ USER_ROLE_ASSIGNMENT : holds
    ROLE ||--o{ USER_ROLE_ASSIGNMENT : "granted via"
    ROLE ||--o{ ROLE_PERMISSION : contains
    USER_ROLE_ASSIGNMENT }o--|| LOCATION : "scoped to (optional)"
    TENANT ||--o{ MODULE_SUBSCRIPTION : activates
```

Key decisions:
- `Role` has `is_system` (seeded catalog: Owner, Finance, Cashier, …) vs. custom roles.
  Permissions are strings from the shared **permission catalog** (`resource:action`), stored in
  `role_permission` — no permission table to migrate when features ship; catalog is code +
  validated at startup.
- `UserRoleAssignment` = (user, role, scope) where scope is tenant-wide, a company, or a
  location. Effective permission = union of assignments; data visibility = union of scoped
  locations.
- `PosTerminal` holds a device fingerprint + registration token; staff PIN login creates a
  terminal-bound short session.

### 2.2 Catalog & recipes

```mermaid
erDiagram
    CATEGORY ||--o{ MENU_ITEM : groups
    MENU_ITEM ||--o{ MENU_ITEM_VARIANT : "sized as"
    MENU_ITEM ||--o{ ITEM_MODIFIER_GROUP : offers
    MODIFIER_GROUP ||--o{ MODIFIER : contains
    PRICE_LIST ||--o{ PRICE_LIST_ITEM : prices
    OUTLET ||--o{ OUTLET_MENU : publishes
    MENU_ITEM ||--o| RECIPE : "costed by"
    RECIPE ||--o{ RECIPE_INGREDIENT : consumes
    RECIPE_INGREDIENT }o--|| INVENTORY_ITEM : "of"
    RECIPE_INGREDIENT }o--o| RECIPE : "or sub-recipe"
    RECIPE ||--o{ RECIPE_VERSION : versioned
```

- **MenuItem (sellable) is separate from InventoryItem (stockable).** A menu item maps to stock
  either directly (bottled drink → `inventory_item_id`) or through a `Recipe` (BOM). Recipes
  nest via sub-recipes; `yield_qty`/`yield_uom` handles batch prep; versions freeze
  ingredient+cost history.
- Pricing: base price on variant; `PriceList` overrides per outlet/channel/day-part
  (happy hour = time-windowed price list with priority).

### 2.3 Inventory & procurement

```mermaid
erDiagram
    INVENTORY_ITEM ||--o{ ITEM_UOM_CONVERSION : converts
    STORE ||--o{ STOCK_SUMMARY : holds
    INVENTORY_ITEM ||--o{ STOCK_SUMMARY : "summarized in"
    INVENTORY_ITEM ||--o{ STOCK_BATCH : "batched as"
    STOCK_LEDGER }o--|| INVENTORY_ITEM : moves
    STOCK_LEDGER }o--|| STORE : "in/out of"
    STOCK_TRANSFER ||--o{ STOCK_TRANSFER_LINE : contains
    STOCK_COUNT ||--o{ STOCK_COUNT_LINE : records
    VENDOR ||--o{ PURCHASE_ORDER : receives
    PURCHASE_REQUEST ||--o{ PURCHASE_REQUEST_LINE : contains
    RFQ ||--o{ RFQ_VENDOR_QUOTE : compares
    PURCHASE_ORDER ||--o{ PURCHASE_ORDER_LINE : contains
    PURCHASE_ORDER ||--o{ GOODS_RECEIPT : "fulfilled by"
    GOODS_RECEIPT ||--o{ GOODS_RECEIPT_LINE : contains
    GOODS_RECEIPT_LINE }o--o| STOCK_BATCH : creates
    PURCHASE_INVOICE ||--o{ PURCHASE_INVOICE_LINE : bills
    VENDOR ||--o{ VENDOR_LEDGER : "account of"
```

- **`stock_ledger` is the single source of stock truth**: one row per movement with
  `movement_type` (opening, purchase, transfer_in/out, production_in/out, sale_consumption,
  adjustment, waste, count_variance), qty (+/−), `unit_cost`, batch, and a polymorphic source
  document reference. `stock_summary` (store × item → on-hand, avg cost) is maintained
  transactionally with each ledger insert for O(1) reads.
- Valuation: weighted-average maintained on `stock_summary`; FIFO cost layers derivable from
  batches; method configured per company.
- 3-way match: `purchase_invoice_line` references PO line + GRN line; posting validates
  qty/price tolerances from procurement settings.

### 2.4 POS & sales

```mermaid
erDiagram
    POS_ORDER ||--o{ POS_ORDER_ITEM : contains
    POS_ORDER_ITEM ||--o{ POS_ORDER_ITEM_MODIFIER : with
    POS_ORDER ||--o{ KOT : fires
    KOT ||--o{ KOT_ITEM : lists
    POS_ORDER ||--o{ POS_PAYMENT : "settled by"
    POS_ORDER }o--o| DINING_TABLE : "seated at"
    POS_ORDER }o--o| CUSTOMER : for
    POS_ORDER }o--o| HOTEL_FOLIO : "charged to"
    CASH_SESSION ||--o{ POS_PAYMENT : reconciles
    CASH_SESSION ||--o{ CASH_MOVEMENT : records
    POS_ORDER ||--o{ ORDER_DISCOUNT : applies
```

- Order lifecycle: `draft → placed → in_kitchen → served → billed → settled | cancelled`;
  every status transition audited. Bills can split: child orders reference `parent_order_id`.
- `pos_payment` supports multiple tenders per order (mode, amount, reference, gateway payload,
  tip); `room_charge` mode links to a hotel folio; `credit` posts to customer receivable.
- Aggregator orders land as `pos_order` with `channel` + `external_ref` + commission fields.

### 2.5 Hotel

```mermaid
erDiagram
    ROOM_TYPE ||--o{ ROOM : classifies
    ROOM_TYPE ||--o{ RATE_PLAN : "priced by"
    RESERVATION ||--o{ RESERVATION_ROOM : books
    RESERVATION }o--|| GUEST_PROFILE : by
    RESERVATION ||--o| STAY : "becomes on check-in"
    STAY ||--|| HOTEL_FOLIO : accrues
    HOTEL_FOLIO ||--o{ FOLIO_CHARGE : itemizes
    HOTEL_FOLIO ||--o{ FOLIO_PAYMENT : "settled by"
    ROOM ||--o{ HOUSEKEEPING_TASK : cleaned_by
```

- Folio charges are polymorphic (room night, POS order, mini-bar, laundry, spa); night audit job
  posts room-night charges + rolls business date.

### 2.6 Accounting

```mermaid
erDiagram
    CHART_OF_ACCOUNT ||--o{ CHART_OF_ACCOUNT : parent
    JOURNAL ||--o{ JOURNAL_LINE : contains
    JOURNAL_LINE }o--|| CHART_OF_ACCOUNT : posts_to
    TAX_GROUP ||--o{ TAX_COMPONENT : "e.g. CGST+SGST"
    FISCAL_YEAR ||--o{ ACCOUNTING_PERIOD : divides
    BANK_ACCOUNT ||--o{ BANK_TRANSACTION : records
    BANK_TRANSACTION }o--o| JOURNAL_LINE : reconciles
```

- Journals carry `source_type`/`source_id` (pos_order, purchase_invoice, payroll_run,
  depreciation, manual) → full drill-down. Posting rules per event type map to configurable
  account slots (e.g. "Food revenue", "Input GST") so tenants can remap without code.
- `accounting_period.status = open|closed|locked` gates postings by `business_date`.

## 3. Integrity rules enforced in the database

- `CHECK` constraints: non-negative payments, journal line has exactly one of debit/credit > 0,
  stock summary qty consistency deferred to app+test (negatives allowed only where store setting
  permits).
- Uniques: `(tenant_id, company_id, doc_type, fiscal_year, number)` on documents;
  `(tenant_id, code)` on masters; partial uniques exclude soft-deleted rows.
- FKs are always intra-tenant; composite FKs `(tenant_id, id)` on the hottest paths make
  cross-tenant references unrepresentable.
- RLS policies on all tenant tables: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
