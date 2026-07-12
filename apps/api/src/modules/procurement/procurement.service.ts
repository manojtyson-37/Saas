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
  CreateGrnDto,
  CreatePurchaseInvoiceDto,
  CreatePurchaseOrderDto,
  CreatePurchaseRequestDto,
  CreateVendorDto,
  CreateVendorNoteDto,
  CreateVendorPaymentDto,
  ProcurementListQueryDto,
  ReviewPoDto,
  ReviewPrDto,
  UpdateVendorDto,
  UpsertVendorItemDto,
  VendorLedgerQueryDto,
} from './dto/procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seq: SequenceService,
    private readonly audit: AuditService,
  ) {}

  // ── vendors ────────────────────────────────────────────────────────────────

  async listVendors(query: ProcurementListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;
    const rows = await this.prisma.vendor.findMany({
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
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } },
    });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { data: rows, nextCursor: hasMore ? rows[rows.length - 1]?.id : null };
  }

  async getVendor(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { items: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async createVendor(dto: CreateVendorDto) {
    const tenantId = TenantContext.requireTenantId();
    const existing = await this.prisma.vendor.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new ConflictException(`Vendor code "${dto.code}" already exists`);
    const vendor = await this.prisma.vendor.create({
      data: { tenantId, ...dto, paymentTermsDays: dto.paymentTermsDays ?? 0 },
    });
    await this.audit.log({
      action: 'procurement.vendor:create',
      entityType: 'vendor',
      entityId: vendor.id,
      after: { name: vendor.name, code: vendor.code },
    });
    return vendor;
  }

  async updateVendor(id: string, dto: UpdateVendorDto) {
    const tenantId = TenantContext.requireTenantId();
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    const updated = await this.prisma.vendor.update({ where: { id }, data: dto });
    await this.audit.log({
      action: 'procurement.vendor:update',
      entityType: 'vendor',
      entityId: id,
      before: { name: vendor.name, isActive: vendor.isActive },
      after: { name: updated.name, isActive: updated.isActive },
    });
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    await this.prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.log({
      action: 'procurement.vendor:delete',
      entityType: 'vendor',
      entityId: id,
      before: { name: vendor.name },
    });
  }

  // ── vendor items ───────────────────────────────────────────────────────────

  listVendorItems(vendorId: string) {
    const tenantId = TenantContext.requireTenantId();
    return this.prisma.vendorItem.findMany({
      where: { vendorId, tenantId },
      orderBy: { isPreferred: 'desc' },
    });
  }

  async upsertVendorItem(vendorId: string, dto: UpsertVendorItemDto) {
    const tenantId = TenantContext.requireTenantId();
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.prisma.vendorItem.upsert({
      where: { vendorId_itemId: { vendorId, itemId: dto.itemId } },
      create: {
        tenantId,
        vendorId,
        itemId: dto.itemId,
        vendorSku: dto.vendorSku,
        lastPrice: dto.lastPrice,
        leadTimeDays: dto.leadTimeDays ?? 0,
        isPreferred: dto.isPreferred ?? false,
      },
      update: {
        vendorSku: dto.vendorSku,
        lastPrice: dto.lastPrice,
        leadTimeDays: dto.leadTimeDays,
        isPreferred: dto.isPreferred,
      },
    });
  }

  async deleteVendorItem(vendorId: string, itemId: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    const vi = await this.prisma.vendorItem.findFirst({
      where: { vendorId, itemId, tenantId },
    });
    if (!vi) throw new NotFoundException('Vendor item not found');
    await this.prisma.vendorItem.delete({ where: { vendorId_itemId: { vendorId, itemId } } });
  }

  // ── purchase requests ──────────────────────────────────────────────────────

  async listPurchaseRequests(query: ProcurementListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;
    const rows = await this.prisma.purchaseRequest.findMany({
      where: {
        tenantId,
        ...(query.status ? { status: query.status as never } : {}),
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

  async getPurchaseRequest(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!pr) throw new NotFoundException('Purchase request not found');
    return pr;
  }

  async createPurchaseRequest(dto: CreatePurchaseRequestDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    if (!dto.lines.length) throw new BadRequestException('At least one line is required');

    const number = await this.seq.next(tenantId, TENANT_SCOPE, 'PR', 'PR');
    const pr = await this.prisma.purchaseRequest.create({
      data: {
        tenantId,
        number,
        locationId: dto.locationId,
        storeId: dto.storeId,
        neededBy: dto.neededBy ? new Date(dto.neededBy) : undefined,
        note: dto.note,
        requestedBy: userId,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            itemId: l.itemId,
            qty: l.qty,
            uomId: l.uomId,
            note: l.note,
          })),
        },
      },
      include: { lines: true },
    });
    await this.audit.log({
      action: 'procurement.pr:create',
      entityType: 'purchase_request',
      entityId: pr.id,
      after: { number, lineCount: pr.lines.length },
    });
    return pr;
  }

  async submitPurchaseRequest(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const pr = await this.prisma.purchaseRequest.findFirst({ where: { id, tenantId } });
    if (!pr) throw new NotFoundException('Purchase request not found');
    if (pr.status !== 'DRAFT') {
      throw new UnprocessableEntityException('Only DRAFT PRs can be submitted');
    }
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });
  }

  async reviewPurchaseRequest(id: string, dto: ReviewPrDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const pr = await this.prisma.purchaseRequest.findFirst({ where: { id, tenantId } });
    if (!pr) throw new NotFoundException('Purchase request not found');
    if (pr.status !== 'SUBMITTED') {
      throw new UnprocessableEntityException('Only SUBMITTED PRs can be approved/rejected');
    }
    const newStatus = dto.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: userId,
        approvedAt: new Date(),
        note: dto.note ?? pr.note,
      },
    });
    await this.audit.log({
      action: 'procurement.pr:approve',
      entityType: 'purchase_request',
      entityId: id,
      before: { status: pr.status },
      after: { status: newStatus },
    });
    return updated;
  }

  // ── purchase orders ────────────────────────────────────────────────────────

  async listPurchaseOrders(query: ProcurementListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;
    const rows = await this.prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.vendorId ? { vendorId: query.vendorId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
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

  async getPurchaseOrder(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    if (!dto.lines.length) throw new BadRequestException('At least one line is required');

    // Validate PR reference
    if (dto.purchaseRequestId) {
      const pr = await this.prisma.purchaseRequest.findFirst({
        where: { id: dto.purchaseRequestId, tenantId, status: 'APPROVED' },
      });
      if (!pr) {
        throw new UnprocessableEntityException('Purchase request not found or not in APPROVED status');
      }
    }

    // Compute totals
    let subtotal = new Decimal(0);
    let taxAmount = new Decimal(0);
    for (const l of dto.lines) {
      const lineSubtotal = new Decimal(l.qty).times(l.unitPrice);
      subtotal = subtotal.plus(lineSubtotal);
      taxAmount = taxAmount.plus(lineSubtotal.times(l.taxRate ?? 0).dividedBy(100));
    }
    const totalAmount = subtotal.plus(taxAmount);

    const number = await this.seq.next(tenantId, dto.companyId, 'PO', 'PO');
    const po = await this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        number,
        vendorId: dto.vendorId,
        storeId: dto.storeId,
        currency: dto.currency ?? 'INR',
        expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
        note: dto.note,
        subtotal,
        taxAmount,
        totalAmount,
        createdBy: userId,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            itemId: l.itemId,
            qty: l.qty,
            uomId: l.uomId,
            unitPrice: l.unitPrice,
            taxGroupId: l.taxGroupId,
            taxRate: l.taxRate ?? 0,
          })),
        },
      },
      include: { lines: true },
    });

    // Mark PR as converted
    if (dto.purchaseRequestId) {
      await this.prisma.purchaseRequest.update({
        where: { id: dto.purchaseRequestId },
        data: { status: 'CONVERTED' },
      });
    }

    await this.audit.log({
      action: 'procurement.po:create',
      entityType: 'purchase_order',
      entityId: po.id,
      after: { number, vendorId: dto.vendorId, totalAmount },
    });
    return po;
  }

  async submitPurchaseOrder(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'DRAFT') {
      throw new UnprocessableEntityException('Only DRAFT POs can be submitted for approval');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    });
  }

  async reviewPurchaseOrder(id: string, dto: ReviewPoDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'PENDING_APPROVAL') {
      throw new UnprocessableEntityException('Only PENDING_APPROVAL POs can be approved/rejected');
    }
    const newStatus = dto.decision === 'APPROVED' ? 'APPROVED' : 'CANCELLED';
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: userId,
        approvedAt: new Date(),
        note: dto.note ?? po.note,
      },
    });
    await this.audit.log({
      action: 'procurement.po:approve',
      entityType: 'purchase_order',
      entityId: id,
      before: { status: po.status },
      after: { status: newStatus },
    });
    return updated;
  }

  // ── goods receipts ─────────────────────────────────────────────────────────

  async listGrns(query: ProcurementListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;
    const rows = await this.prisma.goodsReceipt.findMany({
      where: {
        tenantId,
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.vendorId ? { vendorId: query.vendorId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
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

  async getGrn(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const grn = await this.prisma.goodsReceipt.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    return grn;
  }

  async createGrn(dto: CreateGrnDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    if (!dto.lines.length) throw new BadRequestException('At least one line is required');

    const businessDate = dto.businessDate ? new Date(dto.businessDate) : new Date();
    businessDate.setHours(0, 0, 0, 0);

    if (dto.poId) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { id: dto.poId, tenantId, vendorId: dto.vendorId },
      });
      if (!po) throw new NotFoundException('PO not found or vendor mismatch');
      if (!['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
        throw new UnprocessableEntityException('PO must be APPROVED / SENT / PARTIALLY_RECEIVED to receive against');
      }
    }

    const number = await this.seq.next(tenantId, dto.companyId, 'GRN', 'GRN');

    const grn = await this.prisma.goodsReceipt.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        number,
        poId: dto.poId,
        vendorId: dto.vendorId,
        storeId: dto.storeId,
        vendorChallanNumber: dto.vendorChallanNumber,
        businessDate,
        note: dto.note,
        createdBy: userId,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            poLineId: l.poLineId,
            itemId: l.itemId,
            qtyReceived: l.qtyReceived,
            qtyRejected: l.qtyRejected ?? 0,
            uomId: l.uomId,
            unitPrice: l.unitPrice,
            batchNumber: l.batchNumber,
            expiryDate: l.expiryDate ? new Date(l.expiryDate) : undefined,
          })),
        },
      },
      include: { lines: true },
    });

    await this.audit.log({
      action: 'procurement.grn:create',
      entityType: 'goods_receipt',
      entityId: grn.id,
      after: { number, vendorId: dto.vendorId, lineCount: grn.lines.length },
    });
    return grn;
  }

  async postGrn(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const grn = await this.prisma.goodsReceipt.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    if (grn.status !== 'DRAFT') {
      throw new UnprocessableEntityException('GRN is already posted or cancelled');
    }

    const businessDate = new Date(grn.businessDate);

    await this.prisma.$transaction(async (tx) => {
      for (const line of grn.lines) {
        const qty = new Decimal(line.qtyReceived);
        const cost = new Decimal(line.unitPrice);

        // Post stock movement
        await tx.stockLedger.create({
          data: {
            tenantId,
            storeId: grn.storeId,
            itemId: line.itemId,
            movementType: 'PURCHASE_RECEIPT',
            qty,
            unitCost: cost,
            sourceType: 'GRN',
            sourceId: id,
            sourceLineId: line.id,
            businessDate,
            createdBy: userId,
          },
        });

        // Update stock summary
        const existing = await tx.stockSummary.findUnique({
          where: { storeId_itemId: { storeId: grn.storeId, itemId: line.itemId } },
        });
        let newAvgCost: Decimal;
        let newOnHand: Decimal;
        if (!existing) {
          newOnHand = qty;
          newAvgCost = cost;
        } else {
          newOnHand = new Decimal(existing.onHand).plus(qty);
          const numerator = new Decimal(existing.onHand)
            .times(existing.avgCost)
            .plus(qty.times(cost));
          newAvgCost = newOnHand.isZero() ? cost : numerator.dividedBy(newOnHand);
        }
        await tx.stockSummary.upsert({
          where: { storeId_itemId: { storeId: grn.storeId, itemId: line.itemId } },
          create: { tenantId, storeId: grn.storeId, itemId: line.itemId, onHand: newOnHand, avgCost: newAvgCost },
          update: { onHand: newOnHand, avgCost: newAvgCost },
        });

        // Create batch if batch number provided
        if (line.batchNumber) {
          await tx.stockBatch.create({
            data: {
              tenantId,
              itemId: line.itemId,
              storeId: grn.storeId,
              batchNumber: line.batchNumber,
              expiryDate: line.expiryDate ?? undefined,
              unitCost: cost,
              qtyReceived: qty,
              qtyRemaining: qty,
            },
          });
        }

        // Update PO line received qty
        if (line.poLineId) {
          await tx.purchaseOrderLine.update({
            where: { id: line.poLineId },
            data: { qtyReceived: { increment: Number(qty) } },
          });
        }
      }

      // Update PO status
      if (grn.poId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: grn.poId },
          include: { lines: true },
        });
        if (po) {
          const allReceived = po.lines.every((l) => new Decimal(l.qtyReceived).gte(l.qty));
          await tx.purchaseOrder.update({
            where: { id: grn.poId },
            data: { status: allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED' },
          });
        }
      }

      await tx.goodsReceipt.update({
        where: { id },
        data: { status: 'POSTED', postedAt: new Date() },
      });
    });

    await this.audit.log({
      action: 'procurement.grn:post',
      entityType: 'goods_receipt',
      entityId: id,
      after: { status: 'POSTED' },
    });

    return this.getGrn(id);
  }

  // ── purchase invoices ──────────────────────────────────────────────────────

  async listPurchaseInvoices(query: ProcurementListQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;
    const rows = await this.prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.vendorId ? { vendorId: query.vendorId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
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

  async getPurchaseInvoice(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const inv = await this.prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!inv) throw new NotFoundException('Purchase invoice not found');
    return inv;
  }

  async createPurchaseInvoice(dto: CreatePurchaseInvoiceDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    if (!dto.lines.length) throw new BadRequestException('At least one line is required');

    let subtotal = new Decimal(0);
    let taxAmount = new Decimal(0);
    for (const l of dto.lines) {
      const lineSub = new Decimal(l.qty).times(l.unitPrice);
      subtotal = subtotal.plus(lineSub);
      const lineTax = lineSub.times(l.taxRate ?? 0).dividedBy(100);
      taxAmount = taxAmount.plus(lineTax);
    }
    const totalAmount = subtotal.plus(taxAmount);

    const number = await this.seq.next(tenantId, dto.companyId, 'PI', 'PI');
    const inv = await this.prisma.purchaseInvoice.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        number,
        vendorInvoiceNumber: dto.vendorInvoiceNumber,
        vendorId: dto.vendorId,
        poId: dto.poId,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        currency: dto.currency ?? 'INR',
        subtotal,
        taxAmount,
        totalAmount,
        note: dto.note,
        createdBy: userId,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            poLineId: l.poLineId,
            grnLineId: l.grnLineId,
            itemId: l.itemId,
            qty: l.qty,
            unitPrice: l.unitPrice,
            taxGroupId: l.taxGroupId,
            taxRate: l.taxRate ?? 0,
            taxAmount: new Decimal(l.qty).times(l.unitPrice).times(l.taxRate ?? 0).dividedBy(100),
          })),
        },
      },
      include: { lines: true },
    });
    await this.audit.log({
      action: 'procurement.invoice:create',
      entityType: 'purchase_invoice',
      entityId: inv.id,
      after: { number, totalAmount },
    });
    return inv;
  }

  async postPurchaseInvoice(id: string) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const inv = await this.prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!inv) throw new NotFoundException('Purchase invoice not found');
    if (inv.status !== 'DRAFT') {
      throw new UnprocessableEntityException('Invoice is already posted or cancelled');
    }

    const businessDate = new Date(inv.invoiceDate);

    await this.prisma.$transaction(async (tx) => {
      // Post to vendor ledger (positive = we owe the vendor)
      await tx.vendorLedger.create({
        data: {
          tenantId,
          vendorId: inv.vendorId,
          amount: inv.totalAmount,
          sourceType: 'PURCHASE_INVOICE',
          sourceId: id,
          businessDate,
          note: `Invoice ${inv.number}`,
        },
      });

      // Update PO invoiced qty
      for (const line of inv.lines) {
        if (line.poLineId) {
          await tx.purchaseOrderLine.update({
            where: { id: line.poLineId },
            data: { qtyInvoiced: { increment: Number(line.qty) } },
          });
        }
      }

      await tx.purchaseInvoice.update({
        where: { id },
        data: { status: 'POSTED', postedAt: new Date() },
      });
    });

    await this.audit.log({
      action: 'procurement.invoice:post',
      entityType: 'purchase_invoice',
      entityId: id,
      after: { status: 'POSTED', totalAmount: inv.totalAmount },
    });

    return this.getPurchaseInvoice(id);
  }

  // ── vendor notes ───────────────────────────────────────────────────────────

  async createVendorNote(dto: CreateVendorNoteDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const number = await this.seq.next(
      tenantId,
      dto.companyId,
      dto.type === 'DEBIT' ? 'DN' : 'CN',
      dto.type === 'DEBIT' ? 'DN' : 'CN',
    );
    const businessDate = new Date(dto.businessDate);

    await this.prisma.$transaction(async (tx) => {
      await tx.vendorNote.create({
        data: {
          tenantId,
          companyId: dto.companyId,
          number,
          type: dto.type as never,
          vendorId: dto.vendorId,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          reason: dto.reason,
          businessDate,
          createdBy: userId,
        },
      });

      // Debit note = we reduce what we owe (negative on ledger)
      // Credit note = vendor owes us more (also negative = reduces liability)
      const ledgerAmount = dto.type === 'DEBIT'
        ? new Decimal(dto.amount).negated()
        : new Decimal(dto.amount).negated();

      await tx.vendorLedger.create({
        data: {
          tenantId,
          vendorId: dto.vendorId,
          amount: ledgerAmount,
          sourceType: dto.type === 'DEBIT' ? 'DEBIT_NOTE' : 'CREDIT_NOTE',
          sourceId: number,
          businessDate,
          note: `${dto.type === 'DEBIT' ? 'Debit' : 'Credit'} note ${number}`,
        },
      });
    });

    await this.audit.log({
      action: 'procurement.note:manage',
      entityType: 'vendor_note',
      after: { number, type: dto.type, amount: dto.amount },
    });

    return this.prisma.vendorNote.findFirst({ where: { tenantId, number } });
  }

  // ── vendor payments ────────────────────────────────────────────────────────

  async createVendorPayment(dto: CreateVendorPaymentDto) {
    const tenantId = TenantContext.requireTenantId();
    const userId = TenantContext.get()?.userId;
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const number = await this.seq.next(tenantId, dto.companyId, 'VPY', 'VPY');
    const businessDate = new Date(dto.businessDate);
    const netPaid = new Decimal(dto.amount).minus(dto.tdsAmount ?? 0);

    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.vendorPayment.create({
        data: {
          tenantId,
          companyId: dto.companyId,
          number,
          vendorId: dto.vendorId,
          method: dto.method as never,
          amount: dto.amount,
          tdsAmount: dto.tdsAmount ?? 0,
          reference: dto.reference,
          businessDate,
          note: dto.note,
          createdBy: userId,
        },
      });

      if (dto.allocations?.length) {
        await tx.vendorPaymentAllocation.createMany({
          data: dto.allocations.map((a) => ({
            tenantId,
            paymentId: payment.id,
            invoiceId: a.invoiceId,
            amount: a.amount,
          })),
        });

        // Update invoice amountPaid
        for (const a of dto.allocations) {
          await tx.purchaseInvoice.update({
            where: { id: a.invoiceId },
            data: { amountPaid: { increment: Number(a.amount) } },
          });
        }
      }

      // Post to vendor ledger (negative = reduces what we owe)
      await tx.vendorLedger.create({
        data: {
          tenantId,
          vendorId: dto.vendorId,
          amount: netPaid.negated(),
          sourceType: 'PAYMENT',
          sourceId: payment.id,
          businessDate,
          note: `Payment ${number}`,
        },
      });
    });

    await this.audit.log({
      action: 'procurement.vendor-payment:create',
      entityType: 'vendor_payment',
      after: { number, amount: dto.amount, vendorId: dto.vendorId },
    });

    return this.prisma.vendorPayment.findFirst({ where: { tenantId, number } });
  }

  // ── vendor ledger ──────────────────────────────────────────────────────────

  async getVendorLedger(vendorId: string, query: VendorLedgerQueryDto) {
    const tenantId = TenantContext.requireTenantId();
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const limit = query.limit ?? 50;

    const [entries, balance] = await Promise.all([
      this.prisma.vendorLedger.findMany({
        where: {
          tenantId,
          vendorId,
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
      }),
      this.prisma.vendorLedger.aggregate({
        where: { tenantId, vendorId },
        _sum: { amount: true },
      }),
    ]);

    const hasMore = entries.length > limit;
    if (hasMore) entries.pop();

    return {
      vendor: { id: vendor.id, name: vendor.name, code: vendor.code },
      balance: balance._sum.amount ?? 0,
      data: entries,
      nextCursor: hasMore ? entries[entries.length - 1]?.id : null,
    };
  }
}
