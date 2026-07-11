import { SetMetadata } from '@nestjs/common';
import { isPermission, type Permission } from '@aureus/shared';

export const PERMISSION_KEY = 'requiredPermission';

/**
 * Declares the permission a route requires. Validates against the shared
 * catalog at module-definition time so a typo fails the boot, not a request.
 */
export function RequirePermission(permission: Permission) {
  if (!isPermission(permission)) {
    throw new Error(`Unknown permission "${permission}" — add it to @aureus/shared permissions.ts`);
  }
  return SetMetadata(PERMISSION_KEY, permission);
}
