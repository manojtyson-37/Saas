import {
  expandGrant,
  expandGrants,
  isPermission,
  PERMISSIONS,
  SYSTEM_ROLES,
} from '@aureus/shared';

describe('permission catalog', () => {
  it('contains no duplicates', () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
  });

  it('every permission is resource:action shaped', () => {
    for (const p of PERMISSIONS) {
      expect(p).toMatch(/^[a-z][a-z0-9.-]*:[a-z][a-z0-9-]*$/);
    }
  });

  it('expands the global wildcard to the full catalog', () => {
    expect(expandGrant('*')).toHaveLength(PERMISSIONS.length);
  });

  it('expands resource-prefix wildcards', () => {
    const pos = expandGrant('pos.*');
    expect(pos.length).toBeGreaterThan(5);
    expect(pos.every((p) => p.startsWith('pos.'))).toBe(true);
    // must not leak into other resources
    expect(pos).not.toContain('production.recipe:read');
  });

  it('expands action wildcards on a single resource', () => {
    const items = expandGrant('inventory.item:*');
    expect(items).toEqual(
      expect.arrayContaining(['inventory.item:read', 'inventory.item:create']),
    );
    expect(items.every((p) => p.startsWith('inventory.item:'))).toBe(true);
  });

  it('returns empty for unknown grants instead of guessing', () => {
    expect(expandGrant('nonsense.thing:do')).toEqual([]);
    expect(expandGrant('nonsense.*')).toEqual([]);
  });

  it('deduplicates across overlapping grants', () => {
    const set = expandGrants(['pos.*', 'pos.order:read']);
    expect(set.filter((p) => p === 'pos.order:read')).toHaveLength(1);
  });

  it('every system role grant resolves to at least one permission', () => {
    for (const role of SYSTEM_ROLES) {
      for (const grant of role.grants) {
        expect({ role: role.code, grant, resolved: expandGrant(grant).length > 0 }).toEqual({
          role: role.code,
          grant,
          resolved: true,
        });
      }
    }
  });

  it('waiter cannot capture payments; cashier can', () => {
    const waiter = new Set(
      expandGrants(SYSTEM_ROLES.find((r) => r.code === 'waiter')!.grants),
    );
    const cashier = new Set(
      expandGrants(SYSTEM_ROLES.find((r) => r.code === 'cashier')!.grants),
    );
    expect(waiter.has('pos.payment:capture')).toBe(false);
    expect(cashier.has('pos.payment:capture')).toBe(true);
    expect(isPermission('pos.payment:capture')).toBe(true);
  });

  it('auditor holds no mutating permissions', () => {
    const auditor = expandGrants(SYSTEM_ROLES.find((r) => r.code === 'auditor')!.grants);
    const mutating = auditor.filter((p) => !p.endsWith(':read'));
    expect(mutating).toEqual([]);
  });
});
