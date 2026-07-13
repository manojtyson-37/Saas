import { BadRequestException } from '@nestjs/common';
import { TenantContext } from '../../common/tenant-context';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  function makePrisma() {
    const tx = {
      tenant: { update: jest.fn() },
      moduleSubscription: { upsert: jest.fn().mockResolvedValue({}) },
    };
    return {
      tx,
      tenant: {
        findUniqueOrThrow: jest.fn(),
      },
      moduleSubscription: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((cb: any) => cb(tx)),
    };
  }

  function makeAudit() {
    return { log: jest.fn().mockResolvedValue(undefined) };
  }

  function makeProvider() {
    return { createSubscription: jest.fn().mockResolvedValue({ providerRef: null }) };
  }

  function run<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    return TenantContext.run({ tenantId, userId: 'user-1' }, fn);
  }

  it('rejects change-plan for an unknown plan code before touching the database', async () => {
    const prisma = makePrisma();
    const service = new BillingService(prisma as any, makeAudit() as any, makeProvider() as any);

    await expect(
      run('tenant-1', () => service.changePlan({ planCode: 'nonexistent' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('updates Tenant.plan, syncs module subscriptions and audit-logs before/after on change-plan', async () => {
    const prisma = makePrisma();
    prisma.tenant.findUniqueOrThrow
      .mockResolvedValueOnce({ id: 'tenant-1', plan: 'starter', status: 'TRIAL', trialEndsAt: null })
      .mockResolvedValueOnce({ id: 'tenant-1', plan: 'growth', status: 'TRIAL', trialEndsAt: null });
    prisma.tx.tenant.update.mockResolvedValue({ id: 'tenant-1', plan: 'growth' });
    const audit = makeAudit();
    const provider = makeProvider();
    const service = new BillingService(prisma as any, audit as any, provider as any);

    const result = await run('tenant-1', () => service.changePlan({ planCode: 'growth' }));

    expect(prisma.tx.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'growth', status: 'ACTIVE' },
    });
    // one upsert per catalog module (sync helper), inside the same transaction
    expect(prisma.tx.moduleSubscription.upsert).toHaveBeenCalled();
    expect(provider.createSubscription).toHaveBeenCalledWith({ tenantId: 'tenant-1', planCode: 'growth' });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'billing.subscription:manage',
        entityId: 'tenant-1',
        before: { plan: 'starter' },
        after: { plan: 'growth' },
      }),
    );
    expect(result.planCode).toBe('growth');
  });

  it('sets tenant.status to ACTIVE on change-plan when the tenant is on a trial', async () => {
    const prisma = makePrisma();
    prisma.tenant.findUniqueOrThrow
      .mockResolvedValueOnce({ id: 'tenant-1', plan: 'starter', status: 'TRIAL', trialEndsAt: new Date() })
      .mockResolvedValueOnce({ id: 'tenant-1', plan: 'growth', status: 'ACTIVE', trialEndsAt: null });
    prisma.tx.tenant.update.mockResolvedValue({ id: 'tenant-1', plan: 'growth', status: 'ACTIVE' });
    const service = new BillingService(prisma as any, makeAudit() as any, makeProvider() as any);

    await run('tenant-1', () => service.changePlan({ planCode: 'growth' }));

    expect(prisma.tx.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'growth', status: 'ACTIVE' },
    });
  });

  it('does not redundantly re-set status when the tenant is already ACTIVE', async () => {
    const prisma = makePrisma();
    prisma.tenant.findUniqueOrThrow
      .mockResolvedValueOnce({ id: 'tenant-1', plan: 'starter', status: 'ACTIVE', trialEndsAt: null })
      .mockResolvedValueOnce({ id: 'tenant-1', plan: 'growth', status: 'ACTIVE', trialEndsAt: null });
    prisma.tx.tenant.update.mockResolvedValue({ id: 'tenant-1', plan: 'growth', status: 'ACTIVE' });
    const service = new BillingService(prisma as any, makeAudit() as any, makeProvider() as any);

    await run('tenant-1', () => service.changePlan({ planCode: 'growth' }));

    expect(prisma.tx.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'growth' },
    });
  });

  it('computes trial days remaining from trialEndsAt', async () => {
    const prisma = makePrisma();
    const trialEndsAt = new Date(Date.now() + 5 * 86_400_000);
    prisma.tenant.findUniqueOrThrow.mockResolvedValue({
      id: 'tenant-1',
      plan: 'starter',
      status: 'TRIAL',
      trialEndsAt,
    });
    const service = new BillingService(prisma as any, makeAudit() as any, makeProvider() as any);

    const result = await run('tenant-1', () => service.getSubscription());

    expect(result.trialDaysRemaining).toBe(5);
    expect(result.plan?.code).toBe('starter');
  });
});
