import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  tenantId?: string;
  userId?: string;
  /** compiled effective permissions for this request's user */
  permissions?: ReadonlySet<string>;
  /** data-visibility scope derived from role assignments */
  scope?: AccessScope;
  ip?: string;
  terminalId?: string;
}

export interface AccessScope {
  /** true when any assignment is tenant-wide — no location filtering applies */
  tenantWide: boolean;
  companyIds: readonly string[];
  locationIds: readonly string[];
}

const storage = new AsyncLocalStorage<RequestContext>();

export const TenantContext = {
  run<T>(ctx: RequestContext, fn: () => T): T {
    return storage.run(ctx, fn);
  },

  get(): RequestContext | undefined {
    return storage.getStore();
  },

  /** Tenant id of the authenticated request. Throws if called outside an authenticated scope. */
  requireTenantId(): string {
    const tenantId = storage.getStore()?.tenantId;
    if (!tenantId) {
      throw new Error('TenantContext.requireTenantId() called outside an authenticated request');
    }
    return tenantId;
  },

  requireUserId(): string {
    const userId = storage.getStore()?.userId;
    if (!userId) {
      throw new Error('TenantContext.requireUserId() called outside an authenticated request');
    }
    return userId;
  },
};
