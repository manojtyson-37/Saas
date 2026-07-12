import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../../common/prisma.service';
import { SequenceService, TENANT_SCOPE } from '../../common/sequence.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  CreateAdjustmentDto,
  CreateCountDto,
  CreateInventoryItemDto,
  CreateTransferDto,
  CreateUomConversionDto,
  CreateUomDto,
  EnterCountLineDto,
  ListQueryDto,
  PostOpeningStockDto,
  ReceiveTransferDto,
  SetReorderLevelDto,
  StockLedgerQueryDto,
  StockSummaryQueryDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';

/** Update or insert the stock summary and return the new weighted avg cost. */
async function upsertStockSummary(
  tx: PrismaService,
  tenantId: string,
  storeId: string,
  itemId: string,
  qtyDelta: Decimal,
  unitCost: Decimal,
): Promise<Decimal> {
  const existing = await tx.stockSummary.findUnique({
    where: { storeId_itemId: { storeId, itemId } },
  });

  let newAvgCost: Decimal;
  let newOnHand: Decimal;

  if (!existing) {
    newOnHand = qtyDelta;
    newAvgCost = qtyDelta.greaterThan(0) ? unitCost : new Decimal(0);
  } else {
    newOnHand = new Decimal(existing.onHand).plus(qtyDelta);
    if (qtyDelta.greaterThan(0)) {
      const numerator = new Decimal(existing.onHand)
        .times(existing.avgCost)
        .plus(qtyDelta.times(unitCost));
      newAvgCost = newOnHand.isZero() ? unitCost : numerator.dividedBy(newOnHand);
    } else {
      newAvgCost = new Decimal(existing.avgCost);
    }
  }

  await tx.stockSummary.upsert({
    where: { storeId_itemId: { storeId, itemId } },
    create: { tenantId, storeId, itemId, onHand: newOnHand, avgCost: newAvgCost },
    update: { onHand: newOnHand, avgCost: newAvgCost },
  });

  return newAvgCost;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seq: SequenceService,
    private readonly audit: AuditService,
  ) {}

  // ── UoMs ───────────────────────────────────────────────────────────────────

  listUoms() {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.uom.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  async createUom(dto: CreateUomDto) {
    const tenantId = TenantContext.requireTenantId();
    const existing = await this.prisma.uom.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new ConflictException(`UoM code "${dto.code}" already exists`);
    return this.prisma.uom.create({
      data: { tenantId, name: dto.name, code: dto.code, precision: dto.precision ?? 3 },
    });
  }

  async addUomConversion(itemId: string, dto: CreateUomConversionDto) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    const [from, to] = await Promise.all([
      this.prisma.uom.findFirst({ where: { id: dto.fromUomId, tenantId } }),
      this.prisma.uom.findFirst({ where: { id: dto.toUomId, tenantId } }),
    ]);
    if (!from) throw new NotFoundException('fromUom not found');
    if (!to) throw new NotFoundException('toUom not found');
    return this.prisma.uomConversion.upsert({
      where: { itemId_fromUomId_toUomId: { itemId, fromUomId: dto.fromUomId, toUomId: dto.toUomId } },
      create: { tenantId, itemId, fromUomId: dto.fromUomId, toUomId: dto.toUomId, factor: dto.factor },
      update: { factor: dto.factor },
    });
  }

  // ── inventory items ────────────────────────────────────────────────────────

  async listItems(query: ListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;

    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { code: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      },
      take: limit + 1,
      orderBy: { id: 'asc' },
      include: { reorderLevels: true },
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return { data: items, nextCursor: hasMore ? items[items.length - 1]?.id : null };
  }

  async getItem(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        reorderLevels: true,
      },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const summaries = await this.prisma.stockSummary.findMany({
      where: { tenantId, itemId: id },
    });

    return { ...item, stockSummaries: summaries };
  }

  async createItem(dto: CreateInventoryItemDto) {
    const tenantId = TenantContext.requireTenantId();
    const existing = await this.prisma.inventoryItem.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new ConflictException(`Item code "${dto.code}" already exists`);

    const uom = await this.prisma.uom.findFirst({ where: { id: dto.baseUomId, tenantId } });
    if (!uom) throw new NotFoundException('Base UoM not found');

    const item = await this.prisma.inventoryItem.create({
      data: { tenantId, ...dto, standardCost: dto.standardCost ?? 0 },
    });
    await this.audit.log({
      action: 'inventory.item:create',
      entityType: 'inventory_item',
      entityId: item.id,
      after: { name: item.name, code: item.code, type: item.type },
    });
    return item;
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    const updated = await this.prisma.inventoryItem.update({ where: { id }, data: dto });
    await this.audit.log({
      action: 'inventory.item:update',
      entityType: 'inventory_item',
      entityId: id,
      before: { name: item.name, standardCost: item.standardCost },
      after: { name: updated.name, standardCost: updated.standardCost },
    });
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const summary = await this.prisma.stockSummary.findFirst({
      where: { itemId: id, onHand: { gt: 0 } },
    });
    if (summary) throw new ConflictException('Item has stock on hand — cannot delete');

    await this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.log({
      action: 'inventory.item:delete',
      entityType: 'inventory_item',
      entityId: id,
      before: { name: item.name },
    });
  }

  // ── reorder levels ─────────────────────────────────────────────────────────

  async setReorderLevel(itemId: string, dto: SetReorderLevelDto) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return this.prisma.reorderLevel.upsert({
      where: { itemId_storeId: { itemId, storeId: dto.storeId } },
      create: { tenantId, itemId, storeId: dto.storeId, minQty: dto.minQty, parQty: dto.parQty },
      update: { minQty: dto.minQty, parQty: dto.parQty },
    });
  }

  // ── stock summaries ────────────────────────────────────────────────────────

  async getStockSummaries(query: StockSummaryQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const summaries = await this.prisma.stockSummary.findMany({
      where: {
        tenantId,
        ...(query.storeId ? { storeId: query.storeId } : {}),
        ...(query.itemId ? { itemId: query.itemId } : {}),
      },
      orderBy: [{ storeId: 'asc' }, { itemId: 'asc' }],
    });

    if (query.belowReorder) {
      const levels = await this.prisma.reorderLevel.findMany({ where: { tenantId } });
      const levelMap = new Map(levels.map((l) => [`${l.storeId}:${l.itemId}`, l]));
      return summaries.filter((s) => {
        const level = levelMap.get(`${s.storeId}:${s.itemId}`);
        return level && new Decimal(s.onHand).lessThanOrEqualTo(level.minQty);
      });
    }

    return summaries;
  }

  // ── stock ledger ───────────────────────────────────────────────────────────

  async getStockLedger(query: StockLedgerQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;

    const entries = await this.prisma.stockLedger.findMany({
      where: {
        tenantId,
        ...(query.storeId ? { storeId: query.storeId } : {}),
        ...(query.itemId ? { itemId: query.itemId } : {}),
        ...(query.from || query.to
          ? {
              businessDate: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      },
      take: limit + 1,
      orderBy: { id: 'asc' },
    });

    const hasMore = entries.length > limit;
    if (hasMore) entries.pop();
    return { data: entries, nextCursor: hasMore ? entries[entries.length - 1]?.id : null };
  }

  // ── opening stock ──────────────────────────────────────────────────────────

  async postOpeningStock(dto: PostOpeningStockDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const businessDate = dto.businessDate ? new Date(dto.businessDate) : new Date();
    businessDate.setHours(0, 0, 0, 0);

    if (!dto.lines.length) throw new BadRequestException('At least one line is required');

    // Check no existing stock for these items/stores
    for (const line of dto.lines) {
      const existing = await this.prisma.stockLedger.findFirst({
        where: { tenantId, storeId: line.storeId, itemId: line.itemId, movementType: 'OPENING' },
      });
      if (existing) {
        throw new ConflictException(
          `Opening stock already posted for item ${line.itemId} in store ${line.storeId}`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of dto.lines) {
        const qty = new Decimal(line.qty);
        const cost = new Decimal(line.unitCost);

        await tx.stockLedger.create({
          data: {
            tenantId,
            storeId: line.storeId,
            itemId: line.itemId,
            movementType: 'OPENING',
            qty,
            unitCost: cost,
            sourceType: 'OPENING',
            sourceId: tenantId,
            businessDate,
            note: line.note,
            createdBy: userId,
          },
        });

        await upsertStockSummary(tx as PrismaService, tenantId, line.storeId, line.itemId, qty, cost);

        if (line.batchNumber) {
          await tx.stockBatch.create({
            data: {
              tenantId,
              itemId: line.itemId,
              storeId: line.storeId,
              batchNumber: line.batchNumber,
              expiryDate: line.expiryDate ? new Date(line.expiryDate) : undefined,
              unitCost: cost,
              qtyReceived: qty,
              qtyRemaining: qty,
            },
          });
        }
      }
    });

    await this.audit.log({
      action: 'inventory.opening-stock:create',
      entityType: 'stock_ledger',
      after: { lineCount: dto.lines.length, businessDate },
    });

    return { posted: dto.lines.length, businessDate };
  }

  // ── stock transfers ────────────────────────────────────────────────────────

  async listTransfers(query: ListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;

    const rows = await this.prisma.stockTransfer.findMany({
      where: {
        tenantId,
        ...(query.storeId ? { OR: [{ fromStoreId: query.storeId }, { toStoreId: query.storeId }] } : {}),
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      },
      take: limit + 1,
      orderBy: { id: 'desc' },
      include: { lines: true },
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? rows[rows.length - 1]?.id : null };
  }

  async getTransfer(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  async createTransfer(dto: CreateTransferDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    if (!dto.lines.length) throw new BadRequestException('At least one line is required');
    if (dto.fromStoreId === dto.toStoreId) {
      throw new BadRequestException('Source and destination store must differ');
    }

    const number = await this.seq.next(tenantId, TENANT_SCOPE, 'TRANSFER', 'TRF');

    const transfer = await this.prisma.stockTransfer.create({
      data: {
        tenantId,
        number,
        fromStoreId: dto.fromStoreId,
        toStoreId: dto.toStoreId,
        note: dto.note,
        createdBy: userId,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            itemId: l.itemId,
            qty: l.qty,
            unitCost: l.unitCost,
            batchId: l.batchId,
          })),
        },
      },
      include: { lines: true },
    });

    await this.audit.log({
      action: 'inventory.transfer:create',
      entityType: 'stock_transfer',
      entityId: transfer.id,
      after: { number, fromStoreId: dto.fromStoreId, toStoreId: dto.toStoreId },
    });
    return transfer;
  }

  async dispatchTransfer(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'DRAFT') {
      throw new UnprocessableEntityException(`Cannot dispatch a transfer in status "${transfer.status}"`);
    }

    const businessDate = new Date();
    businessDate.setHours(0, 0, 0, 0);

    await this.prisma.$transaction(async (tx) => {
      // Deduct from source store
      for (const line of transfer.lines) {
        const qty = new Decimal(line.qty).negated();
        const cost = new Decimal(line.unitCost);

        await tx.stockLedger.create({
          data: {
            tenantId,
            storeId: transfer.fromStoreId,
            itemId: line.itemId,
            batchId: line.batchId,
            movementType: 'TRANSFER_OUT',
            qty,
            unitCost: cost,
            sourceType: 'TRANSFER',
            sourceId: id,
            sourceLineId: line.id,
            businessDate,
            createdBy: userId,
          },
        });

        await upsertStockSummary(tx as PrismaService, tenantId, transfer.fromStoreId, line.itemId, qty, cost);
      }

      await tx.stockTransfer.update({
        where: { id },
        data: { status: 'DISPATCHED', dispatchedAt: new Date() },
      });
    });

    await this.audit.log({
      action: 'inventory.transfer:dispatch',
      entityType: 'stock_transfer',
      entityId: id,
      before: { status: 'DRAFT' },
      after: { status: 'DISPATCHED' },
    });

    return this.getTransfer(id);
  }

  async receiveTransfer(id: string, dto: ReceiveTransferDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'DISPATCHED') {
      throw new UnprocessableEntityException(`Cannot receive a transfer in status "${transfer.status}"`);
    }

    const businessDate = new Date();
    businessDate.setHours(0, 0, 0, 0);

    const lineMap = new Map(transfer.lines.map((l) => [l.id, l]));

    await this.prisma.$transaction(async (tx) => {
      for (const recv of dto.lines) {
        const line = lineMap.get(recv.lineId);
        if (!line) continue;
        const qty = new Decimal(recv.qtyReceived);
        if (qty.isZero()) continue;
        const cost = new Decimal(line.unitCost);

        await tx.stockLedger.create({
          data: {
            tenantId,
            storeId: transfer.toStoreId,
            itemId: line.itemId,
            batchId: line.batchId,
            movementType: 'TRANSFER_IN',
            qty,
            unitCost: cost,
            sourceType: 'TRANSFER',
            sourceId: id,
            sourceLineId: line.id,
            businessDate,
            note: dto.note,
            createdBy: userId,
          },
        });

        await upsertStockSummary(tx as PrismaService, tenantId, transfer.toStoreId, line.itemId, qty, cost);

        await tx.stockTransferLine.update({
          where: { id: line.id },
          data: { qtyReceived: qty },
        });
      }

      await tx.stockTransfer.update({
        where: { id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
      });
    });

    await this.audit.log({
      action: 'inventory.transfer:receive',
      entityType: 'stock_transfer',
      entityId: id,
      after: { status: 'RECEIVED' },
    });

    return this.getTransfer(id);
  }

  async cancelTransfer(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const transfer = await this.prisma.stockTransfer.findFirst({ where: { id, tenantId } });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (!['DRAFT'].includes(transfer.status)) {
      throw new UnprocessableEntityException('Only DRAFT transfers can be cancelled');
    }
    await this.prisma.stockTransfer.update({ where: { id }, data: { status: 'CANCELLED' } });
    await this.audit.log({
      action: 'inventory.transfer:create',
      entityType: 'stock_transfer',
      entityId: id,
      before: { status: transfer.status },
      after: { status: 'CANCELLED' },
    });
  }

  // ── stock adjustments ──────────────────────────────────────────────────────

  async listAdjustments(query: ListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;

    const rows = await this.prisma.stockAdjustment.findMany({
      where: {
        tenantId,
        ...(query.storeId ? { storeId: query.storeId } : {}),
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      },
      take: limit + 1,
      orderBy: { id: 'desc' },
      include: { lines: true },
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? rows[rows.length - 1]?.id : null };
  }

  async createAdjustment(dto: CreateAdjustmentDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    if (!dto.lines.length) throw new BadRequestException('At least one line is required');

    const businessDate = dto.businessDate ? new Date(dto.businessDate) : new Date();
    businessDate.setHours(0, 0, 0, 0);

    const number = await this.seq.next(tenantId, TENANT_SCOPE, 'ADJUSTMENT', 'ADJ');

    const movementType = (
      {
        WASTE: 'WASTE',
        PILFERAGE: 'PILFERAGE',
        DAMAGE: 'ADJUSTMENT',
        EXPIRY: 'ADJUSTMENT',
        SPILLAGE: 'WASTE',
        CORRECTION: 'ADJUSTMENT',
        OTHER: 'ADJUSTMENT',
      } as Record<string, string>
    )[dto.reason]!;

    await this.prisma.$transaction(async (tx) => {
      const adj = await tx.stockAdjustment.create({
        data: {
          tenantId,
          number,
          storeId: dto.storeId,
          reason: dto.reason as never,
          note: dto.note,
          businessDate,
          createdBy: userId,
          lines: {
            create: dto.lines.map((l) => ({
              tenantId,
              itemId: l.itemId,
              qty: l.qty,
              unitCost: l.unitCost,
              batchId: l.batchId,
            })),
          },
        },
        include: { lines: true },
      });

      for (const line of adj.lines) {
        const qty = new Decimal(line.qty);
        const cost = new Decimal(line.unitCost);

        await tx.stockLedger.create({
          data: {
            tenantId,
            storeId: dto.storeId,
            itemId: line.itemId,
            batchId: line.batchId,
            movementType: movementType as never,
            qty,
            unitCost: cost,
            sourceType: 'ADJUSTMENT',
            sourceId: adj.id,
            sourceLineId: line.id,
            businessDate,
            note: dto.note,
            createdBy: userId,
          },
        });

        await upsertStockSummary(tx as PrismaService, tenantId, dto.storeId, line.itemId, qty, cost);
      }
    });

    await this.audit.log({
      action: 'inventory.adjustment:create',
      entityType: 'stock_adjustment',
      after: { number, reason: dto.reason, lineCount: dto.lines.length },
    });

    return this.prisma.stockAdjustment.findFirst({
      where: { tenantId, number },
      include: { lines: true },
    });
  }

  // ── stock counts ───────────────────────────────────────────────────────────

  async listCounts(query: ListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;

    const rows = await this.prisma.stockCount.findMany({
      where: {
        tenantId,
        ...(query.storeId ? { storeId: query.storeId } : {}),
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      },
      take: limit + 1,
      orderBy: { id: 'desc' },
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? rows[rows.length - 1]?.id : null };
  }

  async getCount(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const count = await this.prisma.stockCount.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!count) throw new NotFoundException('Count not found');
    return count;
  }

  async createCount(dto: CreateCountDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;

    const number = await this.seq.next(tenantId, TENANT_SCOPE, 'COUNT', 'CNT');

    // Snapshot current system qty for each item in scope
    const summaries = await this.prisma.stockSummary.findMany({
      where: {
        tenantId,
        storeId: dto.storeId,
        ...(dto.itemIds?.length ? { itemId: { in: dto.itemIds } } : {}),
      },
    });

    const count = await this.prisma.stockCount.create({
      data: {
        tenantId,
        number,
        storeId: dto.storeId,
        status: 'DRAFT',
        createdBy: userId,
        lines: {
          create: summaries.map((s) => ({
            tenantId,
            itemId: s.itemId,
            systemQty: s.onHand,
            unitCost: s.avgCost,
          })),
        },
      },
      include: { lines: true },
    });

    await this.audit.log({
      action: 'inventory.count:create',
      entityType: 'stock_count',
      entityId: count.id,
      after: { number, lineCount: count.lines.length },
    });

    return count;
  }

  async enterCountLine(countId: string, lineId: string, dto: EnterCountLineDto) {
    const tenantId = TenantContext.requireTenantId();
    const count = await this.prisma.stockCount.findFirst({ where: { id: countId, tenantId } });
    if (!count) throw new NotFoundException('Count not found');
    if (!['DRAFT', 'IN_PROGRESS'].includes(count.status)) {
      throw new UnprocessableEntityException(`Cannot edit a count in status "${count.status}"`);
    }

    // Transition to IN_PROGRESS on first entry
    if (count.status === 'DRAFT') {
      await this.prisma.stockCount.update({
        where: { id: countId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    const line = await this.prisma.stockCountLine.findFirst({
      where: { id: lineId, countId },
    });
    if (!line) throw new NotFoundException('Count line not found');

    return this.prisma.stockCountLine.update({
      where: { id: lineId },
      data: { countedQty: dto.countedQty },
    });
  }

  async submitCount(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const count = await this.prisma.stockCount.findFirst({ where: { id, tenantId } });
    if (!count) throw new NotFoundException('Count not found');
    if (count.status !== 'IN_PROGRESS') {
      throw new UnprocessableEntityException('Count must be IN_PROGRESS to submit for review');
    }
    return this.prisma.stockCount.update({
      where: { id },
      data: { status: 'REVIEW', countedAt: new Date() },
    });
  }

  async postCount(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const count = await this.prisma.stockCount.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!count) throw new NotFoundException('Count not found');
    if (count.status !== 'REVIEW') {
      throw new UnprocessableEntityException('Count must be in REVIEW to post');
    }

    const businessDate = new Date();
    businessDate.setHours(0, 0, 0, 0);

    await this.prisma.$transaction(async (tx) => {
      for (const line of count.lines) {
        if (line.countedQty === null) continue;
        const variance = new Decimal(line.countedQty).minus(line.systemQty);
        if (variance.isZero()) continue;

        const cost = new Decimal(line.unitCost);

        await tx.stockLedger.create({
          data: {
            tenantId,
            storeId: count.storeId,
            itemId: line.itemId,
            movementType: 'COUNT_VARIANCE',
            qty: variance,
            unitCost: cost,
            sourceType: 'COUNT',
            sourceId: id,
            sourceLineId: line.id,
            businessDate,
            createdBy: userId,
          },
        });

        await upsertStockSummary(tx as PrismaService, tenantId, count.storeId, line.itemId, variance, cost);
      }

      await tx.stockCount.update({
        where: { id },
        data: { status: 'POSTED', postedAt: new Date() },
      });
    });

    await this.audit.log({
      action: 'inventory.count:post',
      entityType: 'stock_count',
      entityId: id,
      after: { status: 'POSTED' },
    });

    return this.getCount(id);
  }

  async cancelCount(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const count = await this.prisma.stockCount.findFirst({ where: { id, tenantId } });
    if (!count) throw new NotFoundException('Count not found');
    if (['POSTED', 'CANCELLED'].includes(count.status)) {
      throw new UnprocessableEntityException(`Cannot cancel a count in status "${count.status}"`);
    }
    await this.prisma.stockCount.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
