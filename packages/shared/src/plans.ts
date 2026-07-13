import type { ModuleCode } from './modules';

/**
 * Commercial plan catalog. A tenant's `plan` (see Prisma `Tenant.plan`)
 * selects which modules are entitled and the seat/location ceiling.
 * `core` and `reporting` are always active regardless of plan
 * (see {@link ALWAYS_ACTIVE_MODULES} in ./modules) and are intentionally
 * omitted from `moduleCodes` below — list only the modules the plan adds.
 *
 * `limits.maxLocations` / `limits.maxUsers` — `null` means unlimited.
 */
// TODO: nothing currently enforces maxLocations/maxUsers at creation time — deferred, don't forget.
export interface PlanLimits {
  maxLocations: number | null;
  maxUsers: number | null;
}

export interface Plan {
  code: string;
  name: string;
  priceInrMonthly: number;
  moduleCodes: readonly ModuleCode[];
  limits: PlanLimits;
  trialDays: number;
}

export const PLANS: readonly Plan[] = [
  {
    code: 'starter',
    name: 'Starter',
    priceInrMonthly: 0,
    moduleCodes: ['pos'], // organization + catalog live on 'core', always active
    limits: { maxLocations: 1, maxUsers: 2 },
    trialDays: 14,
  },
  {
    code: 'growth',
    name: 'Growth',
    priceInrMonthly: 2999,
    moduleCodes: ['pos', 'inventory', 'procurement', 'production', 'accounting', 'crm'],
    limits: { maxLocations: 3, maxUsers: 15 },
    trialDays: 14,
  },
  {
    code: 'scale',
    name: 'Scale',
    priceInrMonthly: 7999,
    moduleCodes: [
      'pos',
      'inventory',
      'procurement',
      'production',
      'accounting',
      'crm',
      'hotel',
      'hr',
      'assets',
      'bar',
      'ai',
      'integrations',
    ],
    limits: { maxLocations: null, maxUsers: null },
    trialDays: 14,
  },
] as const;

export type PlanCode = (typeof PLANS)[number]['code'];

export function getPlan(code: string): Plan | undefined {
  return PLANS.find((p) => p.code === code);
}
