import type { ExecutionContext } from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';

function makeContext(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    path: '/api/v1/pos/orders',
    originalUrl: '/api/v1/pos/orders',
    method: 'GET',
    user: { userId: 'user-1', tenantId: 'tenant-1', email: 'a@b.com', isTenantOwner: false },
    ...overrides,
  };
}

describe('SubscriptionGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let prisma: {
    tenant: { findUnique: jest.Mock };
    moduleSubscription: { findUnique: jest.Mock };
  };
  let guard: SubscriptionGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    prisma = {
      tenant: { findUnique: jest.fn() },
      moduleSubscription: { findUnique: jest.fn() },
    };
    guard = new SubscriptionGuard(reflector as any, prisma as any);
  });

  it('allows @Public() routes without touching prisma', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = makeContext(makeRequest());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it('allows requests with no principal (defensive no-op)', async () => {
    const ctx = makeContext(makeRequest({ user: undefined }));
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('rejects with 402 TRIAL_EXPIRED once the trial window has passed', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() - 86_400_000),
    });
    const ctx = makeContext(makeRequest({ path: '/api/v1/pos/orders' }));

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      status: 402,
      response: { code: 'TRIAL_EXPIRED' },
    });
  });

  it('still allows GET /billing/* and auth routes after trial expiry', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() - 86_400_000),
    });

    await expect(
      guard.canActivate(makeContext(makeRequest({ path: '/api/v1/billing/plans', method: 'GET' }))),
    ).resolves.toBe(true);

    await expect(
      guard.canActivate(makeContext(makeRequest({ path: '/api/v1/auth/logout', method: 'POST' }))),
    ).resolves.toBe(true);

    await expect(
      guard.canActivate(
        makeContext(makeRequest({ path: '/api/v1/billing/subscription/change-plan', method: 'POST' })),
      ),
    ).resolves.toBe(true);
  });

  it('rejects other POST /billing/* routes after trial expiry (only change-plan is exempt)', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() - 86_400_000),
    });

    await expect(
      guard.canActivate(makeContext(makeRequest({ path: '/api/v1/billing/webhook', method: 'POST' }))),
    ).rejects.toMatchObject({ status: 402, response: { code: 'TRIAL_EXPIRED' } });
  });

  it('rejects with 402 SUBSCRIPTION_INACTIVE when the tenant is suspended', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ status: 'SUSPENDED', trialEndsAt: null });
    const ctx = makeContext(makeRequest({ path: '/api/v1/pos/orders' }));

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      status: 402,
      response: { code: 'SUBSCRIPTION_INACTIVE' },
    });
  });

  it('rejects with 403 MODULE_NOT_IN_PLAN when the module has no active subscription', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ status: 'ACTIVE', trialEndsAt: null });
    prisma.moduleSubscription.findUnique.mockResolvedValue(null);
    const ctx = makeContext(makeRequest({ path: '/api/v1/hotel/reservations' }));

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      status: 403,
      response: { code: 'MODULE_NOT_IN_PLAN' },
    });
  });

  it('passes an active tenant through when the module is entitled', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ status: 'ACTIVE', trialEndsAt: null });
    prisma.moduleSubscription.findUnique.mockResolvedValue({ active: true });
    const ctx = makeContext(makeRequest({ path: '/api/v1/pos/orders' }));

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.moduleSubscription.findUnique).toHaveBeenCalledWith({
      where: { tenantId_moduleCode: { tenantId: 'tenant-1', moduleCode: 'pos' } },
    });
  });

  it('never gates always-active modules (core/reporting) via ModuleSubscription lookups', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ status: 'ACTIVE', trialEndsAt: null });
    const ctx = makeContext(makeRequest({ path: '/api/v1/organization/companies' }));

    // 'organization' has no ModuleCode entry in MODULE_ROUTE_PREFIXES — falls through unrestricted.
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.moduleSubscription.findUnique).not.toHaveBeenCalled();
  });

  it('grants full module access to an in-window trial tenant, bypassing the entitlement check entirely', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 86_400_000),
    });
    const ctx = makeContext(makeRequest({ path: '/api/v1/pos/orders' }));

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.moduleSubscription.findUnique).not.toHaveBeenCalled();
  });

  it('trial-active tenant reaches a module with no ModuleSubscription row at all (no 403)', async () => {
    // Registration only seeds starter-plan ModuleSubscription rows (core/reporting/pos) —
    // a trial tenant hitting inventory/hotel/hr/etc has no row for that module. The
    // "14-day full-feature trial" promise means this must still succeed.
    prisma.tenant.findUnique.mockResolvedValue({
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 86_400_000),
    });
    prisma.moduleSubscription.findUnique.mockResolvedValue(null);
    const ctx = makeContext(makeRequest({ path: '/api/v1/inventory/items' }));

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.moduleSubscription.findUnique).not.toHaveBeenCalled();
  });

  it('expired trial still gets 402 TRIAL_EXPIRED before the entitlement check ever runs', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() - 86_400_000),
    });
    const ctx = makeContext(makeRequest({ path: '/api/v1/inventory/items' }));

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      status: 402,
      response: { code: 'TRIAL_EXPIRED' },
    });
    expect(prisma.moduleSubscription.findUnique).not.toHaveBeenCalled();
  });

  it('a formerly trial-expired tenant passes through once status flips to ACTIVE (post change-plan)', async () => {
    // Simulates the state of the world right after BillingService#changePlan has run:
    // trialEndsAt is still in the past, but status is no longer 'TRIAL', so the
    // isTrialExpired branch must not fire even though the trial window has lapsed.
    prisma.tenant.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      trialEndsAt: new Date(Date.now() - 86_400_000),
    });
    prisma.moduleSubscription.findUnique.mockResolvedValue({ active: true });
    const ctx = makeContext(makeRequest({ path: '/api/v1/pos/orders' }));

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('ACTIVE tenant with a module not in plan still gets 403 MODULE_NOT_IN_PLAN (real entitlement check applies)', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ status: 'ACTIVE', trialEndsAt: null });
    prisma.moduleSubscription.findUnique.mockResolvedValue(null);
    const ctx = makeContext(makeRequest({ path: '/api/v1/inventory/items' }));

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      status: 403,
      response: { code: 'MODULE_NOT_IN_PLAN' },
    });
  });
});
