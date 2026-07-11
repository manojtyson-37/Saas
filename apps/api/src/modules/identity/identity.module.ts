import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { PasswordService } from './auth/password.service';
import { TokenService } from './auth/token.service';
import { PermissionsService } from './permissions/permissions.service';
import { AuditService } from './audit/audit.service';
import { AuditController } from './audit/audit.controller';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';

/**
 * Identity bounded context: authentication, users, roles, permission
 * compilation and the audit trail. Global because PermissionsService and
 * AuditService are cross-cutting (guards + every module's services).
 */
@Global()
@Module({
  controllers: [AuthController, UsersController, RolesController, AuditController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    PermissionsService,
    AuditService,
    UsersService,
    RolesService,
  ],
  exports: [PermissionsService, AuditService, PasswordService],
})
export class IdentityModule {}
