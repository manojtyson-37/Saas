import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { TenantContext } from '../../../common/tenant-context';
import { toPage, type Page } from '../../../common/pagination';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';
import { PermissionsService } from '../permissions/permissions.service';
import type {
  AssignRoleDto,
  CreateUserDto,
  ListUsersQuery,
  UpdateUserDto,
} from './dto/users.dto';

const USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  status: true,
  isTenantOwner: true,
  lastLoginAt: true,
  createdAt: true,
  assignments: {
    select: {
      id: true,
      scopeType: true,
      companyId: true,
      locationId: true,
      role: { select: { id: true, code: true, name: true } },
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly passwords: PasswordService,
    private readonly permissions: PermissionsService,
  ) {}

  async list(query: ListUsersQuery): Promise<Page<{ id: string }>> {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;
    const rows = await this.prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(query.search
          ? {
              OR: [
                { email: { contains: query.search, mode: 'insensitive' } },
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      take: limit + 1,
      select: USER_SELECT,
    });
    return toPage(rows, limit);
  }

  async get(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const tenantId = TenantContext.requireTenantId();
    const email = dto.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash: dto.password ? await this.passwords.hash(dto.password) : null,
        posPinHash: dto.posPin ? await this.passwords.hash(dto.posPin) : null,
        status: dto.password ? 'ACTIVE' : 'INVITED',
      },
      select: USER_SELECT,
    });

    await this.audit.log({
      action: 'identity.user:create',
      entityType: 'user',
      entityId: user.id,
      after: { email: user.email, firstName: user.firstName, status: user.status },
    });
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const tenantId = TenantContext.requireTenantId();
    const before = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!before) throw new NotFoundException('User not found');
    if (before.isTenantOwner && dto.status === 'SUSPENDED') {
      throw new ForbiddenException('The tenant owner cannot be suspended');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: dto.status,
        ...(dto.posPin ? { posPinHash: await this.passwords.hash(dto.posPin) } : {}),
      },
      select: USER_SELECT,
    });

    await this.audit.log({
      action: 'identity.user:update',
      entityType: 'user',
      entityId: id,
      before: { firstName: before.firstName, lastName: before.lastName, status: before.status },
      after: { firstName: user.firstName, lastName: user.lastName, status: user.status },
    });
    this.permissions.invalidateUser(tenantId, id);
    return user;
  }

  async remove(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.isTenantOwner) {
      throw new ForbiddenException('The tenant owner cannot be deleted');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'SUSPENDED' },
      }),
      this.prisma.refreshSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.audit.log({
      action: 'identity.user:delete',
      entityType: 'user',
      entityId: id,
      before: { email: user.email },
    });
    this.permissions.invalidateUser(tenantId, id);
  }

  async assignRole(userId: string, dto: AssignRoleDto) {
    const tenantId = TenantContext.requireTenantId();

    if (dto.scopeType === 'COMPANY' && !dto.companyId) {
      throw new BadRequestException('companyId is required for COMPANY scope');
    }
    if (dto.scopeType === 'LOCATION' && !dto.locationId) {
      throw new BadRequestException('locationId is required for LOCATION scope');
    }

    const [user, role] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: userId, tenantId, deletedAt: null } }),
      this.prisma.role.findFirst({ where: { id: dto.roleId, tenantId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!role) throw new NotFoundException('Role not found');

    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: { id: dto.companyId, tenantId, deletedAt: null },
      });
      if (!company) throw new NotFoundException('Company not found');
    }
    if (dto.locationId) {
      const location = await this.prisma.location.findFirst({
        where: { id: dto.locationId, tenantId, deletedAt: null },
      });
      if (!location) throw new NotFoundException('Location not found');
    }

    const duplicate = await this.prisma.userRoleAssignment.findFirst({
      where: {
        userId,
        roleId: dto.roleId,
        scopeType: dto.scopeType,
        companyId: dto.companyId ?? null,
        locationId: dto.locationId ?? null,
      },
    });
    if (duplicate) throw new ConflictException('This assignment already exists');

    const assignment = await this.prisma.userRoleAssignment.create({
      data: {
        tenantId,
        userId,
        roleId: dto.roleId,
        scopeType: dto.scopeType,
        companyId: dto.scopeType === 'COMPANY' ? dto.companyId : null,
        locationId: dto.scopeType === 'LOCATION' ? dto.locationId : null,
        createdBy: TenantContext.get()?.userId,
      },
      include: { role: { select: { code: true, name: true } } },
    });

    await this.audit.log({
      action: 'identity.user:assign-role',
      entityType: 'user_role_assignment',
      entityId: assignment.id,
      after: { userId, role: assignment.role.code, scopeType: dto.scopeType },
    });
    this.permissions.invalidateUser(tenantId, userId);
    return assignment;
  }

  async removeAssignment(userId: string, assignmentId: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const assignment = await this.prisma.userRoleAssignment.findFirst({
      where: { id: assignmentId, userId, tenantId },
      include: { role: true, user: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.user.isTenantOwner && assignment.role.code === 'owner') {
      throw new ForbiddenException("The tenant owner's owner role cannot be removed");
    }

    await this.prisma.userRoleAssignment.delete({ where: { id: assignmentId } });
    await this.audit.log({
      action: 'identity.user:assign-role',
      entityType: 'user_role_assignment',
      entityId: assignmentId,
      before: { userId, role: assignment.role.code, scopeType: assignment.scopeType },
    });
    this.permissions.invalidateUser(tenantId, userId);
  }
}
