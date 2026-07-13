import { MODULES } from '@aureus/shared';
import { syncModuleSubscriptionsForPlan } from './module-sync';

describe('syncModuleSubscriptionsForPlan', () => {
  function makeDb() {
    return { moduleSubscription: { upsert: jest.fn().mockResolvedValue({}) } };
  }

  it('rejects an unknown plan code without touching the database', async () => {
    const db = makeDb();
    await expect(syncModuleSubscriptionsForPlan(db as any, 'tenant-1', 'nonexistent')).rejects.toThrow(
      /unknown plan/i,
    );
    expect(db.moduleSubscription.upsert).not.toHaveBeenCalled();
  });

  it('upserts every catalog module exactly once', async () => {
    const db = makeDb();
    await syncModuleSubscriptionsForPlan(db as any, 'tenant-1', 'starter');
    expect(db.moduleSubscription.upsert).toHaveBeenCalledTimes(MODULES.length);
  });

  it('activates only starter modules (plus always-on core/reporting) and deactivates the rest', async () => {
    const db = makeDb();
    await syncModuleSubscriptionsForPlan(db as any, 'tenant-1', 'starter');

    const activeCodes = db.moduleSubscription.upsert.mock.calls
      .filter(([arg]: any) => arg.update.active)
      .map(([arg]: any) => arg.where.tenantId_moduleCode.moduleCode);

    expect(activeCodes.sort()).toEqual(['core', 'pos', 'reporting'].sort());

    const hotelCall = db.moduleSubscription.upsert.mock.calls.find(
      ([arg]: any) => arg.where.tenantId_moduleCode.moduleCode === 'hotel',
    );
    expect(hotelCall[0].update.active).toBe(false);
    expect(hotelCall[0].update.deactivatedAt).toBeInstanceOf(Date);
  });

  it('activates the wider growth module set', async () => {
    const db = makeDb();
    await syncModuleSubscriptionsForPlan(db as any, 'tenant-1', 'growth');

    const activeCodes = db.moduleSubscription.upsert.mock.calls
      .filter(([arg]: any) => arg.update.active)
      .map(([arg]: any) => arg.where.tenantId_moduleCode.moduleCode)
      .sort();

    expect(activeCodes).toEqual(
      ['core', 'reporting', 'pos', 'inventory', 'procurement', 'production', 'accounting', 'crm'].sort(),
    );
  });

  it('activates every module for the scale plan except the ones it genuinely omits', async () => {
    const db = makeDb();
    await syncModuleSubscriptionsForPlan(db as any, 'tenant-1', 'scale');

    const activeCodes = db.moduleSubscription.upsert.mock.calls
      .filter(([arg]: any) => arg.update.active)
      .map(([arg]: any) => arg.where.tenantId_moduleCode.moduleCode)
      .sort();

    expect(activeCodes).toEqual([...MODULES].sort());
  });

  it('scopes every upsert to the given tenant', async () => {
    const db = makeDb();
    await syncModuleSubscriptionsForPlan(db as any, 'tenant-42', 'starter');
    for (const [arg] of db.moduleSubscription.upsert.mock.calls) {
      expect(arg.where.tenantId_moduleCode.tenantId).toBe('tenant-42');
      expect(arg.create.tenantId).toBe('tenant-42');
    }
  });
});
