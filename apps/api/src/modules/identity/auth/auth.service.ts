import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { MODULES, SYSTEM_ROLES } from '@aureus/shared';
import { PrismaService } from '../../../common/prisma.service';
import { PasswordService } from './password.service';
import { TokenService, type IssuedTokens } from './token.service';
import type { LoginDto, RegisterDto } from './dto/auth.dto';

export interface AuthResult extends IssuedTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    tenantId: string;
    tenantSlug: string;
    isTenantOwner: boolean;
  };
}

const TRIAL_DAYS = 14;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Self-serve signup: provisions the tenant, the system role catalog,
   * a full-feature trial, and the owner account — atomically.
   */
  async register(dto: RegisterDto, meta?: { userAgent?: string; ip?: string }): Promise<AuthResult> {
    const slug = await this.availableSlug(dto.tenantName);
    const passwordHash = await this.passwords.hash(dto.password);
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);

    const { user, tenant } = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug,
          status: 'TRIAL',
          trialEndsAt,
          country: dto.country ?? 'IN',
        },
      });

      await tx.moduleSubscription.createMany({
        data: MODULES.map((moduleCode) => ({
          tenantId: tenant.id,
          moduleCode,
          active: true, // trial = everything on; billing flips these later
        })),
      });

      for (const def of SYSTEM_ROLES) {
        await tx.role.create({
          data: {
            tenantId: tenant.id,
            code: def.code,
            name: def.name,
            description: def.description,
            isSystem: true,
            permissions: {
              createMany: {
                data: def.grants.map((permission) => ({
                  tenantId: tenant.id,
                  permission,
                })),
              },
            },
          },
        });
      }

      const ownerRole = await tx.role.findUniqueOrThrow({
        where: { tenantId_code: { tenantId: tenant.id, code: 'owner' } },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email.toLowerCase(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          status: 'ACTIVE',
          isTenantOwner: true,
          assignments: {
            create: {
              tenantId: tenant.id,
              roleId: ownerRole.id,
              scopeType: 'TENANT',
            },
          },
        },
      });

      return { user, tenant };
    });

    const issued = await this.tokens.issue(
      {
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        isTenantOwner: true,
      },
      meta,
    );

    return {
      ...issued,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        isTenantOwner: true,
      },
    };
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
    const candidates = await this.prisma.user.findMany({
      where: {
        email,
        deletedAt: null,
        ...(dto.tenantSlug ? { tenant: { slug: dto.tenantSlug } } : {}),
      },
      include: { tenant: true },
      take: 3,
    });

    if (candidates.length > 1) {
      throw new ConflictException({
        message: 'This email belongs to multiple workspaces — specify tenantSlug',
        code: 'TENANT_SLUG_REQUIRED',
        details: candidates.map((c) => ({ tenantSlug: c.tenant.slug, tenantName: c.tenant.name })),
      });
    }

    const user = candidates[0];
    // Verify against a dummy hash when the user is unknown so response
    // timing does not reveal account existence.
    const valid = await this.passwords.verify(
      dto.password,
      user?.passwordHash ?? 'scrypt:00000000000000000000000000000000:00',
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }
    if (user.tenant.status === 'SUSPENDED' || user.tenant.status === 'CHURNED') {
      throw new UnauthorizedException('Workspace is suspended — contact support');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const issued = await this.tokens.issue(
      {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        isTenantOwner: user.isTenantOwner,
      },
      meta,
    );

    return {
      ...issued,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        isTenantOwner: user.isTenantOwner,
      },
    };
  }

  refresh(refreshToken: string, meta?: { userAgent?: string; ip?: string }): Promise<IssuedTokens> {
    return this.tokens.rotate(refreshToken, meta);
  }

  logout(refreshToken: string): Promise<void> {
    return this.tokens.revoke(refreshToken);
  }

  private async availableSlug(tenantName: string): Promise<string> {
    const base =
      tenantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'workspace';

    const existing = await this.prisma.tenant.findUnique({ where: { slug: base } });
    if (!existing) return base;
    return `${base}-${randomBytes(3).toString('hex')}`;
  }
}
