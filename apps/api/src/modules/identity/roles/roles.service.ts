import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { expandGrant } from '@aureus/shared';
import { PrismaService } from '../../../common/prisma.service';
import { TenantContext } from '../../../common/tenant-context';
import { AuditService } from '../audit/audit.service';
import { PermissionsService } from '../permissions/permissions.service';
import type { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly permissions: PermissionsService,
  ) {}

  async list() {
    const tenantId = TenantContext.requireTenantId();
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        permissions: { select: { permission: true } },
        _count: { select: { assignments: true } },
      },
    });
    return roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      grants: r.permissions.map((p) => p.permission),
      assignmentCount: r._count.assignments,
    }));
  }

  async get(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: { permissions: { select: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      grants: role.permissions.map((p) => p.permission),
    };
  }

  async create(dto: CreateRoleDto) {
    const tenantId = TenantContext.requireTenantId();
    this.validateGrants(dto.grants);

    const existing = await this.prisma.role.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Role code "${dto.code}" already exists`);

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        isSystem: false,
        permissions: {
          createMany: {
            data: [...new Set(dto.grants)].map((permission) => ({ tenantId, permission })),
          },
        },
      },
    });

    await this.audit.log({
      action: 'identity.role:create',
      entityType: 'role',
      entityId: role.id,
      after: { code: dto.code, name: dto.name, grants: dto.grants },
    });
    return this.get(role.id);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const tenantId = TenantContext.requireTenantId();
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: { permissions: { select: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be edited — clone into a custom role');
    }
    if (dto.grants) this.validateGrants(dto.grants);

    await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { name: dto.name, description: dto.description },
      });
      if (dto.grants) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        await tx.rolePermission.createMany({
          data: [...new Set(dto.grants)].map((permission) => ({
            tenantId,
            roleId: id,
            permission,
          })),
        });
      }
    });

    await this.audit.log({
      action: 'identity.role:update',
      entityType: 'role',
      entityId: id,
      before: { name: role.name, grants: role.permissions.map((p) => p.permission) },
      after: { name: dto.name ?? role.name, grants: dto.grants },
    });
    this.permissions.invalidateTenant(tenantId);
    return this.get(id);
  }

  async remove(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { assignments: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ForbiddenException('System roles cannot be deleted');
    if (role._count.assignments > 0) {
      throw new ConflictException(
        `Role is assigned to ${role._count.assignments} user(s) — unassign first`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    await this.audit.log({
      action: 'identity.role:delete',
      entityType: 'role',
      entityId: id,
      before: { code: role.code, name: role.name },
    });
    this.permissions.invalidateTenant(tenantId);
  }

  private validateGrants(grants: string[]): void {
    const invalid = grants.filter((g) => expandGrant(g).length === 0);
    if (invalid.length > 0) {
      throw new BadRequestException({
        message: 'Unknown permission grants',
        details: invalid.map((g) => ({ field: 'grants', issue: 'unknown', value: g })),
      });
    }
  }
}
