import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../../common/prisma.service';
import { SequenceService } from '../../common/sequence.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  AddCashMovementDto,
  AddOrderItemDto,
  AddPaymentDto,
  BillOrderDto,
  CloseSessionDto,
  CreateOrderDto,
  KotQueryDto,
  MergeOrdersDto,
  OpenSessionDto,
  PosOrderQueryDto,
  SplitOrderDto,
  UpdateKotStatusDto,
  UpdateOrderItemDto,
  VoidOrderDto,
  VoidOrderItemDto,
} from './dto/pos.dto';

async function upsertStockSummary(
  tx: PrismaService,
  tenantId: string,
  storeId: string,
  itemId: string,
  qtyDelta: Decimal,
  unitCost: Decimal,
): Promise<void> {
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
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function recompute(
  items: Array<{
    qty: Decimal;
    unitPrice: Decimal;
    taxRate: Decimal;
    status: string;
    modifiers?: Array<{ price: Decimal }>;
  }>,
  discountTotal: Decimal,
  serviceChargeRate: number,
) {
  let subtotal = new Decimal(0);
  let rawTax = new Decimal(0);

  for (const item of items) {
    if (item.status === 'VOIDED') continue;
    const lineBase = new Decimal(item.unitPrice).times(item.qty);
    const modTotal = (item.modifiers ?? []).reduce(
      (acc, m) => acc.plus(m.price),
      new Decimal(0),
    );
    subtotal = subtotal.plus(lineBase).plus(modTotal);
    rawTax = rawTax.plus(lineBase.plus(modTotal).times(new Decimal(item.taxRate).dividedBy(100)));
  }

  const afterDiscount = subtotal.minus(discountTotal).greaterThan(0)
    ? subtotal.minus(discountTotal)
    : new Decimal(0);

  const taxRatio = subtotal.isZero() ? new Decimal(1) : afterDiscount.dividedBy(subtotal);
  const taxAmount = rawTax.times(taxRatio);
  const serviceChargeAmount = afterDiscount.times(serviceChargeRate);
  const rawTotal = afterDiscount.plus(taxAmount).plus(serviceChargeAmount);
  const totalAmount = rawTotal.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const roundOff = totalAmount.minus(rawTotal);

  return { subtotal, taxAmount, serviceChargeAmount, roundOff, totalAmount };
}

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seq: SequenceService,
    private readonly audit: AuditService,
  ) {}

  // ── Cash Sessions ───────────────────────────────────────────────────────────

  async openSession(dto: OpenSessionDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const existing = await this.prisma.cashSession.findFirst({
      where: { tenantId, terminalId: dto.terminalId, status: 'OPEN' },
    });
    if (existing) throw new UnprocessableEntityException('An open session already exists for this terminal');

    const session = await this.prisma.cashSession.create({
      data: {
        tenantId,
        outletId: dto.outletId,
        terminalId: dto.terminalId,
        openedBy: userId ?? 'system',
        openingFloat: dto.openingFloat,
        status: 'OPEN',
        businessDate: new Date(dto.businessDate),
      },
    });
    await this.audit.log({
      action: 'pos.cash-session:open',
      entityType: 'cash_session',
      entityId: session.id,
      after: { terminalId: dto.terminalId, openingFloat: dto.openingFloat },
    });
    return session;
  }

  async closeSession(id: string, dto: CloseSessionDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const session = await this.prisma.cashSession.findFirst({
      where: { id, tenantId },
      include: { movements: true },
    });
    if (!session) throw new NotFoundException('Cash session not found');
    if (session.status !== 'OPEN') throw new UnprocessableEntityException('Session is already closed');

    const cashSales = await this.prisma.posPayment.aggregate({
      where: { tenantId, cashSessionId: id, tender: 'CASH', status: 'CAPTURED' },
      _sum: { amount: true },
    });
    const cashRefunds = await this.prisma.posPayment.aggregate({
      where: { tenantId, cashSessionId: id, tender: 'CASH', status: 'REFUNDED' },
      _sum: { refundedAmount: true },
    });

    let expectedCash = new Decimal(session.openingFloat)
      .plus(cashSales._sum.amount ?? 0)
      .minus(cashRefunds._sum.refundedAmount ?? 0);

    for (const mv of session.movements) {
      const amt = new Decimal(mv.amount);
      if (mv.type === 'FLOAT_IN') expectedCash = expectedCash.plus(amt);
      else if (mv.type === 'FLOAT_OUT' || mv.type === 'DROP' || mv.type === 'PAYOUT')
        expectedCash = expectedCash.minus(amt);
    }

    const countedCash = new Decimal(dto.countedCash);
    const overShort = countedCash.minus(expectedCash);

    const updated = await this.prisma.cashSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedBy: userId ?? 'system',
        closedAt: new Date(),
        expectedCash,
        countedCash,
        overShort,
        note: dto.note,
      },
    });
    await this.audit.log({
      action: 'pos.cash-session:close',
      entityType: 'cash_session',
      entityId: id,
      after: { status: 'CLOSED', overShort: overShort.toString() },
    });
    return updated;
  }

  async addCashMovement(sessionId: string, dto: AddCashMovementDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const session = await this.prisma.cashSession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) throw new NotFoundException('Cash session not found');
    if (session.status !== 'OPEN') throw new UnprocessableEntityException('Session is not open');

    return this.prisma.cashMovement.create({
      data: {
        tenantId,
        sessionId,
        type: dto.type,
        amount: dto.amount,
        reference: dto.reference,
        note: dto.note,
        createdBy: userId,
      },
    });
  }

  async getSession(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const session = await this.prisma.cashSession.findFirst({
      where: { id, tenantId },
      include: { movements: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Cash session not found');
    return session;
  }

  async listSessions(outletId?: string, businessDate?: string) {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.cashSession.findMany({
      where: {
        tenantId,
        ...(outletId ? { outletId } : {}),
        ...(businessDate ? { businessDate: new Date(businessDate) } : {}),
      },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });
  }

  // ── Orders ──────────────────────────────────────────────────────────────────

  async listOrders(q: PosOrderQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = Math.min(q.limit ?? 50, 200);
    const rows = await this.prisma.posOrder.findMany({
      where: {
        tenantId,
        ...(q.outletId ? { outletId: q.outletId } : {}),
        ...(q.status ? { status: q.status as never } : {}),
        ...(q.businessDate ? { businessDate: new Date(q.businessDate) } : {}),
        ...(q.cursor ? { id: { lt: q.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
      include: { items: { include: { modifiers: true } }, payments: true },
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? (rows[rows.length - 1]?.id ?? null) : null };
  }

  async createOrder(dto: CreateOrderDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const order = await this.prisma.posOrder.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        outletId: dto.outletId,
        channel: dto.channel,
        tableId: dto.tableId,
        guestCount: dto.guestCount,
        customerId: dto.customerId,
        waiterId: dto.waiterId,
        clientOpId: dto.clientOpId,
        note: dto.note,
        businessDate: new Date(dto.businessDate),
        status: 'DRAFT',
        createdBy: userId,
      },
    });
    await this.audit.log({
      action: 'pos.order:create',
      entityType: 'pos_order',
      entityId: order.id,
      after: { channel: dto.channel, outletId: dto.outletId },
    });
    return order;
  }

  async getOrder(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.posOrder.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { modifiers: true } },
        kots: { include: { items: true } },
        payments: true,
        discounts: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async addItem(orderId: string, dto: AddOrderItemDto) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.posOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'DRAFT' && order.status !== 'PLACED')
      throw new UnprocessableEntityException(`Cannot add items to a ${order.status} order`);

    const qty = new Decimal(dto.qty);
    const unitPrice = new Decimal(dto.unitPrice);
    const taxRate = new Decimal(dto.taxRate ?? 0);
    const modTotal = (dto.modifiers ?? []).reduce((acc, m) => acc.plus(m.price), new Decimal(0));
    const lineBase = unitPrice.times(qty).plus(modTotal);
    const taxAmount = lineBase.times(taxRate.dividedBy(100));
    const totalAmount = lineBase.plus(taxAmount);

    return this.prisma.posOrderItem.create({
      data: {
        tenantId,
        orderId,
        menuItemId: dto.menuItemId,
        variantId: dto.variantId,
        nameSnapshot: dto.nameSnapshot,
        qty,
        unitPrice,
        taxGroupId: dto.taxGroupId,
        taxRate,
        taxAmount,
        totalAmount,
        seatNumber: dto.seatNumber,
        courseNumber: dto.courseNumber,
        kitchenStationId: dto.kitchenStationId,
        note: dto.note,
        status: 'PENDING',
        ...(dto.modifiers?.length
          ? {
              modifiers: {
                create: dto.modifiers.map((m) => ({
                  tenantId,
                  modifierId: m.modifierId,
                  nameSnapshot: m.nameSnapshot,
                  price: m.price,
                })),
              },
            }
          : {}),
      },
      include: { modifiers: true },
    });
  }

  async updateItem(orderId: string, itemId: string, dto: UpdateOrderItemDto) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.posOrderItem.findFirst({
      where: { id: itemId, orderId, tenantId },
      include: { modifiers: true },
    });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.status === 'VOIDED') throw new UnprocessableEntityException('Cannot update a voided item');

    const qty = dto.qty !== undefined ? new Decimal(dto.qty) : new Decimal(item.qty);
    const modTotal = item.modifiers.reduce((acc, m) => acc.plus(m.price), new Decimal(0));
    const lineBase = new Decimal(item.unitPrice).times(qty).plus(modTotal);
    const taxAmount = lineBase.times(new Decimal(item.taxRate).dividedBy(100));
    const totalAmount = lineBase.plus(taxAmount);

    return this.prisma.posOrderItem.update({
      where: { id: itemId },
      data: {
        qty,
        taxAmount,
        totalAmount,
        note: dto.note !== undefined ? dto.note : item.note,
      },
    });
  }

  async removeItem(orderId: string, itemId: string) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.posOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'DRAFT') throw new UnprocessableEntityException('Can only remove items from a DRAFT order');

    const item = await this.prisma.posOrderItem.findFirst({ where: { id: itemId, orderId, tenantId } });
    if (!item) throw new NotFoundException('Order item not found');

    await this.prisma.posOrderItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  async placeOrder(orderId: string) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.posOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'DRAFT') throw new UnprocessableEntityException(`Cannot place a ${order.status} order`);

    const itemCount = await this.prisma.posOrderItem.count({
      where: { orderId, tenantId, status: { not: 'VOIDED' } },
    });
    if (itemCount === 0) throw new BadRequestException('Cannot place an order with no items');

    const updated = await this.prisma.posOrder.update({
      where: { id: orderId },
      data: { status: 'PLACED' },
    });
    await this.audit.log({
      action: 'pos.order:update',
      entityType: 'pos_order',
      entityId: orderId,
      after: { status: 'PLACED' },
    });
    return updated;
  }

  async fireKots(orderId: string) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.posOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { items: { include: { modifiers: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PLACED' && order.status !== 'IN_KITCHEN')
      throw new UnprocessableEntityException(`Cannot fire KOTs for a ${order.status} order`);

    const pendingItems = order.items.filter(
      (i) => i.status === 'PENDING' && i.kitchenStationId,
    );
    if (pendingItems.length === 0)
      throw new BadRequestException('No pending items with a kitchen station to fire');

    const byStation = new Map<string, typeof pendingItems>();
    for (const item of pendingItems) {
      const station = item.kitchenStationId!;
      const arr = byStation.get(station) ?? [];
      arr.push(item);
      byStation.set(station, arr);
    }

    const kots = await this.prisma.$transaction(async (tx) => {
      const txp = tx as PrismaService;
      const created = [];

      const maxKot = await txp.kot.findFirst({
        where: { order: { outletId: order.outletId } },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      let kotSeq = (maxKot?.number ?? 0) + 1;

      for (const [stationId, items] of byStation) {
        const kot = await txp.kot.create({
          data: {
            tenantId,
            orderId,
            number: kotSeq++,
            kitchenStationId: stationId,
            status: 'FIRED',
            firedAt: new Date(),
            items: {
              create: items.map((i) => ({
                tenantId,
                orderItemId: i.id,
                nameSnapshot: i.nameSnapshot,
                qty: i.qty,
                note: i.note,
                modifiersSnapshot: i.modifiers.length
                  ? JSON.stringify(i.modifiers.map((m) => ({ name: m.nameSnapshot, price: m.price.toString() })))
                  : undefined,
              })),
            },
          },
          include: { items: true },
        });
        created.push(kot);

        await txp.posOrderItem.updateMany({
          where: { id: { in: items.map((i) => i.id) }, tenantId },
          data: { status: 'FIRED' },
        });
      }

      await txp.posOrder.update({ where: { id: orderId }, data: { status: 'IN_KITCHEN' } });
      return created;
    });

    await this.audit.log({
      action: 'pos.order:update',
      entityType: 'pos_order',
      entityId: orderId,
      after: { status: 'IN_KITCHEN', kotCount: kots.length },
    });
    return kots;
  }

  async billOrder(orderId: string, dto: BillOrderDto) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.posOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { items: { include: { modifiers: true } }, discounts: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    const billableStatuses = ['PLACED', 'IN_KITCHEN', 'SERVED'];
    if (!billableStatuses.includes(order.status))
      throw new UnprocessableEntityException(`Cannot bill a ${order.status} order`);

    const serviceChargeRate = dto.serviceChargeRate ?? 0;

    // Compute subtotal for percentage-based discount calculation
    let subtotal = new Decimal(0);
    for (const item of order.items) {
      if (item.status === 'VOIDED') continue;
      const modTotal = item.modifiers.reduce((acc, m) => acc.plus(m.price), new Decimal(0));
      subtotal = subtotal.plus(new Decimal(item.unitPrice).times(item.qty)).plus(modTotal);
    }

    let discountTotal = new Decimal(0);
    const discountRows: Array<{
      type: string;
      value: Decimal;
      amount: Decimal;
      reason?: string;
      couponId?: string;
      approvedBy?: string;
    }> = [];

    for (const d of dto.discounts ?? []) {
      const amount =
        d.type === 'PERCENTAGE'
          ? subtotal.times(new Decimal(d.value).dividedBy(100))
          : new Decimal(d.value);
      discountTotal = discountTotal.plus(amount);
      discountRows.push({
        type: d.type,
        value: new Decimal(d.value),
        amount,
        reason: d.reason,
        couponId: d.couponId,
        approvedBy: d.approvedBy,
      });
    }

    const { taxAmount, serviceChargeAmount, roundOff, totalAmount } = recompute(
      order.items.map((i) => ({
        qty: i.qty,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        status: i.status,
        modifiers: i.modifiers.map((m) => ({ price: m.price })),
      })),
      discountTotal,
      serviceChargeRate,
    );

    const number = await this.seq.next(tenantId, order.companyId, 'POS_INVOICE', 'INV', 6);

    await this.prisma.$transaction(async (tx) => {
      const txp = tx as PrismaService;
      await txp.orderDiscount.deleteMany({ where: { orderId, tenantId } });
      if (discountRows.length) {
        await txp.orderDiscount.createMany({
          data: discountRows.map((d) => ({
            tenantId,
            orderId,
            type: d.type as never,
            value: d.value,
            amount: d.amount,
            reason: d.reason,
            couponId: d.couponId,
            approvedBy: d.approvedBy,
          })),
        });
      }
      await txp.posOrder.update({
        where: { id: orderId },
        data: {
          number,
          status: 'BILLED',
          subtotal,
          discountAmount: discountTotal,
          taxAmount,
          serviceChargeAmount,
          roundOff,
          totalAmount,
          billedAt: new Date(),
        },
      });
    });

    await this.audit.log({
      action: 'pos.order:update',
      entityType: 'pos_order',
      entityId: orderId,
      after: { status: 'BILLED', number, totalAmount: totalAmount.toString() },
    });
    return this.getOrder(orderId);
  }

  async addPayment(orderId: string, dto: AddPaymentDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const order = await this.prisma.posOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'BILLED')
      throw new UnprocessableEntityException(`Cannot add payment to a ${order.status} order`);

    const payment = await this.prisma.posPayment.create({
      data: {
        tenantId,
        orderId,
        cashSessionId: dto.cashSessionId,
        tender: dto.tender,
        amount: dto.amount,
        tipAmount: dto.tipAmount ?? 0,
        reference: dto.reference,
        status: 'CAPTURED',
        capturedBy: userId,
      },
    });

    const paymentSum = await this.prisma.posPayment.aggregate({
      where: { orderId, tenantId, status: 'CAPTURED' },
      _sum: { amount: true },
    });
    await this.prisma.posOrder.update({
      where: { id: orderId },
      data: { amountPaid: paymentSum._sum.amount ?? 0 },
    });

    return payment;
  }

  async settleOrder(orderId: string) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const order = await this.prisma.posOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { items: { include: { modifiers: true } }, payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'BILLED')
      throw new UnprocessableEntityException(`Cannot settle a ${order.status} order`);

    const totalPaid = order.payments
      .filter((p) => p.status === 'CAPTURED')
      .reduce((acc, p) => acc.plus(p.amount), new Decimal(0));

    if (totalPaid.lessThan(new Decimal(order.totalAmount))) {
      throw new UnprocessableEntityException(
        `Insufficient payment: paid ${totalPaid.toFixed(2)}, total ${new Decimal(order.totalAmount).toFixed(2)}`,
      );
    }

    const businessDate = today();

    const outlet = await this.prisma.outlet.findUnique({
      where: { id: order.outletId },
      select: { locationId: true },
    });
    const store = outlet
      ? await this.prisma.store.findFirst({
          where: { tenantId, locationId: outlet.locationId, isActive: true },
          orderBy: { id: 'asc' },
        })
      : null;

    await this.prisma.$transaction(async (tx) => {
      const txp = tx as PrismaService;

      for (const payment of order.payments) {
        if (payment.status !== 'CAPTURED' || payment.tender !== 'CASH' || !payment.cashSessionId)
          continue;
        await txp.cashMovement.create({
          data: {
            tenantId,
            sessionId: payment.cashSessionId,
            type: 'SALE',
            amount: payment.amount,
            reference: orderId,
            note: `Settlement of order ${order.number ?? orderId.slice(0, 8)}`,
            createdBy: userId,
          },
        });
      }

      if (store) {
        for (const item of order.items) {
          if (item.status === 'VOIDED') continue;
          const qty = new Decimal(item.qty);

          const menuItem = await txp.menuItem.findUnique({
            where: { id: item.menuItemId },
            select: { recipeId: true, inventoryItemId: true },
          });
          if (!menuItem) continue;

          if (menuItem.recipeId) {
            const recipe = await txp.recipe.findFirst({
              where: { id: menuItem.recipeId, tenantId },
              include: { ingredients: true },
            });
            if (!recipe) continue;

            const scale = qty.dividedBy(recipe.yieldQty);
            for (const ing of recipe.ingredients) {
              if (!ing.itemId) continue;
              const consumeQty = new Decimal(ing.qty)
                .times(new Decimal(1).plus(new Decimal(ing.wastagePct).dividedBy(100)))
                .times(scale)
                .negated();

              const summary = await txp.stockSummary.findUnique({
                where: { storeId_itemId: { storeId: store.id, itemId: ing.itemId } },
              });
              const unitCost = new Decimal(summary?.avgCost ?? 0);

              await txp.stockLedger.create({
                data: {
                  tenantId,
                  storeId: store.id,
                  itemId: ing.itemId,
                  movementType: 'SALE_CONSUMPTION',
                  qty: consumeQty,
                  unitCost,
                  sourceType: 'pos_order',
                  sourceId: orderId,
                  businessDate,
                },
              });
              await upsertStockSummary(txp, tenantId, store.id, ing.itemId, consumeQty, unitCost);
            }
          } else if (menuItem.inventoryItemId) {
            const consumeQty = qty.negated();
            const summary = await txp.stockSummary.findUnique({
              where: { storeId_itemId: { storeId: store.id, itemId: menuItem.inventoryItemId } },
            });
            const unitCost = new Decimal(summary?.avgCost ?? 0);

            await txp.stockLedger.create({
              data: {
                tenantId,
                storeId: store.id,
                itemId: menuItem.inventoryItemId,
                movementType: 'SALE_CONSUMPTION',
                qty: consumeQty,
                unitCost,
                sourceType: 'pos_order',
                sourceId: orderId,
                businessDate,
              },
            });
            await upsertStockSummary(txp, tenantId, store.id, menuItem.inventoryItemId, consumeQty, unitCost);
          }
        }
      }

      const tipTotal = order.payments
        .filter((p) => p.status === 'CAPTURED')
        .reduce((acc, p) => acc.plus(p.tipAmount), new Decimal(0));

      await txp.posOrder.update({
        where: { id: orderId },
        data: {
          status: 'SETTLED',
          amountPaid: totalPaid,
          tipAmount: tipTotal,
          settledAt: new Date(),
        },
      });
    });

    await this.audit.log({
      action: 'pos.payment:capture',
      entityType: 'pos_order',
      entityId: orderId,
      after: { status: 'SETTLED', totalPaid: totalPaid.toString() },
    });
    return this.getOrder(orderId);
  }

  async voidOrder(orderId: string, dto: VoidOrderDto) {
    const tenantId = TenantContext.requireTenantId();
    const order = await this.prisma.posOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'SETTLED' || order.status === 'VOIDED')
      throw new UnprocessableEntityException(`Cannot void a ${order.status} order`);

    const updated = await this.prisma.posOrder.update({
      where: { id: orderId },
      data: { status: 'VOIDED', voidReason: dto.voidReason, voidedAt: new Date() },
    });
    await this.audit.log({
      action: 'pos.order:void',
      entityType: 'pos_order',
      entityId: orderId,
      after: { status: 'VOIDED', reason: dto.voidReason },
    });
    return updated;
  }

  async voidItem(orderId: string, itemId: string, dto: VoidOrderItemDto) {
    const tenantId = TenantContext.requireTenantId();
    const item = await this.prisma.posOrderItem.findFirst({
      where: { id: itemId, orderId, tenantId },
    });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.status === 'VOIDED') throw new UnprocessableEntityException('Item is already voided');

    return this.prisma.posOrderItem.update({
      where: { id: itemId },
      data: { status: 'VOIDED', voidReason: dto.voidReason, voidedBy: dto.voidedBy },
    });
  }

  async splitOrder(orderId: string, dto: SplitOrderDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const order = await this.prisma.posOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PLACED' && order.status !== 'IN_KITCHEN')
      throw new UnprocessableEntityException(`Cannot split a ${order.status} order`);

    const allItemIds = new Set(order.items.map((i) => i.id));
    for (const split of dto.splits) {
      for (const iid of split.itemIds) {
        if (!allItemIds.has(iid)) throw new BadRequestException(`Item ${iid} does not belong to this order`);
      }
    }

    const children = await this.prisma.$transaction(async (tx) => {
      const txp = tx as PrismaService;
      const result = [];
      for (const split of dto.splits) {
        const child = await txp.posOrder.create({
          data: {
            tenantId,
            companyId: order.companyId,
            outletId: order.outletId,
            channel: order.channel,
            tableId: order.tableId,
            guestCount: order.guestCount,
            parentOrderId: orderId,
            businessDate: order.businessDate,
            status: order.status,
            createdBy: userId,
          },
        });
        await txp.posOrderItem.updateMany({
          where: { id: { in: split.itemIds }, tenantId },
          data: { orderId: child.id },
        });
        result.push(child);
      }
      return result;
    });

    await this.audit.log({
      action: 'pos.order:split',
      entityType: 'pos_order',
      entityId: orderId,
      after: { childCount: children.length },
    });
    return children;
  }

  async mergeOrders(dto: MergeOrdersDto) {
    const tenantId = TenantContext.requireTenantId();
    const orders = await this.prisma.posOrder.findMany({
      where: { id: { in: dto.orderIds }, tenantId },
    });
    if (orders.length !== dto.orderIds.length) throw new NotFoundException('One or more orders not found');
    for (const o of orders) {
      if (!['DRAFT', 'PLACED', 'IN_KITCHEN'].includes(o.status))
        throw new UnprocessableEntityException(`Cannot merge a ${o.status} order`);
    }

    const [targetId, ...sourceIds] = dto.orderIds;

    await this.prisma.$transaction([
      this.prisma.posOrderItem.updateMany({
        where: { orderId: { in: sourceIds }, tenantId },
        data: { orderId: targetId },
      }),
      this.prisma.posOrder.updateMany({
        where: { id: { in: sourceIds }, tenantId },
        data: { status: 'CANCELLED' },
      }),
    ]);

    await this.audit.log({
      action: 'pos.order:merge',
      entityType: 'pos_order',
      entityId: targetId!,
      after: { mergedFrom: sourceIds },
    });
    return this.getOrder(targetId!);
  }

  // ── KDS ─────────────────────────────────────────────────────────────────────

  async listKots(q: KotQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = Math.min(q.limit ?? 50, 100);
    const businessDate = q.businessDate ? new Date(q.businessDate) : today();

    const rows = await this.prisma.kot.findMany({
      where: {
        tenantId,
        kitchenStationId: q.kitchenStationId,
        ...(q.status
          ? { status: q.status }
          : { status: { in: ['FIRED', 'ACKNOWLEDGED', 'PREPARING'] as never[] } }),
        order: { businessDate },
        ...(q.cursor ? { id: { lt: q.cursor } } : {}),
      },
      orderBy: { firedAt: 'asc' },
      take: limit + 1,
      include: {
        items: true,
        order: { select: { number: true, tableId: true, channel: true } },
      },
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? (rows[rows.length - 1]?.id ?? null) : null };
  }

  async getKot(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const kot = await this.prisma.kot.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        order: { select: { number: true, tableId: true, channel: true, guestCount: true } },
      },
    });
    if (!kot) throw new NotFoundException('KOT not found');
    return kot;
  }

  async updateKotStatus(id: string, dto: UpdateKotStatusDto) {
    const tenantId = TenantContext.requireTenantId();
    const kot = await this.prisma.kot.findFirst({ where: { id, tenantId } });
    if (!kot) throw new NotFoundException('KOT not found');

    const data: Record<string, unknown> = { status: dto.status };
    if (dto.status === 'READY') data.readyAt = new Date();
    if (dto.status === 'BUMPED') data.bumpedAt = new Date();

    const updated = await this.prisma.kot.update({ where: { id }, data });

    if (dto.status === 'BUMPED') {
      const kotItems = await this.prisma.kotItem.findMany({
        where: { kotId: id, tenantId },
        select: { orderItemId: true },
      });
      await this.prisma.posOrderItem.updateMany({
        where: { tenantId, id: { in: kotItems.map((ki) => ki.orderItemId) } },
        data: { status: 'SERVED' },
      });

      const orderItems = await this.prisma.posOrderItem.findMany({
        where: { orderId: kot.orderId, tenantId, status: { not: 'VOIDED' } },
        select: { status: true },
      });
      if (orderItems.every((i) => i.status === 'SERVED')) {
        await this.prisma.posOrder.update({
          where: { id: kot.orderId },
          data: { status: 'SERVED' },
        });
      }
    }

    return updated;
  }

  // ── Tax Groups ─────────────────────────────────────────────────────────────

  async listTaxGroups() {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.taxGroup.findMany({
      where: { tenantId, isActive: true },
      include: { components: true },
    });
  }
}
