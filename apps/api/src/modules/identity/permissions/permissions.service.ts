import { Injectable } from '@nestjs/common';
import { expandGrants } from '@aureus/shared';
import { PrismaService } from '../../../common/prisma.service';
import type { AccessScope } from '../../../common/tenant-context';

export interface CompiledAccess {
  permissions: ReadonlySet<string>;
  scope: AccessScope;
}

interface CacheEntry {
  access: CompiledAccess;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;

/**
 * Compiles a user's effective access from their role assignments:
 * union of expanded permission grants + the data-visibility scope.
 * In-process cache with short TTL; invalidated eagerly on role or
 * assignment mutations. (Backed by Redis once multi-pod.)
 */
@Injectable()
export class PermissionsService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async getAccess(tenantId: string, userId: string): Promise<CompiledAccess> {
    const key = `${tenantId}:${userId}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.access;

    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { tenantId, userId },
      include: { role: { include: { permissions: true } } },
    });

    const grants = assignments.flatMap((a) => a.role.permissions.map((p) => p.permission));
    const permissions = new Set<string>(expandGrants(grants));

    const tenantWide = assignments.some((a) => a.scopeType === 'TENANT');
    const companyIds = [
      ...new Set(
        assignments
          .filter((a) => a.scopeType === 'COMPANY' && a.companyId)
          .map((a) => a.companyId as string),
      ),
    ];
    const locationIds = [
      ...new Set(
        assignments
          .filter((a) => a.scopeType === 'LOCATION' && a.locationId)
          .map((a) => a.locationId as string),
      ),
    ];

    const access: CompiledAccess = {
      permissions,
      scope: { tenantWide, companyIds, locationIds },
    };
    this.cache.set(key, { access, expiresAt: Date.now() + CACHE_TTL_MS });
    return access;
  }

  invalidateUser(tenantId: string, userId: string): void {
    this.cache.delete(`${tenantId}:${userId}`);
  }

  /** Called when a role definition changes — drop everything for the tenant. */
  invalidateTenant(tenantId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) this.cache.delete(key);
    }
  }
}
