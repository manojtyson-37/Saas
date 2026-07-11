# Aureus — RBAC Model & Permission Matrix

Source of truth: [`packages/shared/src/permissions.ts`](../packages/shared/src/permissions.ts)
(the catalog is code; this document explains the model and shows the default matrix).

---

## 1. Model

- **Permission** = `resource:action` string, e.g. `inventory.item:create`,
  `pos.order:void`, `accounting.journal:approve`. Wildcards allowed in role definitions
  (`pos.*`, `*` for Super Admin) and expanded at compile time.
- **Role** = named set of permissions. System roles are seeded and non-editable (clone to
  customize); tenants create unlimited custom roles.
- **Assignment** = (user, role, scope). Scope ∈ {tenant, company, location}. A user may hold
  multiple assignments (e.g. Finance @ Company A, Auditor @ Company B).
- **Effective access** = union of permissions across assignments, each bounded by its scope.
  Data queries always intersect with the user's permitted location set.
- **Sensitive actions** additionally require an elevated confirmation (manager PIN at POS):
  `pos.order:void`, `pos.discount:override`, `pos.payment:refund`, `inventory.adjustment:create`
  beyond threshold, price overrides.

## 2. Default system roles → permission groups

Legend: ✔ full (CRUD+workflow) · R read-only · ◐ limited (own/scoped records or capped actions)

| Permission group | Super Admin | Owner | Director | Finance | Ops Mgr | Purchase Mgr | Kitchen Mgr | Chef | Captain | Cashier | Waiter | Bartender | Inv Mgr | Store Mgr | Accounts | HR | Vendor | Auditor |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| organization.* | ✔ | ✔ | R | R | R | – | – | – | – | – | – | – | – | – | R | R | – | R |
| identity.user / role | ✔ | ✔ | ◐ | – | ◐ | – | – | – | – | – | – | – | – | – | – | ◐ | – | – |
| identity.audit | ✔ | ✔ | R | R | R | – | – | – | – | – | – | – | – | – | R | – | – | R |
| catalog.* (menu, pricing) | ✔ | ✔ | ✔ | R | ✔ | – | ◐ | R | R | R | R | R | – | – | – | – | – | R |
| pos.order (create/amend) | ✔ | ✔ | ✔ | – | ✔ | – | – | – | ✔ | ✔ | ◐ | ✔ | – | – | – | – | – | – |
| pos.order:void / discount:override | ✔ | ✔ | ✔ | – | ✔ | – | – | – | ◐ | – | – | – | – | – | – | – | – | – |
| pos.payment:capture | ✔ | ✔ | ✔ | – | ✔ | – | – | – | ✔ | ✔ | – | ✔ | – | – | – | – | – | – |
| pos.payment:refund | ✔ | ✔ | ✔ | – | ✔ | – | – | – | – | – | – | – | – | – | – | – | – | – |
| pos.cash-session | ✔ | ✔ | ✔ | R | ✔ | – | – | – | – | ✔ | – | ◐ | – | – | R | – | – | R |
| kds (bump/recall) | ✔ | ✔ | – | – | ✔ | – | ✔ | ✔ | – | – | – | – | – | – | – | – | – | – |
| hotel.reservation / frontdesk | ✔ | ✔ | ✔ | R | ✔ | – | – | – | – | – | – | – | – | – | R | – | – | R |
| hotel.housekeeping | ✔ | ✔ | ✔ | – | ✔ | – | – | – | – | – | – | – | – | – | – | – | – | – |
| inventory.item / stock (read) | ✔ | ✔ | R | R | R | R | R | R | – | – | – | R | ✔ | ✔ | R | – | – | R |
| inventory.transfer | ✔ | ✔ | – | – | ◐ | – | ◐ | – | – | – | – | – | ✔ | ✔ | – | – | – | R |
| inventory.adjustment / count | ✔ | ✔ | – | – | ◐ | – | ◐ | ◐ | – | – | – | ◐ | ✔ | ✔ | – | – | – | R |
| procurement.pr / rfq | ✔ | ✔ | ✔ | – | ✔ | ✔ | ◐ | ◐ | – | – | – | – | ✔ | ✔ | – | – | – | R |
| procurement.po:approve | ✔ | ✔ | ✔ | ◐ | ◐ | ✔ | – | – | – | – | – | – | – | – | – | – | – | – |
| procurement.grn | ✔ | ✔ | – | – | – | ✔ | – | – | – | – | – | – | ✔ | ✔ | – | – | – | R |
| procurement.invoice / vendor-payment | ✔ | ✔ | – | ✔ | – | ◐ | – | – | – | – | – | – | – | – | ✔ | – | – | R |
| procurement.vendor-portal (own POs, own ledger) | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ◐ | – |
| production.recipe | ✔ | ✔ | R | R | R | – | ✔ | ✔ | – | – | – | ◐ | R | – | – | – | – | R |
| production.order | ✔ | ✔ | – | – | ◐ | – | ✔ | ✔ | – | – | – | – | ◐ | ◐ | – | – | – | R |
| bar.* | ✔ | ✔ | R | R | ✔ | – | – | – | – | – | – | ✔ | R | R | – | – | – | R |
| crm.customer / loyalty | ✔ | ✔ | ✔ | R | ✔ | – | – | – | ◐ | ◐ | ◐ | ◐ | – | – | R | – | – | R |
| crm.campaign | ✔ | ✔ | ✔ | – | ✔ | – | – | – | – | – | – | – | – | – | – | – | – | – |
| accounting.journal (manual) | ✔ | ✔ | – | ✔ | – | – | – | – | – | – | – | – | – | – | ✔ | – | – | R |
| accounting.journal:approve / period:close | ✔ | ✔ | – | ✔ | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| accounting.reports (P&L, BS, tax) | ✔ | ✔ | R | ✔ | R | – | – | – | – | – | – | – | – | – | ✔ | – | – | R |
| accounting.banking / reconciliation | ✔ | ✔ | – | ✔ | – | – | – | – | – | – | – | – | – | – | ✔ | – | – | R |
| hr.employee | ✔ | ✔ | R | R | ◐ | – | ◐ | – | – | – | – | – | – | – | – | ✔ | – | R |
| hr.attendance / shift | ✔ | ✔ | R | – | ✔ | – | ✔ | ◐ | ◐ | ◐ | ◐ | ◐ | – | ◐ | – | ✔ | – | R |
| hr.payroll | ✔ | ✔ | – | ✔ | – | – | – | – | – | – | – | – | – | – | ◐ | ✔ | – | R |
| assets.* | ✔ | ✔ | R | ✔ | ◐ | ◐ | ◐ | – | – | – | – | – | ◐ | ◐ | ✔ | – | – | R |
| reporting.dashboard:owner | ✔ | ✔ | ✔ | ✔ | – | – | – | – | – | – | – | – | – | – | – | – | – | R |
| reporting.dashboard:ops/kitchen/etc | ✔ | ✔ | ✔ | ✔ | ✔ | ◐ | ◐ | ◐ | – | – | – | ◐ | ◐ | ◐ | ◐ | ◐ | – | R |
| ai.* (query, forecasts) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ◐ | – | – | – | – | – | ◐ | – | ◐ | – | – | – |
| integrations.* / webhooks | ✔ | ✔ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| billing (subscription) | ✔ | ✔ | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |

Notes:
- **Waiter ◐ on pos.order:** can create/amend orders for own tables; cannot bill or settle.
- **Captain ◐ on void:** item-void before KOT fire only; post-fire void needs manager.
- **Vendor** sees only the vendor portal bound to their vendor record. **Auditor** is read-only
  everywhere, including audit logs, and cannot export PII without explicit grant.
- **Super Admin** is Aureus platform staff (support/impersonation with consent + audit); it is
  not assignable by tenants.
