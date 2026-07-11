import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../../modules/identity/permissions/permissions.service';
import { TenantContext } from '../tenant-context';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Global authorization guard. Runs after JwtAuthGuard; resolves the user's
 * compiled permission set (cached) and enforces the route's declared
 * permission. Routes without @RequirePermission only require authentication.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const user: AuthenticatedUser | undefined = context.switchToHttp().getRequest().user;
    if (!user) return true; // public route — JwtAuthGuard already allowed it

    const access = await this.permissions.getAccess(user.tenantId, user.userId);

    const ctx = TenantContext.get();
    if (ctx) {
      ctx.permissions = access.permissions;
      ctx.scope = access.scope;
    }

    if (!required) return true;
    if (!access.permissions.has(required)) {
      throw new ForbiddenException(`Missing permission: ${required}`);
    }
    return true;
  }
}
