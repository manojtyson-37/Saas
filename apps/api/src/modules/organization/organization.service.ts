import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  CreateBrandDto,
  CreateCompanyDto,
  CreateFloorDto,
  CreateLocationDto,
  CreateOutletDto,
  CreateStoreDto,
  CreateTableDto,
  CreateTerminalDto,
  UpdateBrandDto,
  UpdateCompanyDto,
  UpdateLocationDto,
  UpdateOutletDto,
  UpdateStoreDto,
  UpdateTableDto,
  UpdateTerminalDto,
} from './dto/organization.dto';
import { randomBytes, randomInt } from 'node:crypto';

/**
 * Organization bounded context: the tenant's physical & legal hierarchy.
 * Every read respects the caller's data-visibility scope (location/company
 * scoped role assignments); every mutation is audited.
 */
@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── scope helpers ─────────────────────────────────────────────────────────

  /** Location filter respecting the caller's role-assignment scope. */
  private locationScopeFilter(): Record<string, unknown> {
    const scope = TenantContext.get()?.scope;
    if (!scope || scope.tenantWide) return {};
    return {
      OR: [
        { id: { in: [...scope.locationIds] } },
        { companyId: { in: [...scope.companyIds] } },
      ],
    };
  }

  private async assertCompany(companyId: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, tenantId, deletedAt: null },
    });
    if (!company) throw new NotFoundException('Company not found');
  }

  private async assertLocation(locationId: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null },
    });
    if (!location) throw new NotFoundException('Location not found');
  }

  // ── companies ─────────────────────────────────────────────────────────────

  listCompanies() {
    const tenantId = TenantContext.requireTenantId();
    const scope = TenantContext.get()?.scope;
    return this.prisma.company.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(scope && !scope.tenantWide && scope.companyIds.length > 0
          ? { id: { in: [...scope.companyIds] } }
          : {}),
      },
      orderBy: { name: 'asc' },
      include: { _count: { select: { brands: true, locations: true } } },
    });
  }

  async getCompany(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        brands: { where: { deletedAt: null } },
        locations: { where: { deletedAt: null } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async createCompany(dto: CreateCompanyDto) {
    const tenantId = TenantContext.requireTenantId();
    await this.assertUniqueCode('company', dto.code);
    const company = await this.prisma.company.create({
      data: { tenantId, ...dto },
    });
    await this.audit.log({
      action: 'organization.company:create',
      entityType: 'company',
      entityId: company.id,
      after: { name: company.name, code: company.code },
    });
    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    const tenantId = TenantContext.requireTenantId();
    const before = await this.prisma.company.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Company not found');
    const company = await this.prisma.company.update({ where: { id }, data: dto });
    await this.audit.log({
      action: 'organization.company:update',
      entityType: 'company',
      entityId: id,
      before: { name: before.name, isActive: before.isActive },
      after: { name: company.name, isActive: company.isActive },
    });
    return company;
  }

  async deleteCompany(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { locations: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company._count.locations > 0) {
      throw new ConflictException('Company has locations — delete or move them first');
    }
    await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.log({
      action: 'organization.company:delete',
      entityType: 'company',
      entityId: id,
      before: { name: company.name, code: company.code },
    });
  }

  // ── brands ────────────────────────────────────────────────────────────────

  listBrands(companyId?: string) {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.brand.findMany({
      where: { tenantId, deletedAt: null, ...(companyId ? { companyId } : {}) },
      orderBy: { name: 'asc' },
      include: { _count: { select: { locations: true } } },
    });
  }

  async createBrand(dto: CreateBrandDto) {
    const tenantId = TenantContext.requireTenantId();
    await this.assertCompany(dto.companyId);
    await this.assertUniqueCode('brand', dto.code);
    const brand = await this.prisma.brand.create({ data: { tenantId, ...dto } });
    await this.audit.log({
      action: 'organization.brand:create',
      entityType: 'brand',
      entityId: brand.id,
      after: { name: brand.name, code: brand.code },
    });
    return brand;
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const tenantId = TenantContext.requireTenantId();
    const before = await this.prisma.brand.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Brand not found');
    const brand = await this.prisma.brand.update({ where: { id }, data: dto });
    await this.audit.log({
      action: 'organization.brand:update',
      entityType: 'brand',
      entityId: id,
      before: { name: before.name },
      after: { name: brand.name },
    });
    return brand;
  }

  async deleteBrand(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const brand = await this.prisma.brand.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { locations: true } } },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    if (brand._count.locations > 0) {
      throw new ConflictException('Brand has locations — reassign them first');
    }
    await this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.log({
      action: 'organization.brand:delete',
      entityType: 'brand',
      entityId: id,
      before: { name: brand.name },
    });
  }

  // ── locations ─────────────────────────────────────────────────────────────

  listLocations(filters: { companyId?: string; brandId?: string }) {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.location.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters.companyId ? { companyId: filters.companyId } : {}),
        ...(filters.brandId ? { brandId: filters.brandId } : {}),
        ...this.locationScopeFilter(),
      },
      orderBy: { name: 'asc' },
      include: {
        brand: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { outlets: true, stores: true } },
      },
    });
  }

  async getLocation(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId, deletedAt: null, ...this.locationScopeFilter() },
      include: {
        outlets: { where: { deletedAt: null } },
        stores: { where: { deletedAt: null } },
        kitchenStations: true,
      },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async createLocation(dto: CreateLocationDto) {
    const tenantId = TenantContext.requireTenantId();
    await this.assertCompany(dto.companyId);
    if (dto.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: dto.brandId, tenantId, companyId: dto.companyId, deletedAt: null },
      });
      if (!brand) throw new NotFoundException('Brand not found in this company');
    }
    await this.assertUniqueCode('location', dto.code);
    const location = await this.prisma.location.create({ data: { tenantId, ...dto } });
    await this.audit.log({
      action: 'organization.location:create',
      entityType: 'location',
      entityId: location.id,
      after: { name: location.name, code: location.code, type: location.type },
    });
    return location;
  }

  async updateLocation(id: string, dto: UpdateLocationDto) {
    const tenantId = TenantContext.requireTenantId();
    const before = await this.prisma.location.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Location not found');
    const location = await this.prisma.location.update({ where: { id }, data: dto });
    await this.audit.log({
      action: 'organization.location:update',
      entityType: 'location',
      entityId: id,
      before: { name: before.name, isActive: before.isActive },
      after: { name: location.name, isActive: location.isActive },
    });
    return location;
  }

  async deleteLocation(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { outlets: true, stores: true } } },
    });
    if (!location) throw new NotFoundException('Location not found');
    if (location._count.outlets > 0 || location._count.stores > 0) {
      throw new ConflictException('Location has outlets/stores — delete them first');
    }
    await this.prisma.location.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.log({
      action: 'organization.location:delete',
      entityType: 'location',
      entityId: id,
      before: { name: location.name },
    });
  }

  // ── outlets / floors / tables ─────────────────────────────────────────────

  listOutlets(locationId?: string) {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.outlet.findMany({
      where: { tenantId, deletedAt: null, ...(locationId ? { locationId } : {}) },
      orderBy: { name: 'asc' },
      include: {
        location: { select: { id: true, name: true } },
        _count: { select: { floors: true, terminals: true } },
      },
    });
  }

  async getOutlet(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        floors: {
          orderBy: { sortOrder: 'asc' },
          include: { tables: { where: { isActive: true }, orderBy: { name: 'asc' } } },
        },
        terminals: true,
      },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    return outlet;
  }

  async createOutlet(dto: CreateOutletDto) {
    const tenantId = TenantContext.requireTenantId();
    await this.assertLocation(dto.locationId);
    await this.assertUniqueCode('outlet', dto.code);
    const outlet = await this.prisma.outlet.create({ data: { tenantId, ...dto } });
    await this.audit.log({
      action: 'organization.outlet:create',
      entityType: 'outlet',
      entityId: outlet.id,
      after: { name: outlet.name, code: outlet.code, type: outlet.type },
    });
    return outlet;
  }

  async updateOutlet(id: string, dto: UpdateOutletDto) {
    const tenantId = TenantContext.requireTenantId();
    const before = await this.prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Outlet not found');
    const outlet = await this.prisma.outlet.update({ where: { id }, data: dto });
    await this.audit.log({
      action: 'organization.outlet:update',
      entityType: 'outlet',
      entityId: id,
      before: { name: before.name, isActive: before.isActive },
      after: { name: outlet.name, isActive: outlet.isActive },
    });
    return outlet;
  }

  async deleteOutlet(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    await this.prisma.outlet.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.log({
      action: 'organization.outlet:delete',
      entityType: 'outlet',
      entityId: id,
      before: { name: outlet.name },
    });
  }

  async createFloor(outletId: string, dto: CreateFloorDto) {
    const tenantId = TenantContext.requireTenantId();
    const outlet = await this.prisma.outlet.findFirst({
      where: { id: outletId, tenantId, deletedAt: null },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    const floor = await this.prisma.floor.create({
      data: { tenantId, outletId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log({
      action: 'organization.table:manage',
      entityType: 'floor',
      entityId: floor.id,
      after: { name: floor.name, outletId },
    });
    return floor;
  }

  async deleteFloor(floorId: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const floor = await this.prisma.floor.findFirst({
      where: { id: floorId, tenantId },
      include: { _count: { select: { tables: true } } },
    });
    if (!floor) throw new NotFoundException('Floor not found');
    if (floor._count.tables > 0) {
      throw new ConflictException('Floor has tables — remove them first');
    }
    await this.prisma.floor.delete({ where: { id: floorId } });
    await this.audit.log({
      action: 'organization.table:manage',
      entityType: 'floor',
      entityId: floorId,
      before: { name: floor.name },
    });
  }

  async createTable(floorId: string, dto: CreateTableDto) {
    const tenantId = TenantContext.requireTenantId();
    const floor = await this.prisma.floor.findFirst({ where: { id: floorId, tenantId } });
    if (!floor) throw new NotFoundException('Floor not found');
    const duplicate = await this.prisma.diningTable.findFirst({
      where: { tenantId, floorId, name: dto.name, isActive: true },
    });
    if (duplicate) throw new ConflictException(`Table "${dto.name}" already exists on this floor`);
    const table = await this.prisma.diningTable.create({
      data: {
        tenantId,
        floorId,
        name: dto.name,
        capacity: dto.capacity ?? 4,
        posX: dto.posX ?? 0,
        posY: dto.posY ?? 0,
        shape: dto.shape ?? 'square',
        qrToken: randomBytes(16).toString('base64url'),
      },
    });
    await this.audit.log({
      action: 'organization.table:manage',
      entityType: 'dining_table',
      entityId: table.id,
      after: { name: table.name, floorId },
    });
    return table;
  }

  async updateTable(tableId: string, dto: UpdateTableDto) {
    const tenantId = TenantContext.requireTenantId();
    const before = await this.prisma.diningTable.findFirst({
      where: { id: tableId, tenantId },
    });
    if (!before) throw new NotFoundException('Table not found');
    const table = await this.prisma.diningTable.update({ where: { id: tableId }, data: dto });
    await this.audit.log({
      action: 'organization.table:manage',
      entityType: 'dining_table',
      entityId: tableId,
      before: { name: before.name, capacity: before.capacity },
      after: { name: table.name, capacity: table.capacity },
    });
    return table;
  }

  // ── stores ────────────────────────────────────────────────────────────────

  listStores(locationId?: string) {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.store.findMany({
      where: { tenantId, deletedAt: null, ...(locationId ? { locationId } : {}) },
      orderBy: { name: 'asc' },
      include: { location: { select: { id: true, name: true } } },
    });
  }

  async createStore(dto: CreateStoreDto) {
    const tenantId = TenantContext.requireTenantId();
    await this.assertLocation(dto.locationId);
    await this.assertUniqueCode('store', dto.code);
    const store = await this.prisma.store.create({ data: { tenantId, ...dto } });
    await this.audit.log({
      action: 'organization.store:manage',
      entityType: 'store',
      entityId: store.id,
      after: { name: store.name, code: store.code, type: store.type },
    });
    return store;
  }

  async updateStore(id: string, dto: UpdateStoreDto) {
    const tenantId = TenantContext.requireTenantId();
    const before = await this.prisma.store.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Store not found');
    const store = await this.prisma.store.update({ where: { id }, data: dto });
    await this.audit.log({
      action: 'organization.store:manage',
      entityType: 'store',
      entityId: id,
      before: { name: before.name, allowNegativeStock: before.allowNegativeStock },
      after: { name: store.name, allowNegativeStock: store.allowNegativeStock },
    });
    return store;
  }

  // ── terminals ─────────────────────────────────────────────────────────────

  listTerminals(outletId?: string) {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.posTerminal.findMany({
      where: { tenantId, ...(outletId ? { outletId } : {}) },
      orderBy: { name: 'asc' },
      include: { outlet: { select: { id: true, name: true } } },
    });
  }

  async createTerminal(dto: CreateTerminalDto) {
    const tenantId = TenantContext.requireTenantId();
    const outlet = await this.prisma.outlet.findFirst({
      where: { id: dto.outletId, tenantId, deletedAt: null },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    await this.assertUniqueCode('posTerminal', dto.code);
    const terminal = await this.prisma.posTerminal.create({
      data: {
        tenantId,
        ...dto,
        activationCode: generateActivationCode(),
      },
    });
    await this.audit.log({
      action: 'organization.terminal:manage',
      entityType: 'pos_terminal',
      entityId: terminal.id,
      after: { name: terminal.name, code: terminal.code },
    });
    return terminal;
  }

  async updateTerminal(id: string, dto: UpdateTerminalDto) {
    const tenantId = TenantContext.requireTenantId();
    const before = await this.prisma.posTerminal.findFirst({ where: { id, tenantId } });
    if (!before) throw new NotFoundException('Terminal not found');
    const terminal = await this.prisma.posTerminal.update({ where: { id }, data: dto });
    await this.audit.log({
      action: 'organization.terminal:manage',
      entityType: 'pos_terminal',
      entityId: id,
      before: { status: before.status },
      after: { status: terminal.status },
    });
    return terminal;
  }

  /** Rotates the pairing code used by a device to claim this terminal. */
  async regenerateActivationCode(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const terminal = await this.prisma.posTerminal.findFirst({ where: { id, tenantId } });
    if (!terminal) throw new NotFoundException('Terminal not found');
    const updated = await this.prisma.posTerminal.update({
      where: { id },
      data: { activationCode: generateActivationCode(), status: 'PENDING_ACTIVATION' },
    });
    await this.audit.log({
      action: 'organization.terminal:manage',
      entityType: 'pos_terminal',
      entityId: id,
      after: { event: 'activation-code-rotated' },
    });
    return { id: updated.id, activationCode: updated.activationCode };
  }

  // ── shared ────────────────────────────────────────────────────────────────

  private async assertUniqueCode(
    model: 'company' | 'brand' | 'location' | 'outlet' | 'store' | 'posTerminal',
    code: string,
  ): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    // Every one of these models has a (tenantId, code) unique constraint.
    const delegate = this.prisma[model] as unknown as {
      findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    };
    const existing = await delegate.findFirst({ where: { tenantId, code } });
    if (existing) throw new ConflictException(`Code "${code}" is already in use`);
  }
}

function generateActivationCode(): string {
  return String(randomInt(100_000, 1_000_000)); // 6 digits
}
