import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ALWAYS_ACTIVE_MODULES, type ModuleCode } from '@aureus/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../prisma.service';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Route-prefix → owning module. Only prefixes that gate a *commercial*
 * module need an entry; anything not listed here (or listed in
 * {@link ALWAYS_ALLOWED_PREFIXES}) falls through unrestricted.
 */
const MODULE_ROUTE_PREFIXES: Record<string, ModuleCode> = {
  pos: 'pos',
  hotel: 'hotel',
  inventory: 'inventory',
  procurement: 'procurement',
  production: 'production',
  accounting: 'accounting',
  crm: 'crm',
  bar: 'bar',
  ai: 'ai',
  hr: 'hr',
  assets: 'assets',
};

/**
 * Route prefixes that are never gated by plan/module entitlement — identity,
 * organization hierarchy (no single controller prefix, so every resource
 * segment it registers is listed) and the always-on catalog/billing/settings
 * surfaces.
 */
const ALWAYS_ALLOWED_PREFIXES = new Set([
  'auth',
  'users',
  'roles',
  'audit-logs',
  'settings',
  'billing',
  'health',
  'catalog',
  'companies',
  'brands',
  'locations',
  'outlets',
  'floors',
  'tables',
  'stores',
  'terminals',
]);

const RESTRICTED_STATUSES = new Set(['SUSPENDED', 'CHURNED']);

/**
 * Global guard enforcing (1) trial expiry / subscription status and (2) that
 * the tenant's plan actually entitles the module a route belongs to. Runs
 * after JwtAuthGuard + PermissionsGuard so `request.user` is already set.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) return true; // no principal — nothing to gate (shouldn't happen post-JwtAuthGuard)

    // Per-request lookup only — no cross-request cache.
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { status: true, trialEndsAt: true },
    });
    if (!tenant) return true; // dangling token for a deleted tenant — let downstream 404/401 handle it

    const prefix = this.routePrefix(request);
    const isTrialExpired =
      tenant.status === 'TRIAL' && !!tenant.trialEndsAt && tenant.trialEndsAt.getTime() < Date.now();
    const isSubscriptionInactive = RESTRICTED_STATUSES.has(tenant.status);

    if (isTrialExpired || isSubscriptionInactive) {
      if (this.isBillingSelfServeRoute(request, prefix)) return true;
      throw new HttpException(
        {
          message: isTrialExpired
            ? 'Your trial has ended — choose a plan to continue.'
            : 'This workspace subscription is inactive — contact billing.',
          code: isTrialExpired ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_INACTIVE',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Active trial ("14-day full-feature trial, no card required") gets every
    // module regardless of the starter-plan ModuleSubscription rows seeded at
    // registration — real entitlement checks only apply once the tenant has
    // an actual plan (status flips to ACTIVE on checkout/plan change). If we
    // reach here with status TRIAL, isTrialExpired above was false, so the
    // trial window is still open.
    if (tenant.status === 'TRIAL') return true;

    return this.checkModuleEntitlement(user.tenantId, prefix);
  }

  private path(request: Request): string {
    return (request.path ?? request.originalUrl ?? '').split('?')[0] ?? '';
  }

  /** First meaningful path segment, with the global `api` prefix and URI version stripped. */
  private routePrefix(request: Request): string | undefined {
    const segments = this.path(request).split('/').filter(Boolean);
    const meaningful = segments.filter((s) => s !== 'api' && !/^v\d+$/.test(s));
    return meaningful[0];
  }

  /** Only auth endpoints, `GET /billing/*` and `POST /billing/subscription/change-plan` survive expiry/inactivity. */
  private isBillingSelfServeRoute(request: Request, prefix: string | undefined): boolean {
    if (prefix === 'auth') return true;
    if (prefix !== 'billing') return false;
    if (request.method === 'GET') return true;
    return request.method === 'POST' && /\/billing\/subscription\/change-plan\/?$/.test(this.path(request));
  }

  private async checkModuleEntitlement(tenantId: string, prefix: string | undefined): Promise<boolean> {
    if (!prefix || ALWAYS_ALLOWED_PREFIXES.has(prefix)) return true;

    const moduleCode = MODULE_ROUTE_PREFIXES[prefix];
    if (!moduleCode) return true; // unmapped route — not a commercial-module surface, don't gate it
    if (ALWAYS_ACTIVE_MODULES.includes(moduleCode)) return true;

    const subscription = await this.prisma.moduleSubscription.findUnique({
      where: { tenantId_moduleCode: { tenantId, moduleCode } },
    });
    if (subscription?.active) return true;

    throw new ForbiddenException({
      message: `Module "${moduleCode}" is not included in the current plan`,
      code: 'MODULE_NOT_IN_PLAN',
    });
  }
}
