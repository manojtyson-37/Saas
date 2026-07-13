/**
 * Aureus permission catalog — the single source of truth for RBAC.
 *
 * A permission is a `resource:action` string. Roles hold permission grants
 * (optionally wildcarded, e.g. `pos.*` or `*`), which are expanded against
 * this catalog when a user's effective permission set is compiled.
 *
 * Adding a feature = adding its permissions here. The API validates at boot
 * that every `@RequirePermission()` used by a controller exists in this
 * catalog, so drift is caught immediately.
 */

export const PERMISSIONS = [
  // ── identity ────────────────────────────────────────────────────────────
  'identity.user:read',
  'identity.user:create',
  'identity.user:update',
  'identity.user:delete',
  'identity.user:assign-role',
  'identity.role:read',
  'identity.role:create',
  'identity.role:update',
  'identity.role:delete',
  'identity.audit:read',

  // ── organization ────────────────────────────────────────────────────────
  'organization.company:read',
  'organization.company:create',
  'organization.company:update',
  'organization.company:delete',
  'organization.brand:read',
  'organization.brand:create',
  'organization.brand:update',
  'organization.brand:delete',
  'organization.location:read',
  'organization.location:create',
  'organization.location:update',
  'organization.location:delete',
  'organization.outlet:read',
  'organization.outlet:create',
  'organization.outlet:update',
  'organization.outlet:delete',
  'organization.table:read',
  'organization.table:manage',
  'organization.terminal:read',
  'organization.terminal:manage',
  'organization.store:read',
  'organization.store:manage',
  'organization.module:manage',

  // ── catalog (menu) ──────────────────────────────────────────────────────
  'catalog.category:read',
  'catalog.category:manage',
  'catalog.item:read',
  'catalog.item:create',
  'catalog.item:update',
  'catalog.item:delete',
  'catalog.price-list:read',
  'catalog.price-list:manage',
  'catalog.menu:publish',

  // ── pos ─────────────────────────────────────────────────────────────────
  'pos.order:read',
  'pos.order:create',
  'pos.order:update',
  'pos.order:void',
  'pos.order:split',
  'pos.order:merge',
  'pos.order:transfer',
  'pos.discount:apply',
  'pos.discount:override',
  'pos.payment:capture',
  'pos.payment:refund',
  'pos.cash-session:open',
  'pos.cash-session:close',
  'pos.cash-session:read',
  'pos.kds:operate',

  // ── hotel ───────────────────────────────────────────────────────────────
  'hotel.room:read',
  'hotel.room:manage',
  'hotel.rate:read',
  'hotel.rate:manage',
  'hotel.guest:read',
  'hotel.guest:manage',
  'hotel.reservation:read',
  'hotel.reservation:create',
  'hotel.reservation:update',
  'hotel.reservation:cancel',
  'hotel.reservation:manage',
  'hotel.stay:check-in',
  'hotel.stay:check-out',
  'hotel.folio:read',
  'hotel.folio:charge',
  'hotel.folio:settle',
  'hotel.folio:manage',
  'hotel.housekeeping:read',
  'hotel.housekeeping:operate',
  'hotel.night-audit:run',

  // ── inventory ───────────────────────────────────────────────────────────
  'inventory.item:read',
  'inventory.item:create',
  'inventory.item:update',
  'inventory.item:delete',
  'inventory.stock:read',
  'inventory.opening-stock:create',
  'inventory.transfer:read',
  'inventory.transfer:create',
  'inventory.transfer:dispatch',
  'inventory.transfer:receive',
  'inventory.adjustment:read',
  'inventory.adjustment:create',
  'inventory.count:read',
  'inventory.count:create',
  'inventory.count:post',
  'inventory.analysis:read',

  // ── procurement ─────────────────────────────────────────────────────────
  'procurement.vendor:read',
  'procurement.vendor:create',
  'procurement.vendor:update',
  'procurement.vendor:delete',
  'procurement.pr:read',
  'procurement.pr:create',
  'procurement.pr:approve',
  'procurement.rfq:read',
  'procurement.rfq:manage',
  'procurement.po:read',
  'procurement.po:create',
  'procurement.po:approve',
  'procurement.grn:read',
  'procurement.grn:create',
  'procurement.grn:post',
  'procurement.invoice:read',
  'procurement.invoice:create',
  'procurement.invoice:post',
  'procurement.note:manage',
  'procurement.vendor-payment:create',
  'procurement.vendor-ledger:read',

  // ── production ──────────────────────────────────────────────────────────
  'production.recipe:read',
  'production.recipe:create',
  'production.recipe:update',
  'production.recipe:delete',
  'production.order:read',
  'production.order:create',
  'production.order:complete',

  // ── bar ─────────────────────────────────────────────────────────────────
  'bar.bottle:read',
  'bar.bottle:operate',
  'bar.variance:read',
  'bar.excise:read',

  // ── crm ─────────────────────────────────────────────────────────────────
  'crm.customer:read',
  'crm.customer:create',
  'crm.customer:update',
  'crm.customer:delete',
  'crm.wallet:operate',
  'crm.loyalty:read',
  'crm.loyalty:manage',
  'crm.gift-card:manage',
  'crm.coupon:manage',
  'crm.campaign:read',
  'crm.campaign:manage',

  // ── accounting ──────────────────────────────────────────────────────────
  'accounting.account:read',
  'accounting.account:manage',
  'accounting.journal:read',
  'accounting.journal:create',
  'accounting.journal:approve',
  'accounting.tax:read',
  'accounting.tax:manage',
  'accounting.bank:read',
  'accounting.bank:manage',
  'accounting.reconciliation:manage',
  'accounting.report:read',
  'accounting.period:close',
  'accounting.budget:read',
  'accounting.budget:manage',
  'accounting.export:run',

  // ── hr ──────────────────────────────────────────────────────────────────
  'hr.employee:read',
  'hr.employee:create',
  'hr.employee:update',
  'hr.employee:delete',
  'hr.shift:read',
  'hr.shift:manage',
  'hr.attendance:read',
  'hr.attendance:punch',
  'hr.attendance:manage',
  'hr.leave:read',
  'hr.leave:request',
  'hr.leave:approve',
  'hr.payroll:read',
  'hr.payroll:run',

  // ── assets ──────────────────────────────────────────────────────────────
  'assets.asset:read',
  'assets.asset:manage',
  'assets.depreciation:run',
  'assets.amc:manage',
  'assets.maintenance:read',
  'assets.maintenance:manage',

  // ── reporting ───────────────────────────────────────────────────────────
  'reporting.dashboard.owner:read',
  'reporting.dashboard.operations:read',
  'reporting.dashboard.kitchen:read',
  'reporting.dashboard.finance:read',
  'reporting.dashboard.inventory:read',
  'reporting.dashboard.hr:read',
  'reporting.dashboard.sales:read',
  'reporting.report:run',
  'reporting.report:schedule',

  // ── ai ──────────────────────────────────────────────────────────────────
  'ai.query:run',
  'ai.forecast:read',
  'ai.anomaly:read',

  // ── integrations & billing ──────────────────────────────────────────────
  'integrations.webhook:manage',
  'integrations.payment-gateway:manage',
  'integrations.aggregator:manage',
  'integrations.messaging:manage',
  'billing.subscription:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

/**
 * Expand a grant pattern against the catalog.
 *   `*`                → every permission
 *   `pos.*`            → every permission whose resource starts with `pos.`
 *   `inventory.item:*` → every action on that resource
 *   exact string       → itself (if it exists)
 */
export function expandGrant(pattern: string): Permission[] {
  if (pattern === '*') return [...PERMISSIONS];
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -1); // keep trailing dot
    return PERMISSIONS.filter((p) => p.startsWith(prefix));
  }
  if (pattern.endsWith(':*')) {
    const prefix = pattern.slice(0, -1); // keep trailing colon
    return PERMISSIONS.filter((p) => p.startsWith(prefix));
  }
  return isPermission(pattern) ? [pattern] : [];
}

export function expandGrants(patterns: readonly string[]): Permission[] {
  const out = new Set<Permission>();
  for (const pattern of patterns) {
    for (const p of expandGrant(pattern)) out.add(p);
  }
  return [...out];
}

/** Seeded system roles. `grants` are patterns expanded via {@link expandGrants}. */
export interface SystemRoleDefinition {
  code: string;
  name: string;
  description: string;
  grants: readonly string[];
}

export const SYSTEM_ROLES: readonly SystemRoleDefinition[] = [
  {
    code: 'owner',
    name: 'Owner',
    description: 'Full access to every module and setting in the tenant.',
    grants: ['*'],
  },
  {
    code: 'director',
    name: 'Director',
    description: 'Executive visibility with management rights over operations-facing modules.',
    grants: [
      'organization.company:read', 'organization.brand:read', 'organization.location:read',
      'organization.outlet:read', 'identity.user:read', 'identity.audit:read',
      'catalog.*', 'pos.*', 'hotel.*', 'inventory.item:read', 'inventory.stock:read',
      'inventory.analysis:read', 'procurement.pr:read', 'procurement.pr:approve',
      'procurement.po:read', 'procurement.po:approve', 'procurement.rfq:read',
      'production.recipe:read', 'production.order:read', 'bar.variance:read', 'bar.bottle:read',
      'crm.*', 'accounting.report:read', 'hr.employee:read', 'hr.attendance:read',
      'assets.asset:read', 'reporting.*', 'ai.query:run', 'ai.forecast:read', 'ai.anomaly:read',
      'billing.subscription:manage',
    ],
  },
  {
    code: 'finance',
    name: 'Finance',
    description: 'Accounting, banking, tax, payables and financial reporting.',
    grants: [
      'accounting.*', 'procurement.invoice:read', 'procurement.invoice:post',
      'procurement.vendor-payment:create', 'procurement.vendor-ledger:read',
      'procurement.vendor:read', 'pos.cash-session:read', 'inventory.stock:read',
      'hr.payroll:read', 'assets.*', 'reporting.dashboard.finance:read',
      'reporting.report:run', 'reporting.report:schedule', 'identity.audit:read',
      'organization.company:read', 'ai.query:run',
    ],
  },
  {
    code: 'operations-manager',
    name: 'Operations Manager',
    description: 'Runs day-to-day outlet operations across POS, kitchen and staff.',
    grants: [
      'organization.outlet:read', 'organization.table:read', 'organization.table:manage',
      'organization.terminal:read', 'catalog.*', 'pos.*', 'hotel.*',
      'inventory.item:read', 'inventory.stock:read', 'inventory.transfer:create',
      'inventory.adjustment:create', 'inventory.adjustment:read', 'inventory.analysis:read',
      'procurement.pr:read', 'procurement.pr:create', 'procurement.po:read',
      'production.recipe:read', 'production.order:read', 'production.order:create',
      'bar.*', 'crm.*', 'hr.shift:read', 'hr.shift:manage', 'hr.attendance:read',
      'hr.attendance:manage', 'hr.employee:read',
      'reporting.dashboard.operations:read', 'reporting.dashboard.sales:read',
      'reporting.dashboard.kitchen:read', 'reporting.report:run', 'ai.query:run',
      'ai.forecast:read',
    ],
  },
  {
    code: 'purchase-manager',
    name: 'Purchase Manager',
    description: 'Vendors, purchase requests, orders and receiving.',
    grants: [
      'procurement.*', 'inventory.item:read', 'inventory.stock:read',
      'inventory.analysis:read', 'ai.forecast:read',
      'reporting.dashboard.inventory:read', 'reporting.report:run',
    ],
  },
  {
    code: 'kitchen-manager',
    name: 'Kitchen Manager',
    description: 'Recipes, production, kitchen inventory and the KDS.',
    grants: [
      'production.*', 'pos.kds:operate', 'catalog.item:read', 'catalog.category:read',
      'inventory.item:read', 'inventory.stock:read', 'inventory.transfer:create',
      'inventory.transfer:read', 'inventory.adjustment:create', 'inventory.adjustment:read',
      'inventory.count:create', 'inventory.count:read',
      'procurement.pr:create', 'procurement.pr:read',
      'hr.shift:read', 'hr.attendance:read',
      'reporting.dashboard.kitchen:read',
    ],
  },
  {
    code: 'chef',
    name: 'Chef',
    description: 'Kitchen execution: KDS, recipes, prep and wastage recording.',
    grants: [
      'pos.kds:operate', 'production.recipe:read', 'production.order:read',
      'production.order:create', 'catalog.item:read', 'inventory.item:read',
      'inventory.stock:read', 'inventory.adjustment:create',
      'reporting.dashboard.kitchen:read', 'hr.attendance:punch', 'hr.leave:request',
    ],
  },
  {
    code: 'captain',
    name: 'Captain',
    description: 'Senior floor staff: full order lifecycle, limited voids.',
    grants: [
      'pos.order:read', 'pos.order:create', 'pos.order:update', 'pos.order:split',
      'pos.order:merge', 'pos.order:transfer', 'pos.discount:apply',
      'pos.payment:capture', 'catalog.item:read', 'catalog.category:read',
      'organization.table:read', 'crm.customer:read', 'crm.customer:create',
      'hr.attendance:punch', 'hr.leave:request',
    ],
  },
  {
    code: 'cashier',
    name: 'Cashier',
    description: 'Billing and settlement at the till, cash session custody.',
    grants: [
      'pos.order:read', 'pos.order:create', 'pos.order:update', 'pos.discount:apply',
      'pos.payment:capture', 'pos.cash-session:open', 'pos.cash-session:close',
      'pos.cash-session:read', 'catalog.item:read', 'catalog.category:read',
      'crm.customer:read', 'crm.customer:create', 'crm.wallet:operate',
      'hr.attendance:punch', 'hr.leave:request',
    ],
  },
  {
    code: 'waiter',
    name: 'Waiter',
    description: 'Takes orders for own tables; cannot bill or settle.',
    grants: [
      'pos.order:read', 'pos.order:create', 'pos.order:update',
      'catalog.item:read', 'catalog.category:read', 'organization.table:read',
      'crm.customer:read', 'hr.attendance:punch', 'hr.leave:request',
    ],
  },
  {
    code: 'bartender',
    name: 'Bartender',
    description: 'Bar orders, bottle lifecycle, pour and wastage recording.',
    grants: [
      'pos.order:read', 'pos.order:create', 'pos.order:update', 'pos.payment:capture',
      'bar.bottle:read', 'bar.bottle:operate', 'production.recipe:read',
      'catalog.item:read', 'inventory.item:read', 'inventory.stock:read',
      'inventory.adjustment:create', 'hr.attendance:punch', 'hr.leave:request',
    ],
  },
  {
    code: 'inventory-manager',
    name: 'Inventory Manager',
    description: 'Full stock control across stores: transfers, counts, adjustments.',
    grants: [
      'inventory.*', 'organization.store:read', 'procurement.pr:create', 'procurement.pr:read',
      'procurement.grn:read', 'procurement.grn:create', 'procurement.grn:post',
      'procurement.vendor:read', 'production.order:read',
      'reporting.dashboard.inventory:read', 'reporting.report:run', 'ai.forecast:read',
    ],
  },
  {
    code: 'store-manager',
    name: 'Store Manager',
    description: 'Runs a specific store/warehouse: receiving, transfers, counts.',
    grants: [
      'inventory.item:read', 'inventory.stock:read', 'inventory.opening-stock:create',
      'inventory.transfer:read', 'inventory.transfer:create', 'inventory.transfer:dispatch',
      'inventory.transfer:receive', 'inventory.adjustment:read', 'inventory.adjustment:create',
      'inventory.count:read', 'inventory.count:create', 'inventory.count:post',
      'procurement.grn:read', 'procurement.grn:create', 'procurement.grn:post',
      'procurement.pr:create', 'procurement.pr:read', 'organization.store:read',
      'reporting.dashboard.inventory:read', 'hr.attendance:punch', 'hr.leave:request',
    ],
  },
  {
    code: 'accounts',
    name: 'Accounts',
    description: 'Bookkeeping: journals, banking, payables (no period close).',
    grants: [
      'accounting.account:read', 'accounting.journal:read', 'accounting.journal:create',
      'accounting.tax:read', 'accounting.bank:read', 'accounting.bank:manage',
      'accounting.reconciliation:manage', 'accounting.report:read',
      'accounting.budget:read', 'accounting.export:run',
      'procurement.invoice:read', 'procurement.invoice:create',
      'procurement.vendor-payment:create', 'procurement.vendor-ledger:read',
      'procurement.vendor:read', 'pos.cash-session:read', 'hr.payroll:read',
      'organization.company:read', 'identity.audit:read',
    ],
  },
  {
    code: 'hr',
    name: 'HR',
    description: 'Employee lifecycle, attendance, leave and payroll.',
    grants: [
      'hr.*', 'identity.user:read', 'identity.user:create',
      'organization.location:read', 'reporting.dashboard.hr:read', 'reporting.report:run',
    ],
  },
  {
    code: 'vendor',
    name: 'Vendor',
    description: 'External vendor portal: own POs, deliveries and ledger only.',
    grants: ['procurement.po:read', 'procurement.vendor-ledger:read'],
  },
  {
    code: 'auditor',
    name: 'Auditor',
    description: 'Read-only access to records, reports and the audit trail.',
    grants: [
      'identity.audit:read', 'organization.company:read', 'organization.brand:read',
      'organization.location:read', 'organization.outlet:read',
      'catalog.item:read', 'catalog.category:read', 'catalog.price-list:read',
      'pos.order:read', 'pos.cash-session:read', 'hotel.reservation:read',
      'hotel.folio:read', 'hotel.room:read',
      'inventory.item:read', 'inventory.stock:read', 'inventory.transfer:read',
      'inventory.adjustment:read', 'inventory.count:read', 'inventory.analysis:read',
      'procurement.vendor:read', 'procurement.pr:read', 'procurement.rfq:read',
      'procurement.po:read', 'procurement.grn:read', 'procurement.invoice:read',
      'procurement.vendor-ledger:read', 'production.recipe:read', 'production.order:read',
      'bar.bottle:read', 'bar.variance:read', 'bar.excise:read',
      'crm.customer:read', 'crm.loyalty:read', 'crm.campaign:read',
      'accounting.account:read', 'accounting.journal:read', 'accounting.tax:read',
      'accounting.bank:read', 'accounting.report:read', 'accounting.budget:read',
      'hr.employee:read', 'hr.attendance:read', 'hr.leave:read', 'hr.payroll:read',
      'assets.asset:read', 'assets.maintenance:read',
    ],
  },
] as const;
