import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ProcurementService } from './procurement.service';
import {
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

@ApiTags('procurement')
@ApiBearerAuth()
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly svc: ProcurementService) {}

  // ── vendors ────────────────────────────────────────────────────────────────

  @Get('vendors')
  @RequirePermission('procurement.vendor:read')
  @ApiOperation({ summary: 'List vendors' })
  listVendors(@Query() query: ProcurementListQueryDto) {
    return this.svc.listVendors(query);
  }

  @Post('vendors')
  @RequirePermission('procurement.vendor:create')
  @ApiOperation({ summary: 'Create a vendor' })
  createVendor(@Body() dto: CreateVendorDto) {
    return this.svc.createVendor(dto);
  }

  @Get('vendors/:id')
  @RequirePermission('procurement.vendor:read')
  @ApiOperation({ summary: 'Get vendor with item catalog' })
  getVendor(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getVendor(id);
  }

  @Patch('vendors/:id')
  @RequirePermission('procurement.vendor:update')
  @ApiOperation({ summary: 'Update a vendor' })
  updateVendor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVendorDto) {
    return this.svc.updateVendor(id, dto);
  }

  @Delete('vendors/:id')
  @HttpCode(204)
  @RequirePermission('procurement.vendor:delete')
  @ApiOperation({ summary: 'Soft-delete a vendor' })
  async deleteVendor(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.deleteVendor(id);
  }

  @Get('vendors/:id/items')
  @RequirePermission('procurement.vendor:read')
  @ApiOperation({ summary: "List vendor's item catalog" })
  listVendorItems(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.listVendorItems(id);
  }

  @Put('vendors/:id/items/:itemId')
  @RequirePermission('procurement.vendor:update')
  @ApiOperation({ summary: 'Add or update a vendor item (SKU, price, lead time)' })
  upsertVendorItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpsertVendorItemDto,
  ) {
    return this.svc.upsertVendorItem(id, { ...dto, itemId });
  }

  @Delete('vendors/:id/items/:itemId')
  @HttpCode(204)
  @RequirePermission('procurement.vendor:update')
  @ApiOperation({ summary: 'Remove an item from vendor catalog' })
  async deleteVendorItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    await this.svc.deleteVendorItem(id, itemId);
  }

  @Get('vendors/:id/ledger')
  @RequirePermission('procurement.vendor-ledger:read')
  @ApiOperation({ summary: "Get vendor's account statement (balance + entries)" })
  getVendorLedger(@Param('id', ParseUUIDPipe) id: string, @Query() query: VendorLedgerQueryDto) {
    return this.svc.getVendorLedger(id, query);
  }

  // ── purchase requests ──────────────────────────────────────────────────────

  @Get('purchase-requests')
  @RequirePermission('procurement.pr:read')
  @ApiOperation({ summary: 'List purchase requests' })
  listPurchaseRequests(@Query() query: ProcurementListQueryDto) {
    return this.svc.listPurchaseRequests(query);
  }

  @Post('purchase-requests')
  @RequirePermission('procurement.pr:create')
  @ApiOperation({ summary: 'Create a purchase request' })
  createPurchaseRequest(@Body() dto: CreatePurchaseRequestDto) {
    return this.svc.createPurchaseRequest(dto);
  }

  @Get('purchase-requests/:id')
  @RequirePermission('procurement.pr:read')
  @ApiOperation({ summary: 'Get a purchase request with lines' })
  getPurchaseRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getPurchaseRequest(id);
  }

  @Post('purchase-requests/:id/submit')
  @RequirePermission('procurement.pr:create')
  @ApiOperation({ summary: 'Submit a purchase request for approval' })
  submitPurchaseRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.submitPurchaseRequest(id);
  }

  @Post('purchase-requests/:id/review')
  @RequirePermission('procurement.pr:approve')
  @ApiOperation({ summary: 'Approve or reject a purchase request' })
  reviewPurchaseRequest(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewPrDto) {
    return this.svc.reviewPurchaseRequest(id, dto);
  }

  // ── purchase orders ────────────────────────────────────────────────────────

  @Get('purchase-orders')
  @RequirePermission('procurement.po:read')
  @ApiOperation({ summary: 'List purchase orders' })
  listPurchaseOrders(@Query() query: ProcurementListQueryDto) {
    return this.svc.listPurchaseOrders(query);
  }

  @Post('purchase-orders')
  @RequirePermission('procurement.po:create')
  @ApiOperation({ summary: 'Create a purchase order' })
  createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.svc.createPurchaseOrder(dto);
  }

  @Get('purchase-orders/:id')
  @RequirePermission('procurement.po:read')
  @ApiOperation({ summary: 'Get purchase order with lines' })
  getPurchaseOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getPurchaseOrder(id);
  }

  @Post('purchase-orders/:id/submit')
  @RequirePermission('procurement.po:create')
  @ApiOperation({ summary: 'Submit PO for approval' })
  submitPurchaseOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.submitPurchaseOrder(id);
  }

  @Post('purchase-orders/:id/review')
  @RequirePermission('procurement.po:approve')
  @ApiOperation({ summary: 'Approve or reject a purchase order' })
  reviewPurchaseOrder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewPoDto) {
    return this.svc.reviewPurchaseOrder(id, dto);
  }

  // ── goods receipts ─────────────────────────────────────────────────────────

  @Get('goods-receipts')
  @RequirePermission('procurement.grn:read')
  @ApiOperation({ summary: 'List goods receipts' })
  listGrns(@Query() query: ProcurementListQueryDto) {
    return this.svc.listGrns(query);
  }

  @Post('goods-receipts')
  @RequirePermission('procurement.grn:create')
  @ApiOperation({ summary: 'Create a goods receipt note (GRN) — starts in DRAFT' })
  createGrn(@Body() dto: CreateGrnDto) {
    return this.svc.createGrn(dto);
  }

  @Get('goods-receipts/:id')
  @RequirePermission('procurement.grn:read')
  @ApiOperation({ summary: 'Get GRN with lines' })
  getGrn(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getGrn(id);
  }

  @Post('goods-receipts/:id/post')
  @RequirePermission('procurement.grn:post')
  @ApiOperation({ summary: 'Post GRN → inserts stock ledger movements and updates summaries' })
  postGrn(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.postGrn(id);
  }

  // ── purchase invoices ──────────────────────────────────────────────────────

  @Get('purchase-invoices')
  @RequirePermission('procurement.invoice:read')
  @ApiOperation({ summary: 'List purchase invoices' })
  listPurchaseInvoices(@Query() query: ProcurementListQueryDto) {
    return this.svc.listPurchaseInvoices(query);
  }

  @Post('purchase-invoices')
  @RequirePermission('procurement.invoice:create')
  @ApiOperation({ summary: 'Create a purchase invoice (starts in DRAFT)' })
  createPurchaseInvoice(@Body() dto: CreatePurchaseInvoiceDto) {
    return this.svc.createPurchaseInvoice(dto);
  }

  @Get('purchase-invoices/:id')
  @RequirePermission('procurement.invoice:read')
  @ApiOperation({ summary: 'Get purchase invoice with lines' })
  getPurchaseInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getPurchaseInvoice(id);
  }

  @Post('purchase-invoices/:id/post')
  @RequirePermission('procurement.invoice:post')
  @ApiOperation({ summary: 'Post invoice → creates vendor ledger entry' })
  postPurchaseInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.postPurchaseInvoice(id);
  }

  // ── vendor notes ───────────────────────────────────────────────────────────

  @Post('vendor-notes')
  @RequirePermission('procurement.note:manage')
  @ApiOperation({ summary: 'Create a debit or credit note for a vendor' })
  createVendorNote(@Body() dto: CreateVendorNoteDto) {
    return this.svc.createVendorNote(dto);
  }

  // ── vendor payments ────────────────────────────────────────────────────────

  @Post('vendor-payments')
  @RequirePermission('procurement.vendor-payment:create')
  @ApiOperation({ summary: 'Record a vendor payment and allocate to invoices' })
  createVendorPayment(@Body() dto: CreateVendorPaymentDto) {
    return this.svc.createVendorPayment(dto);
  }
}
