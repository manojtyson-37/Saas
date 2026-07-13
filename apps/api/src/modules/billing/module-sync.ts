import type { Prisma, PrismaClient } from '@aureus/database';
import { ALWAYS_ACTIVE_MODULES, getPlan, MODULES } from '@aureus/shared';

/** Anything with a `moduleSubscription` delegate — the full client or a `$transaction` callback client. */
type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Single source of truth for reconciling `ModuleSubscription` rows against a
 * plan's module list. Used by both tenant registration (starter plan, on
 * signup) and billing's change-plan endpoint, so entitlements never drift
 * between the two call sites.
 *
 * Upserts every catalog module to active/inactive in one pass — modules on
 * the plan (plus the always-on core/reporting pair) are activated, every
 * other module is deactivated. Safe to re-run (idempotent).
 */
export async function syncModuleSubscriptionsForPlan(
  db: Db,
  tenantId: string,
  planCode: string,
): Promise<void> {
  const plan = getPlan(planCode);
  if (!plan) {
    throw new Error(`Cannot sync modules — unknown plan code "${planCode}"`);
  }

  const entitled = new Set<string>([...ALWAYS_ACTIVE_MODULES, ...plan.moduleCodes]);

  for (const moduleCode of MODULES) {
    const active = entitled.has(moduleCode);
    await db.moduleSubscription.upsert({
      where: { tenantId_moduleCode: { tenantId, moduleCode } },
      update: { active, deactivatedAt: active ? null : new Date() },
      create: { tenantId, moduleCode, active },
    });
  }
}
