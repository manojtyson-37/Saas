# Aureus — Design System & UI Specification

**Version** 1.0 · Reference implementation: `apps/web/src/components/ui` + `apps/web/src/styles`

Benchmark bar: Linear (speed, keyboard), Stripe Dashboard (data density with calm), Notion
(approachable structure), Vercel (restraint), Apple (finish). Aureus must feel like a precision
instrument, not enterprise software.

---

## 1. Foundations

### 1.1 Color tokens (CSS variables, light/dark)

Semantic tokens only — components never use raw hex.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#fafafa` | `#0a0a0b` | App canvas |
| `--surface` | `#ffffff` | `#141416` | Cards, panels |
| `--surface-raised` | `#ffffff` | `#1c1c1f` | Popovers, modals |
| `--border` | `#e7e7e9` | `#26262a` | Hairlines |
| `--foreground` | `#18181b` | `#f2f2f3` | Primary text |
| `--muted-foreground` | `#71717a` | `#9d9da6` | Secondary text |
| `--primary` | `#4f46e5` | `#6366f1` | Brand actions (indigo) |
| `--primary-foreground` | `#ffffff` | `#ffffff` | Text on primary |
| `--success` | `#0f9d58`-family `#059669` | `#34d399` | Positive states, revenue |
| `--warning` | `#d97706` | `#fbbf24` | Attention, expiry |
| `--destructive` | `#dc2626` | `#f87171` | Errors, voids |
| `--accent` | `#f4f4f5` | `#202024` | Hover fills, selected rows |

Charts use an 8-step categorical ramp derived from primary (see `dataviz` tokens in code);
financial deltas: success/destructive only.

### 1.2 Typography

- **UI face:** Inter (variable), `font-feature-settings: "cv11","ss01","tnum"` — tabular
  numerals mandatory in all tables/KPIs.
- Scale (rem): 12 caption · 13 body-sm (tables) · 14 body · 16 title-sm · 20 title ·
  28 display. Line-height 1.5 body, 1.2 titles. Weights 400/500/600 only.

### 1.3 Space, radius, elevation, motion

- 4-px spacing grid; page gutter 24; card padding 20; table row height 40 (compact 32).
- Radius: 6 controls · 10 cards · 14 modals. Full for pills/avatars.
- Elevation by border + subtle shadow (`0 1px 2px rgb(0 0 0 / .05)`); dark mode uses
  lighter-surface stacking, not shadows.
- Motion (Framer Motion): 120 ms micro (hover, press) · 200 ms overlays (scale .98→1 + fade) ·
  spring for drawers. Never animate data tables. `prefers-reduced-motion` respected.

## 2. App shell

```
┌────────┬─────────────────────────────────────────────┐
│        │ Topbar: breadcrumb · location switcher ·    │
│  Nav   │ global search (⌘K) · notifications · avatar │
│  rail  ├─────────────────────────────────────────────┤
│ 240px  │                                             │
│ (⌘\    │              Page content                   │
│ 56px)  │   max-width 1440, centered, 24px gutters    │
│        │                                             │
└────────┴─────────────────────────────────────────────┘
```

- **Nav rail:** module groups (Home, POS, Hotel, Inventory, Procurement, Kitchen, CRM,
  Accounting, HR, Assets, Reports, Settings) — only activated modules render. Collapsible to
  icons (`⌘\`). Active item: accent fill + primary left bar (2 px).
- **Context switcher** in topbar: company → brand → location; persists per user; every page is
  scoped to it.
- **Command palette (⌘K):** navigate ("Go to Purchase Orders"), act ("Create PO", "New Order",
  "Close cash session"), find records (customers, items, invoices — grouped results), and ask AI
  ("food cost last week vs prior"). Fuzzy match, recent-first, fully keyboard driven.
- **Keyboard map:** `⌘K` palette · `g then d/i/p/o` go dashboard/inventory/procurement/orders ·
  `c` create-in-context · `/` focus list filter · `esc` close · POS has its own map (below).

## 3. Core patterns

- **List pages:** toolbar (search `/`, filters as removable chips, saved views, column config,
  export) + dense data table (sticky header, sortable, row hover reveals actions, checkbox
  bulk-bar slides up from bottom). Virtualized > 200 rows. Empty states teach ("No purchase
  orders yet — create your first" + primary action).
- **Record pages:** header (title, status badge, primary/secondary actions, overflow menu) +
  two-column body (main sections / meta side rail: activity, audit, linked docs). Status
  timeline for workflow documents (PR → PO → GRN → Invoice).
- **Create/edit:** side **drawer** (480–640 px) for simple records; full page for documents with
  line items (PO, GRN, journal). Line-item editors are keyboard-first grids: `tab`/`enter`
  navigation, type-ahead item search in-cell, auto-add row.
- **Feedback:** optimistic UI with toast (bottom-right, undo where safe); destructive actions
  get a typed-confirmation dialog; inline field errors on blur; skeletons (never spinners) for
  loading; every async table shows stale-while-revalidate shimmer.
- **Numbers:** right-aligned, tabular, thousands-separated per locale; negative in destructive
  color with parentheses in finance contexts.

## 4. Module screen specs (wireframe level)

### 4.1 Owner dashboard (`/dashboard`)
- Row 1 — KPI tiles: Revenue today · Orders · Avg ticket · Food cost % · Cash position ·
  Occupancy (hotel tenants). Each: big tabular number, delta vs. same day last week
  (▲ success / ▼ destructive), sparkline (7 d).
- Row 2 — Revenue area chart (hourly, channel-stacked) 2/3 + donut "Revenue by outlet" 1/3.
- Row 3 — Live feed (settlements, voids, GRNs — realtime) 1/3 + Top items table 1/3 +
  Alerts (low stock, expiring, anomalies) 1/3.
- Date-range and location scope controls top-right; auto-refresh via WSS.

### 4.2 POS (`/pos` — tablet-first, works desktop)
- **Layout:** left = table map / order-type tabs (Dine-in · Takeaway · Delivery · Online);
  center = menu grid (category rail, search, item cards with price + veg/allergen badges);
  right = ticket panel (items, modifiers, seat tags, subtotal → taxes → total, action bar:
  Fire KOT · Bill · Pay).
- Table map: floor tabs; table shapes color-coded (free / seated / billed / needs-attention);
  long-press → merge/transfer.
- Payment sheet: tender buttons (Cash, Card, UPI, Wallet, Room, Credit, Gift card), split
  by amount/items/equal, tip entry, change calculator; settles on full allocation.
- Offline badge in header (amber "Offline — 12 ops queued"); sync state always visible.
- Keyboard/scan: barcode adds item; `F2` pay · `F4` KOT · `F8` discount (permission-gated).

### 4.3 KDS (`/kds` — dark-only, glanceable at 2 m)
Ticket columns by age (New / Cooking / Ready); ticket card = table + items + modifiers +
elapsed timer (amber > 10 m, red > 15 m); tap/`space` bumps; recall lane; station filter;
big type (18 px+), high contrast.

### 4.4 Inventory (`/inventory`)
Stock view: store switcher, table (item, category, on-hand, UoM, avg cost, value, reorder
status pill, expiry chip) with inline drill to movement ledger. Transfers: two-store picker +
line grid, status timeline (Draft → Dispatched → In-transit → Received). Counts: mobile-friendly
count sheet (search + qty entry), variance review screen (system vs counted, value impact) →
post.

### 4.5 Procurement (`/procurement`)
PO document page: vendor card, line grid (item, qty, UoM, rate, tax, amount), approval banner
("Awaiting approval — ₹82,400 exceeds your limit"), status timeline, linked GRNs/invoices in
side rail. Quote comparison: matrix vendors × items with lowest-cell highlighting.

### 4.6 Hotel front desk (`/hotel`)
Tape chart (rooms × 14 days, drag to book/move), color by status; check-in flow drawer (guest,
ID scan upload, rate confirm, deposit); folio page = ledger table + charge/payment actions;
housekeeping board = room-status kanban.

### 4.7 Accounting (`/accounting`)
CoA tree with balances; journal entry grid (account type-ahead, Dr/Cr columns, must balance to
enable Post); P&L report: expandable account groups, comparison column, every figure clickable →
ledger → source doc.

## 5. Component library (shadcn/ui base, extended)

`Button` (primary/secondary/ghost/destructive · sm/md/lg · loading) · `Input`, `NumberInput`
(right-aligned, unit suffix), `SearchInput`, `Select`/`Combobox` (async, keyboard),
`DatePicker`/`RangePicker` (fiscal presets) · `DataTable` (sort/filter/virtualize/column
config/row selection) · `LineItemGrid` · `KpiTile` · `Sparkline`/`AreaChart`/`DonutChart`
(Recharts-wrapped, token colors) · `StatusBadge` (per document state machine) ·
`Drawer`, `Dialog`, `ConfirmDialog` · `CommandPalette` · `Toast` · `EmptyState` · `Skeleton` ·
`Timeline` · `Avatar`, `Tag`, `Kbd` · `LocationSwitcher` · `PermissionGate` (renders children
only when caller holds permission).

All interactive components: visible focus ring (`--primary` 2 px offset), ARIA per WAI
patterns, WCAG 2.1 AA contrast in both themes, hit targets ≥ 40 px on touch surfaces (POS/KDS).

## 6. Responsive & theming

Breakpoints: 640 / 768 / 1024 / 1280 / 1536. Nav rail → bottom tabs under 768 (back office),
POS is tablet-native layout. Theme: system default + manual toggle, stored per user; both themes
first-class (screens designed and tested in each). Density toggle (comfortable/compact) for
data-heavy roles.
