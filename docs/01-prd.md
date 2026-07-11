# Aureus — Product Requirements Document

**Version** 1.0 · **Status** Approved for build · **Owner** Product

---

## 1. Problem

Hospitality businesses run on fragmented software. A typical multi-outlet restaurant group uses a
POS, a separate inventory tool, spreadsheets for recipes and food cost, an accounting package that
receives data weeks late, WhatsApp for purchase orders, and manual registers for attendance. Hotels
add a PMS, channel manager, and housekeeping sheets on top. Consequences:

- **Owners fly blind.** Profit is known 30–45 days after month end, if at all.
- **Food cost leaks 3–8 % of revenue** through unmeasured wastage, pilferage, and un-costed recipes.
- **Data is re-entered 3–5 times** (POS → spreadsheet → accountant → GST filing).
- **Nothing reconciles.** POS sales ≠ bank deposits ≠ ledger ≠ tax filings.

## 2. Vision

One platform where **every operation happens inside the system**, so that the owner knows
**revenue, expenses, profit, inventory, food cost, employee performance, purchases, taxes, and
cash flow in real time** — for one café or a 500-outlet franchise chain.

## 3. Goals & non-goals

### Goals
1. Fully replace spreadsheets for the 15 workflows in §6.
2. Real-time single source of truth: every sale, purchase, and stock movement posts to inventory
   and the ledger the moment it happens.
3. Modular commercial packaging — customers pay only for the modules they activate.
4. Serve every hospitality format (hotel → cart) with one data model, configured not forked.
5. Enterprise scale: 100 000+ locations, millions of orders/day, thousands of concurrent terminals.

### Non-goals (v1)
- Building our own payment processing (we integrate gateways).
- Channel management / OTA distribution for hotels (integrate, don't build).
- Native mobile POS apps (v1 ships responsive PWA; native follows).
- Manufacturing ERP beyond kitchen production (no discrete manufacturing).

## 4. Personas

| Persona | Cares about | Primary surface |
|---|---|---|
| **Owner / Director** | Profit, cash, theft, expansion | Owner dashboard, mobile |
| **Finance / Accounts** | Ledger accuracy, tax, payables | Accounting module |
| **Operations Manager** | Sales, staffing, SLAs across outlets | Ops dashboard |
| **Purchase Manager** | Vendor prices, PO discipline, GRN accuracy | Procurement |
| **Kitchen Manager / Chef** | Recipes, prep, yield, KOT flow | Kitchen dashboard, KDS |
| **Store / Inventory Manager** | Stock accuracy, transfers, expiry | Inventory |
| **Cashier / Captain / Waiter** | Fast billing, table state, tips | POS |
| **Bartender** | Peg-level pours, bottle tracking | Bar POS |
| **Front Desk (hotel)** | Reservations, check-in/out, folios | Front desk console |
| **Housekeeping** | Room status board, task queue | Housekeeping app |
| **HR** | Attendance, payroll, compliance | HR module |
| **Franchisor HQ** | Brand consistency, royalty, benchmarks | Group analytics |
| **Vendor (external)** | POs, delivery schedule, payments | Vendor portal |
| **Auditor (external)** | Read-only verified records | Audit access |

## 5. Tenancy & organization model

A **Tenant** (customer account) owns a hierarchy:

```
Tenant
└── Company (legal entity — GST/tax registration, books of account)
    └── Brand (consumer-facing concept; a company can run many brands)
        └── Location (physical site: hotel, restaurant, cloud kitchen, warehouse, HQ)
            ├── Outlet (revenue center: restaurant, bar, bakery counter, room-service, banquet)
            │   ├── Floor → Table (dine-in)
            │   └── POS Terminal
            ├── Kitchen / Prep station
            └── Store (inventory-holding location: main store, kitchen store, bar store)
```

Every business format maps onto this without schema changes: a standalone café is one
company/brand/location/outlet; a hotel is a location with room inventory plus several outlets; a
franchise chain is many companies (franchisee entities) sharing one brand.

## 6. Module requirements

Modules are independently activatable per tenant. Core (①②) is always on.

### ① Organization (core)
Multi-company, multi-brand, multi-location hierarchy per §5; tables & floor plans; POS terminal
registry; stores & warehouses; kitchens & prep stations; fiscal-year and tax-registration setup
per company; module activation & subscription state.

### ② Users & Access (core)
System roles (Super Admin, Owner, Director, Finance, Operations Manager, Purchase Manager,
Kitchen Manager, Chef, Captain, Cashier, Waiter, Bartender, Inventory Manager, Store Manager,
Accounts, HR, Vendor, Auditor) + unlimited custom roles. Permission model is
`resource:action` grants with location/company scoping (see doc 05). PIN login for POS staff,
email+password+2FA for back office, SSO (SAML/OIDC) for enterprise. Full audit log of every
mutating action.

### ③ POS
Order types: dine-in (table service), takeaway, delivery, online, QR self-ordering, phone,
WhatsApp. Table lifecycle: seat → order → courses/KOT → bill → settle; split bill (by item /
equal / custom), merge tables, transfer table/waiter. Pricing: menu per outlet + day-part
(happy hour), item modifiers, combos. Discounts: coupons, percentage/amount, manager-approved
overrides. Tenders: cash, card, UPI, wallet, gift card, loyalty points, customer credit (house
account), room charge (hotel folio), advance/deposit redemption; partial & split payments; tips
(pooled or per-server). Offline-first terminal: continues billing through network loss, syncs
with conflict-safe order ledger. Cash management: shift open/close, cash drops, expected vs.
counted (over/short). Fiscal/GST-compliant invoice numbering per company.

### ④ Hotel (PMS)
Room types, rate plans, dynamic/seasonal pricing; reservations (direct, corporate, travel-agent
with commission); check-in/out, folio per stay with room, F&B (room charge from POS), mini-bar,
laundry, spa/gym charges; housekeeping room-status board (dirty/clean/inspected/OOO) and task
management; guest profiles & stay history; group/corporate bookings; night audit; occupancy,
ADR, RevPAR reporting.

### ⑤ Inventory
Item master with categories (raw, semi-finished, finished, packaging, bar/liquor, hotel supplies,
cleaning, stationery, assets), multiple UoMs with conversions, barcode/SKU. Multi-store perpetual
stock; opening stock, transfers (with in-transit state), adjustments (waste, pilferage, damage —
reason-coded), cycle counts & physical verification with variance posting. Batch & expiry
tracking; valuation FIFO / weighted-average (LIFO supported for reporting jurisdictions that
allow it). Reorder levels & par stock per store; low-stock and expiry alerts. Dead-stock,
slow-moving, ABC & FSN analyses.

### ⑥ Procurement
Vendor master with ratings, price lists, and item catalogs; purchase requests → RFQ → quotation
comparison → purchase order (approval workflow by amount) → goods receipt (partial receipts,
QC reject) → purchase invoice with 3-way match → debit/credit notes → vendor payments & ledger &
statements. Landed cost allocation. Auto-PO suggestions from reorder levels and forecast.

### ⑦ Kitchen & Production
Recipe/BOM with ingredients, sub-recipes, yield %, portion size, prep instructions, allergens;
recipe versioning with cost history; theoretical cost auto-updated from purchase prices.
Production orders for batch prep (bakery, commissary, brewery) converting raw → semi/finished
stock. KOT routing by prep station; Kitchen Display System with course/ticket timing, bump/recall,
delay alerts; live kitchen dashboard.

### ⑧ Bar
Liquor inventory at bottle + peg level (bottle opened → tracked by remaining volume); pour sizes
per brand; cocktail recipes drawing pegs/mixers; bottle sales vs. peg sales; wastage/spillage
recording; bar variance report (poured vs. sold); excise/liquor-authority reports per
jurisdiction; happy-hour price schedules.

### ⑨ Sales channels
Native: POS, QR ordering, direct website ordering, phone, WhatsApp. Aggregators: Swiggy, Zomato,
Uber Eats via integration (menu sync, order ingestion, auto-accept rules, reconciliation of
commissions). B2B: corporate sales, catering & banquet quotations → event orders → billing.

### ⑩ CRM & Loyalty
Unified customer profile across outlets/brands (phone-first identity); visit & spend history;
wallet (stored value), gift cards; points-based loyalty with tier rules; offers & coupons engine;
campaign builder (segment → message via WhatsApp/SMS/email) with birthday/anniversary automation;
feedback capture.

### ⑪ Accounting
Double-entry ledger. Chart of accounts (template per country, customizable); auto-posting rules:
every POS settlement, purchase invoice, GRN accrual, payroll run, depreciation, and stock
adjustment creates a journal automatically; manual journals with maker-checker. GST/VAT: tax
codes on items & vendors, input credit tracking, GSTR-1/3B-ready exports; TDS on vendor payments.
Receivables (corporate/house accounts) & payables with aging; bank accounts, deposits, and
reconciliation (statement import + rule-based matching). Reports: P&L (by company/brand/outlet),
balance sheet, trial balance, cash flow, budgets vs. actuals. Period close & locking. Export to
Tally/Zoho Books/QuickBooks/Xero.

### ⑫ HR & Payroll
Employee records & documents; shift scheduling & roster; attendance (biometric integration, PIN,
geo-fenced mobile punch); leave types & approvals; payroll with earnings/deductions, statutory
components (PF/ESI/PT for India template), payslips; performance snapshots (sales per server,
attendance score); basic hiring pipeline.

### ⑬ Assets & Maintenance
Asset register (kitchen equipment, furniture, IT, vehicles) with location assignment; depreciation
schedules posting to ledger; AMC contracts with renewal alerts; maintenance tickets & preventive
schedules.

### ⑭ Reports & Dashboards
Role-scoped dashboards: Owner, Operations, Kitchen, Finance, Inventory, HR, Sales — realtime via
event stream. Report library: sales (by outlet/item/category/hour/channel/server), food cost &
COGS (theoretical vs. actual), inventory valuation & movement, vendor performance & purchase
analysis, cash & settlement, profitability (dish/outlet/brand), tax, hotel (occupancy/ADR/
RevPAR), employee. Every report exportable (CSV/XLSX/PDF) and schedulable via email.

### ⑮ AI & Intelligence
Demand forecasting per item/outlet (weather, day-of-week, events); purchase-quantity prediction
feeding auto-PO; anomaly detection (voids, discounts, refunds, stock variance patterns → fraud
signals); recipe-cost optimization suggestions; natural-language analytics ("what was my food
cost in March vs April?"); AI assistant with voice input; revenue prediction; customer-churn and
CLV insights.

### ⑯ Integrations
Payments: Stripe, Razorpay, Cashfree, PhonePe, Google Pay / UPI intent. Hardware: receipt &
kitchen printers (ESC/POS), barcode/QR scanners, cash drawers, weighing scales, biometric
devices, door locks (hotel). Aggregators: Swiggy, Zomato, Uber Eats. Accounting export: Tally,
Zoho Books, QuickBooks, Xero. Messaging: WhatsApp Business, SMS, email. GST filing APIs. Google
Maps (delivery zones). Open REST API + webhooks for everything.

## 7. Representative user stories (acceptance-level)

1. **Owner** — "As an owner I see today's revenue, food cost %, and cash position across all my
   outlets on one screen, updated within 5 seconds of any sale." ✔ when dashboard reflects a POS
   settlement ≤ 5 s after tender, and food cost uses recipe-deducted consumption.
2. **Cashier** — "I can split a 6-cover bill 3 ways by seat, take two cards and one UPI, and add a
   tip, in under 30 seconds, even if the internet is down." ✔ offline queue settles and syncs
   without duplicate invoice numbers.
3. **Purchase manager** — "A PO over ₹50 000 requires my approval; the GRN can't exceed PO
   quantity + tolerance; the invoice won't post unless it 3-way matches." ✔ enforced by workflow
   engine, override requires permission + reason, all audited.
4. **Chef** — "When I sell a Margherita, the system deducts 180 g dough, 80 g mozzarella, 70 g
   sauce from the kitchen store automatically." ✔ recipe-based deduction at KOT fire or
   settlement (configurable), visible in stock ledger.
5. **Front desk** — "A guest charges dinner to Room 204; it appears on their folio instantly and
   on checkout the folio settles to one card payment; F&B revenue still books to the restaurant
   outlet." ✔ cross-module posting with correct revenue attribution.
6. **Finance** — "I close March: the system blocks back-dated entries, gives me P&L per outlet,
   GSTR-1 export, and every number drills down to source documents." ✔ period lock + drill-down
   from statement line → journal → source doc.
7. **Franchisor** — "I push a menu-price update to 120 franchisee outlets at 00:00, and see
   royalty (5 % of net sales) accrue per franchisee monthly." ✔ scheduled menu publish + royalty
   accrual journals.
8. **Bartender** — "Opening a new Chivas bottle records it; the variance report shows I poured
   34 pegs but billed 31." ✔ bottle lifecycle + variance report.

## 8. Cross-cutting requirements

| Concern | Requirement |
|---|---|
| **Multi-tenancy** | Strict row-level isolation by `tenant_id` on every table; RLS in Postgres as defense-in-depth; dedicated-database option for enterprise tier |
| **Performance** | POS order commit p95 < 150 ms; dashboard queries p95 < 500 ms; report generation async beyond 5 s |
| **Availability** | 99.95 % for POS-critical APIs; POS terminals fully functional offline ≥ 72 h |
| **Scale** | 100 000+ locations; 10 M orders/day; 50 k concurrent terminals; horizontal scale on stateless API |
| **Security** | OWASP ASVS L2; encryption at rest & transit; PCI-DSS scope minimized via gateway tokenization; SOC 2 roadmap |
| **Audit** | Immutable audit trail of all mutations (who/what/when/before/after) |
| **Localization** | Multi-currency, multi-timezone (per location), i18n-ready UI, country tax templates (India GST first, VAT next) |
| **Data** | Tenant data export at any time; 35-day PITR backups; DR RPO ≤ 5 min, RTO ≤ 1 h |

## 9. Commercial packaging

| Plan | Modules | Target |
|---|---|---|
| **Starter** | Core + POS + basic inventory + dashboards | Single café/QSR |
| **Growth** | + Procurement, Recipes/Production, CRM, HR-lite | 2–10 outlets |
| **Pro** | + Accounting, Bar, full HR/Payroll, Assets, AI insights | Restaurant groups |
| **Hotel** | Pro + PMS/Hotel module | Hotels & resorts |
| **Enterprise** | Everything + SSO, dedicated DB, SLA, franchise/HQ analytics | Chains & franchisors |

Billing: per-location per-month, module add-ons, terminal count bands. 14-day full-feature trial.

## 10. Success metrics

- Time-to-first-sale after signup < 30 minutes (self-serve onboarding).
- ≥ 90 % of active tenants use ≥ 3 modules by day 90 (platform stickiness).
- Food-cost variance (theoretical vs. actual) surfaced for 100 % of recipe-enabled tenants.
- Month-end close time for accounting tenants reduced to < 3 days.
- POS uptime ≥ 99.95 %; offline-mode sale loss = 0.
