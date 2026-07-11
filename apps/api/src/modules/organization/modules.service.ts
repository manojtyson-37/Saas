import { BadRequestException, Injectable } from '@nestjs/common';
import { ALWAYS_ACTIVE_MODULES, MODULES, type ModuleCode } from '@aureus/shared';
import { PrismaService } from '../../common/prisma.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';

/** Commercial module activation per tenant (the packaging switchboard). */
@Injectable()
export class ModulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const tenantId = TenantContext.requireTenantId();
    const subscriptions = await this.prisma.moduleSubscription.findMany({
      where: { tenantId },
    });
    const byCode = new Map(subscriptions.map((s) => [s.moduleCode, s]));
    return MODULES.map((code) => ({
      code,
      active: ALWAYS_ACTIVE_MODULES.includes(code) || (byCode.get(code)?.active ?? false),
      alwaysActive: ALWAYS_ACTIVE_MODULES.includes(code),
      activatedAt: byCode.get(code)?.activatedAt ?? null,
    }));
  }

  async setActive(moduleCode: string, active: boolean) {
    const tenantId = TenantContext.requireTenantId();
    if (!MODULES.includes(moduleCode as ModuleCode)) {
      throw new BadRequestException(`Unknown module "${moduleCode}"`);
    }
    if (ALWAYS_ACTIVE_MODULES.includes(moduleCode as ModuleCode) && !active) {
      throw new BadRequestException(`Module "${moduleCode}" cannot be deactivated`);
    }

    const subscription = await this.prisma.moduleSubscription.upsert({
      where: { tenantId_moduleCode: { tenantId, moduleCode } },
      update: { active, deactivatedAt: active ? null : new Date() },
      create: { tenantId, moduleCode, active },
    });

    await this.audit.log({
      action: 'organization.module:manage',
      entityType: 'module_subscription',
      entityId: subscription.id,
      after: { moduleCode, active },
    });
    return subscription;
  }
}
