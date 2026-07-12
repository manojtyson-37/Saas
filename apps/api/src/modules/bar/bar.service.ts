import {
  BadRequestException,
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
  BarVarianceQueryDto,
  BottleQueryDto,
  OpenBottleDto,
  PourQueryDto,
  RecordPourDto,
  RegisterBottleDto,
  UpdateBottleStatusDto,
} from './dto/bar.dto';

@Injectable()
export class BarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private ctx(): { tenantId: string; userId: string | undefined } {
    const c = TenantContext.get();
    if (!c?.tenantId) throw new BadRequestException('No tenant context');
    return { tenantId: c.tenantId, userId: c.userId };
  }

  // ─── Bottles ─────────────────────────────────────────────────────────────────

  async registerBottle(dto: RegisterBottleDto) {
    const { tenantId, userId } = this.ctx();

    const bottle = await this.prisma.barBottle.create({
      data: {
        tenantId,
        itemId: dto.itemId,
        storeId: dto.storeId,
        batchId: dto.batchId,
        volumeMl: new Decimal(dto.volumeMl),
        remainingMl: new Decimal(dto.volumeMl),
      },
    });

    await this.audit.log({
      action: 'bar.bottle:register',
      entityType: 'bar_bottle',
      entityId: bottle.id,
      after: { itemId: dto.itemId, storeId: dto.storeId, volumeMl: dto.volumeMl, registeredBy: userId },
    });
    return bottle;
  }

  async openBottle(dto: OpenBottleDto) {
    const { tenantId, userId } = this.ctx();
    const bottle = await this.prisma.barBottle.findFirst({
      where: { id: dto.bottleId, tenantId },
    });
    if (!bottle) throw new NotFoundException('Bottle not found');
    if (bottle.status !== 'SEALED') {
      throw new BadRequestException(`Bottle is already ${bottle.status}`);
    }

    const updated = await this.prisma.barBottle.update({
      where: { id: dto.bottleId },
      data: { status: 'OPEN', openedAt: new Date(), openedBy: userId },
    });

    await this.audit.log({
      action: 'bar.bottle:open',
      entityType: 'bar_bottle',
      entityId: bottle.id,
      before: { status: 'SEALED' },
      after: { status: 'OPEN', openedBy: userId },
    });
    return updated;
  }

  async updateBottleStatus(id: string, dto: UpdateBottleStatusDto) {
    const { tenantId, userId } = this.ctx();
    const bottle = await this.prisma.barBottle.findFirst({ where: { id, tenantId } });
    if (!bottle) throw new NotFoundException('Bottle not found');

    const data: Prisma.BarBottleUpdateInput = { status: dto.status as any };
    if (dto.status === 'EMPTY') data.emptiedAt = new Date();

    const updated = await this.prisma.barBottle.update({ where: { id }, data });

    await this.audit.log({
      action: 'bar.bottle:update-status',
      entityType: 'bar_bottle',
      entityId: id,
      before: { status: bottle.status },
      after: { status: dto.status, updatedBy: userId },
    });
    return updated;
  }

  async listBottles(dto: BottleQueryDto) {
    const { tenantId } = this.ctx();
    return this.prisma.barBottle.findMany({
      where: {
        tenantId,
        ...(dto.storeId ? { storeId: dto.storeId } : {}),
        ...(dto.itemId ? { itemId: dto.itemId } : {}),
        ...(dto.status ? { status: dto.status as any } : {}),
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: 50,
    });
  }

  async getBottle(id: string) {
    const { tenantId } = this.ctx();
    const bottle = await this.prisma.barBottle.findFirst({
      where: { id, tenantId },
      include: {
        pours: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!bottle) throw new NotFoundException('Bottle not found');
    return bottle;
  }

  // ─── Pours ───────────────────────────────────────────────────────────────────

  async recordPour(dto: RecordPourDto) {
    const { tenantId, userId } = this.ctx();
    const bottle = await this.prisma.barBottle.findFirst({ where: { id: dto.bottleId, tenantId } });
    if (!bottle) throw new NotFoundException('Bottle not found');
    if (bottle.status !== 'OPEN') {
      throw new BadRequestException(`Bottle must be OPEN to record a pour (current: ${bottle.status})`);
    }

    const volume = new Decimal(dto.volumeMl);
    const remaining = new Decimal(bottle.remainingMl);
    if (remaining.lessThan(volume)) {
      throw new BadRequestException(
        `Pour volume ${dto.volumeMl}ml exceeds remaining ${bottle.remainingMl}ml`,
      );
    }

    const newRemaining = remaining.minus(volume);

    const pour = await this.prisma.$transaction(async (tx) => {
      const p = await tx.barPour.create({
        data: {
          tenantId,
          bottleId: dto.bottleId,
          type: dto.type as any,
          volumeMl: volume,
          orderItemId: dto.orderItemId,
          reason: dto.reason,
          pouredBy: userId,
        },
      });

      await tx.barBottle.update({
        where: { id: dto.bottleId },
        data: {
          remainingMl: newRemaining,
          status: newRemaining.isZero() ? 'EMPTY' : 'OPEN',
          ...(newRemaining.isZero() ? { emptiedAt: new Date() } : {}),
        },
      });

      return p;
    });

    return pour;
  }

  async listPours(dto: PourQueryDto) {
    const { tenantId } = this.ctx();
    return this.prisma.barPour.findMany({
      where: {
        tenantId,
        ...(dto.bottleId ? { bottleId: dto.bottleId } : {}),
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: 100,
    });
  }

  // ─── Variance Report ─────────────────────────────────────────────────────────

  async getVarianceReport(dto: BarVarianceQueryDto) {
    const { tenantId } = this.ctx();

    const fromDate = dto.fromDate ? new Date(dto.fromDate) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    })();
    const toDate = dto.toDate ? new Date(dto.toDate) : new Date();

    // Fetch all pours in the date range grouped by bottle/item
    const pours = await this.prisma.barPour.findMany({
      where: {
        tenantId,
        createdAt: { gte: fromDate, lte: toDate },
        ...(dto.storeId
          ? { bottle: { storeId: dto.storeId } }
          : {}),
      },
      include: { bottle: { select: { itemId: true, storeId: true, volumeMl: true } } },
    });

    // Aggregate by itemId: total poured vs expected (SALE only)
    const byItem = new Map<string, { itemId: string; sale: Decimal; waste: Decimal; spillage: Decimal; complimentary: Decimal; sample: Decimal; total: Decimal }>();

    for (const pour of pours) {
      const key = pour.bottle.itemId;
      if (!byItem.has(key)) {
        byItem.set(key, {
          itemId: key,
          sale: new Decimal(0),
          waste: new Decimal(0),
          spillage: new Decimal(0),
          complimentary: new Decimal(0),
          sample: new Decimal(0),
          total: new Decimal(0),
        });
      }
      const entry = byItem.get(key)!;
      const vol = new Decimal(pour.volumeMl);
      entry.total = entry.total.plus(vol);
      switch (pour.type) {
        case 'SALE': entry.sale = entry.sale.plus(vol); break;
        case 'WASTE': entry.waste = entry.waste.plus(vol); break;
        case 'SPILLAGE': entry.spillage = entry.spillage.plus(vol); break;
        case 'COMPLIMENTARY': entry.complimentary = entry.complimentary.plus(vol); break;
        case 'SAMPLE': entry.sample = entry.sample.plus(vol); break;
      }
    }

    return {
      fromDate,
      toDate,
      items: [...byItem.values()].map((e) => ({
        itemId: e.itemId,
        totalMl: e.total.toFixed(2),
        saleMl: e.sale.toFixed(2),
        wasteMl: e.waste.toFixed(2),
        spillageMl: e.spillage.toFixed(2),
        complimentaryMl: e.complimentary.toFixed(2),
        sampleMl: e.sample.toFixed(2),
        variancePct: e.total.isZero()
          ? '0.00'
          : e.waste.plus(e.spillage).dividedBy(e.total).times(100).toFixed(2),
      })),
    };
  }

  // ─── Excise Summary (computed from pours) ────────────────────────────────────

  async getExciseSummary(period: string) {
    const { tenantId } = this.ctx();

    // Parse YYYY-MM period
    const [year, month] = period.split('-').map(Number);
    if (!year || !month || month < 1 || month > 12) {
      throw new BadRequestException('Period must be in YYYY-MM format');
    }
    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0, 23, 59, 59);

    const pours = await this.prisma.barPour.findMany({
      where: { tenantId, createdAt: { gte: fromDate, lte: toDate } },
      include: { bottle: { select: { itemId: true } } },
    });

    // Group by itemId
    const byItem = new Map<string, { itemId: string; openedBottles: Set<string>; soldMl: Decimal; wasteMl: Decimal }>();

    for (const pour of pours) {
      const key = pour.bottle.itemId;
      if (!byItem.has(key)) {
        byItem.set(key, { itemId: key, openedBottles: new Set(), soldMl: new Decimal(0), wasteMl: new Decimal(0) });
      }
      const entry = byItem.get(key)!;
      entry.openedBottles.add(pour.bottleId);
      const vol = new Decimal(pour.volumeMl);
      if (pour.type === 'SALE') entry.soldMl = entry.soldMl.plus(vol);
      else entry.wasteMl = entry.wasteMl.plus(vol);
    }

    return {
      period,
      fromDate,
      toDate,
      items: [...byItem.values()].map((e) => ({
        itemId: e.itemId,
        bottlesOpened: e.openedBottles.size,
        soldMl: e.soldMl.toFixed(2),
        wasteMl: e.wasteMl.toFixed(2),
      })),
    };
  }
}
