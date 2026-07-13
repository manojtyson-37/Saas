import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ALWAYS_ACTIVE_MODULES, getPlan, MODULES, PLANS } from '@aureus/shared';
import { PrismaService } from '../../common/prisma.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import { BILLING_PROVIDER, type BillingProvider } from './billing.provider';
import { syncModuleSubscriptionsForPlan } from './module-sync';
import type { ChangePlanDto } from './dto/billing.dto';

const DAY_MS = 86_400_000;

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(BILLING_PROVIDER) private readonly provider: BillingProvider,
  ) {}

  private ctx(): { tenantId: string } {
    return { tenantId: TenantContext.requireTenantId() };
  }

  /** Static plan catalog — no tenant scoping needed. */
  getPlans() {
    return PLANS;
  }

  async getSubscription() {
    const { tenantId } = this.ctx();
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const plan = getPlan(tenant.plan);

    const subscriptions = await this.prisma.moduleSubscription.findMany({ where: { tenantId } });
    const byCode = new Map(subscriptions.map((s) => [s.moduleCode, s]));
    const modules = MODULES.map((code) => ({
      code,
      active: ALWAYS_ACTIVE_MODULES.includes(code) || (byCode.get(code)?.active ?? false),
    }));

    const trialDaysRemaining =
      tenant.status === 'TRIAL' && tenant.trialEndsAt
        ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - Date.now()) / DAY_MS))
        : null;

    return {
      planCode: tenant.plan,
      plan: plan ?? null,
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt,
      trialDaysRemaining,
      modules,
    };
  }

  async changePlan(dto: ChangePlanDto) {
    const { tenantId } = this.ctx();
    const plan = getPlan(dto.planCode);
    if (!plan) {
      throw new BadRequestException(`Unknown plan "${dto.planCode}"`);
    }

    const before = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

    const updated = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          plan: plan.code,
          // Paying for a plan (or moving between plans) is what takes a tenant out of
          // the trial window — without this, `SubscriptionGuard.isTrialExpired` keeps
          // firing 402 TRIAL_EXPIRED forever once trialEndsAt passes, even after the
          // tenant has "paid" via change-plan.
          ...(before.status === 'ACTIVE' ? {} : { status: 'ACTIVE' as const }),
        },
      });
      await syncModuleSubscriptionsForPlan(tx, tenantId, plan.code);
      return tenant;
    });

    await this.provider.createSubscription({ tenantId, planCode: plan.code });

    await this.audit.log({
      action: 'billing.subscription:manage',
      entityType: 'tenant',
      entityId: tenantId,
      before: { plan: before.plan },
      after: { plan: updated.plan },
    });

    return this.getSubscription();
  }
}
