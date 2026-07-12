import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../../common/prisma.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  AssetQueryDto,
  CreateAmcDto,
  CreateAssetDto,
  CreateMaintenanceTicketDto,
  RunDepreciationDto,
  UpdateAssetDto,
  UpdateMaintenanceTicketDto,
} from './dto/assets.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private ctx(): { tenantId: string; userId: string | undefined } {
    const c = TenantContext.get();
    if (!c?.tenantId) throw new BadRequestException('No tenant context');
    return { tenantId: c.tenantId, userId: c.userId };
  }

  // ─── Assets ─────────────────────────────────────────────────────────────────

  async createAsset(dto: CreateAssetDto) {
    const { tenantId, userId } = this.ctx();

    const existing = await this.prisma.asset.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Asset code '${dto.code}' already exists`);

    const asset = await this.prisma.asset.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        locationId: dto.locationId,
        name: dto.name,
        code: dto.code,
        category: dto.category,
        purchaseDate: new Date(dto.purchaseDate),
        purchaseCost: new Decimal(dto.purchaseCost),
        salvageValue: dto.salvageValue !== undefined ? new Decimal(dto.salvageValue) : new Decimal(0),
        usefulLifeMonths: dto.usefulLifeMonths,
        depreciationMethod: dto.depreciationMethod as any ?? 'STRAIGHT_LINE',
        vendorId: dto.vendorId,
        serialNumber: dto.serialNumber,
        warrantyUntil: dto.warrantyUntil ? new Date(dto.warrantyUntil) : undefined,
      },
    });

    await this.audit.log({
      action: 'assets.asset:create',
      entityType: 'asset',
      entityId: asset.id,
      after: { code: asset.code, name: asset.name, purchaseCost: dto.purchaseCost, createdBy: userId },
    });
    return asset;
  }

  async listAssets(dto: AssetQueryDto) {
    const { tenantId } = this.ctx();
    const limit = dto.limit ?? 50;
    return this.prisma.asset.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(dto.companyId ? { companyId: dto.companyId } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.status ? { status: dto.status as any } : {}),
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async getAsset(id: string) {
    const { tenantId } = this.ctx();
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        depreciationEntries: { orderBy: { period: 'desc' }, take: 12 },
        amcContracts: { orderBy: { endDate: 'desc' } },
        maintenanceTickets: { where: { status: { not: 'CLOSED' } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async updateAsset(id: string, dto: UpdateAssetDto) {
    const { tenantId } = this.ctx();
    const asset = await this.prisma.asset.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.asset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.status !== undefined ? { status: dto.status as any } : {}),
        ...(dto.locationId !== undefined ? { locationId: dto.locationId } : {}),
        ...(dto.warrantyUntil !== undefined ? { warrantyUntil: new Date(dto.warrantyUntil) } : {}),
        ...(dto.disposedAt !== undefined
          ? { disposedAt: new Date(dto.disposedAt), status: 'DISPOSED' }
          : {}),
      },
    });
  }

  // ─── Depreciation ────────────────────────────────────────────────────────────

  async runDepreciation(dto: RunDepreciationDto) {
    const { tenantId, userId } = this.ctx();

    const assets = await this.prisma.asset.findMany({
      where: {
        tenantId,
        companyId: dto.companyId,
        status: 'IN_USE',
        deletedAt: null,
      },
    });

    let posted = 0;
    let skipped = 0;

    for (const asset of assets) {
      const existing = await this.prisma.depreciationEntry.findUnique({
        where: { assetId_period: { assetId: asset.id, period: dto.period } },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const purchaseCost = new Decimal(asset.purchaseCost);
      const salvageValue = new Decimal(asset.salvageValue);
      const accumulated = new Decimal(asset.accumulatedDepreciation);
      const bookValue = purchaseCost.minus(accumulated);

      if (bookValue.lessThanOrEqualTo(salvageValue)) {
        skipped++;
        continue;
      }

      let monthlyAmount: Decimal;
      if (asset.depreciationMethod === 'STRAIGHT_LINE') {
        monthlyAmount = purchaseCost.minus(salvageValue).dividedBy(asset.usefulLifeMonths);
      } else {
        // WDV: double-declining balance monthly rate
        const annualRate = new Decimal(2).dividedBy(asset.usefulLifeMonths).times(12);
        monthlyAmount = bookValue.times(annualRate).dividedBy(12);
      }

      // Never depreciate below salvage value
      monthlyAmount = Decimal.min(monthlyAmount, bookValue.minus(salvageValue));

      await this.prisma.$transaction(async (tx) => {
        await tx.depreciationEntry.create({
          data: {
            tenantId,
            assetId: asset.id,
            period: dto.period,
            amount: monthlyAmount,
          },
        });

        await tx.asset.update({
          where: { id: asset.id },
          data: { accumulatedDepreciation: { increment: monthlyAmount } },
        });
      });

      posted++;
    }

    await this.audit.log({
      action: 'assets.depreciation:run',
      entityType: 'depreciation_run',
      after: { companyId: dto.companyId, period: dto.period, posted, skipped, runBy: userId },
    });

    return { period: dto.period, posted, skipped, total: assets.length };
  }

  // ─── AMC Contracts ───────────────────────────────────────────────────────────

  async createAmc(dto: CreateAmcDto) {
    const { tenantId } = this.ctx();
    const asset = await this.prisma.asset.findFirst({ where: { id: dto.assetId, tenantId } });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.amcContract.create({
      data: {
        tenantId,
        assetId: dto.assetId,
        vendorId: dto.vendorId,
        contractNumber: dto.contractNumber,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        cost: new Decimal(dto.cost),
        coverage: dto.coverage,
        reminderDaysBefore: dto.reminderDaysBefore ?? 30,
      },
    });
  }

  async listAmcs(assetId: string) {
    const { tenantId } = this.ctx();
    return this.prisma.amcContract.findMany({
      where: { tenantId, assetId },
      orderBy: { endDate: 'desc' },
    });
  }

  async upcomingAmcRenewals(daysAhead = 30) {
    const { tenantId } = this.ctx();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    return this.prisma.amcContract.findMany({
      where: { tenantId, endDate: { lte: cutoff, gte: new Date() } },
      include: { asset: { select: { name: true, code: true } } },
      orderBy: { endDate: 'asc' },
    });
  }

  // ─── Maintenance Tickets ─────────────────────────────────────────────────────

  async createMaintenanceTicket(dto: CreateMaintenanceTicketDto) {
    const { tenantId, userId } = this.ctx();
    const asset = await this.prisma.asset.findFirst({ where: { id: dto.assetId, tenantId } });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.maintenanceTicket.create({
      data: {
        tenantId,
        assetId: dto.assetId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 0,
        isPreventive: dto.isPreventive ?? false,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
        assignedTo: dto.assignedTo,
        createdBy: userId,
      },
    });
  }

  async listMaintenanceTickets(assetId?: string) {
    const { tenantId } = this.ctx();
    return this.prisma.maintenanceTicket.findMany({
      where: {
        tenantId,
        ...(assetId ? { assetId } : {}),
      },
      include: { asset: { select: { name: true, code: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updateMaintenanceTicket(id: string, dto: UpdateMaintenanceTicketDto) {
    const { tenantId } = this.ctx();
    const ticket = await this.prisma.maintenanceTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Maintenance ticket not found');

    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status as any } : {}),
        ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo } : {}),
        ...(dto.cost !== undefined ? { cost: new Decimal(dto.cost) } : {}),
        ...(dto.resolvedAt !== undefined ? { resolvedAt: new Date(dto.resolvedAt) } : {}),
      },
    });
  }
}
