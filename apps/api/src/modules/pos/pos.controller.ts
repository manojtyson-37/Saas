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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PosService } from './pos.service';
import {
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

@ApiTags('pos')
@ApiBearerAuth()
@Controller('pos')
export class PosController {
  constructor(private readonly svc: PosService) {}

  // ── Tax Groups ─────────────────────────────────────────────────────────────

  @Get('tax-groups')
  @RequirePermission('pos.order:read')
  @ApiOperation({ summary: 'List active tax groups' })
  listTaxGroups() {
    return this.svc.listTaxGroups();
  }

  // ── Cash Sessions ───────────────────────────────────────────────────────────

  @Get('sessions')
  @RequirePermission('pos.cash-session:read')
  @ApiOperation({ summary: 'List cash sessions' })
  listSessions(
    @Query('outletId') outletId?: string,
    @Query('businessDate') businessDate?: string,
  ) {
    return this.svc.listSessions(outletId, businessDate);
  }

  @Post('sessions')
  @RequirePermission('pos.cash-session:open')
  @ApiOperation({ summary: 'Open a cash session' })
  openSession(@Body() dto: OpenSessionDto) {
    return this.svc.openSession(dto);
  }

  @Get('sessions/:id')
  @RequirePermission('pos.cash-session:read')
  @ApiOperation({ summary: 'Get a cash session with movements' })
  getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getSession(id);
  }

  @Post('sessions/:id/close')
  @RequirePermission('pos.cash-session:close')
  @HttpCode(200)
  @ApiOperation({ summary: 'Close a cash session' })
  closeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseSessionDto,
  ) {
    return this.svc.closeSession(id, dto);
  }

  @Post('sessions/:id/movements')
  @RequirePermission('pos.cash-session:open')
  @ApiOperation({ summary: 'Add a cash movement (drop, payout, float)' })
  addCashMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCashMovementDto,
  ) {
    return this.svc.addCashMovement(id, dto);
  }

  // ── Orders ──────────────────────────────────────────────────────────────────

  @Get('orders')
  @RequirePermission('pos.order:read')
  @ApiOperation({ summary: 'List POS orders' })
  listOrders(@Query() q: PosOrderQueryDto) {
    return this.svc.listOrders(q);
  }

  @Post('orders')
  @RequirePermission('pos.order:create')
  @ApiOperation({ summary: 'Create a POS order (DRAFT)' })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.svc.createOrder(dto);
  }

  @Get('orders/:id')
  @RequirePermission('pos.order:read')
  @ApiOperation({ summary: 'Get a POS order with items, KOTs and payments' })
  getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getOrder(id);
  }

  @Post('orders/:id/items')
  @RequirePermission('pos.order:update')
  @ApiOperation({ summary: 'Add an item to an order' })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOrderItemDto,
  ) {
    return this.svc.addItem(id, dto);
  }

  @Patch('orders/:id/items/:itemId')
  @RequirePermission('pos.order:update')
  @ApiOperation({ summary: 'Update item qty / note' })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateOrderItemDto,
  ) {
    return this.svc.updateItem(id, itemId, dto);
  }

  @Delete('orders/:id/items/:itemId')
  @RequirePermission('pos.order:update')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove an item from a DRAFT order' })
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.svc.removeItem(id, itemId);
  }

  @Post('orders/:id/items/:itemId/void')
  @RequirePermission('pos.order:void')
  @HttpCode(200)
  @ApiOperation({ summary: 'Void a specific order item' })
  voidItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: VoidOrderItemDto,
  ) {
    return this.svc.voidItem(id, itemId, dto);
  }

  @Post('orders/:id/place')
  @RequirePermission('pos.order:update')
  @HttpCode(200)
  @ApiOperation({ summary: 'Place an order (DRAFT → PLACED)' })
  placeOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.placeOrder(id);
  }

  @Post('orders/:id/fire-kots')
  @RequirePermission('pos.order:update')
  @HttpCode(200)
  @ApiOperation({ summary: 'Fire KOTs for pending items (PLACED → IN_KITCHEN)' })
  fireKots(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.fireKots(id);
  }

  @Post('orders/:id/bill')
  @RequirePermission('pos.order:update')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate bill — computes totals and allocates invoice number' })
  billOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BillOrderDto,
  ) {
    return this.svc.billOrder(id, dto);
  }

  @Post('orders/:id/payments')
  @RequirePermission('pos.payment:capture')
  @ApiOperation({ summary: 'Add a payment tender to a billed order' })
  addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPaymentDto,
  ) {
    return this.svc.addPayment(id, dto);
  }

  @Post('orders/:id/settle')
  @RequirePermission('pos.payment:capture')
  @HttpCode(200)
  @ApiOperation({ summary: 'Settle an order — validates payment coverage and posts stock deductions' })
  settleOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.settleOrder(id);
  }

  @Post('orders/:id/void')
  @RequirePermission('pos.order:void')
  @HttpCode(200)
  @ApiOperation({ summary: 'Void an order' })
  voidOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidOrderDto,
  ) {
    return this.svc.voidOrder(id, dto);
  }

  @Post('orders/:id/split')
  @RequirePermission('pos.order:split')
  @HttpCode(200)
  @ApiOperation({ summary: 'Split an order into multiple child orders' })
  splitOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SplitOrderDto,
  ) {
    return this.svc.splitOrder(id, dto);
  }

  @Post('orders/merge')
  @RequirePermission('pos.order:merge')
  @HttpCode(200)
  @ApiOperation({ summary: 'Merge multiple orders into one' })
  mergeOrders(@Body() dto: MergeOrdersDto) {
    return this.svc.mergeOrders(dto);
  }

  // ── KDS ─────────────────────────────────────────────────────────────────────

  @Get('kots')
  @RequirePermission('pos.kds:operate')
  @ApiOperation({ summary: 'List KOTs for a kitchen station' })
  listKots(@Query() q: KotQueryDto) {
    return this.svc.listKots(q);
  }

  @Get('kots/:id')
  @RequirePermission('pos.kds:operate')
  @ApiOperation({ summary: 'Get a KOT with items' })
  getKot(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getKot(id);
  }

  @Patch('kots/:id/status')
  @RequirePermission('pos.kds:operate')
  @ApiOperation({ summary: 'Update KOT status (acknowledge / preparing / ready / bump)' })
  updateKotStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKotStatusDto,
  ) {
    return this.svc.updateKotStatus(id, dto);
  }
}
