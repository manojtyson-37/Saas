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
import { InventoryService } from './inventory.service';
import {
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

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  // ── UoMs ───────────────────────────────────────────────────────────────────

  @Get('uoms')
  @RequirePermission('inventory.item:read')
  @ApiOperation({ summary: 'List units of measure' })
  listUoms() {
    return this.svc.listUoms();
  }

  @Post('uoms')
  @RequirePermission('inventory.item:create')
  @ApiOperation({ summary: 'Create a unit of measure' })
  createUom(@Body() dto: CreateUomDto) {
    return this.svc.createUom(dto);
  }

  @Post('items/:id/uom-conversions')
  @RequirePermission('inventory.item:update')
  @ApiOperation({ summary: 'Add / update a UoM conversion for an item' })
  addUomConversion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateUomConversionDto,
  ) {
    return this.svc.addUomConversion(id, dto);
  }

  // ── inventory items ────────────────────────────────────────────────────────

  @Get('items')
  @RequirePermission('inventory.item:read')
  @ApiOperation({ summary: 'List inventory items (cursor-paginated)' })
  listItems(@Query() query: ListQueryDto) {
    return this.svc.listItems(query);
  }

  @Post('items')
  @RequirePermission('inventory.item:create')
  @ApiOperation({ summary: 'Create an inventory item (raw material, beverage, etc.)' })
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.svc.createItem(dto);
  }

  @Get('items/:id')
  @RequirePermission('inventory.item:read')
  @ApiOperation({ summary: 'Get inventory item with stock summaries' })
  getItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getItem(id);
  }

  @Patch('items/:id')
  @RequirePermission('inventory.item:update')
  @ApiOperation({ summary: 'Update an inventory item' })
  updateItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.svc.updateItem(id, dto);
  }

  @Delete('items/:id')
  @HttpCode(204)
  @RequirePermission('inventory.item:delete')
  @ApiOperation({ summary: 'Soft-delete an inventory item (must have no stock on hand)' })
  async deleteItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.deleteItem(id);
  }

  @Put('items/:id/reorder-level')
  @RequirePermission('inventory.item:update')
  @ApiOperation({ summary: 'Set reorder level for an item in a store' })
  setReorderLevel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetReorderLevelDto) {
    return this.svc.setReorderLevel(id, dto);
  }

  // ── stock ──────────────────────────────────────────────────────────────────

  @Get('stock')
  @RequirePermission('inventory.stock:read')
  @ApiOperation({ summary: 'Get on-hand stock summaries per item per store' })
  getStockSummaries(@Query() query: StockSummaryQueryDto) {
    return this.svc.getStockSummaries(query);
  }

  @Post('opening-stock')
  @RequirePermission('inventory.opening-stock:create')
  @ApiOperation({ summary: 'Post opening stock (one-time per item/store)' })
  postOpeningStock(@Body() dto: PostOpeningStockDto) {
    return this.svc.postOpeningStock(dto);
  }

  @Get('ledger')
  @RequirePermission('inventory.stock:read')
  @ApiOperation({ summary: 'Read stock ledger (append-only movements, cursor-paginated)' })
  getStockLedger(@Query() query: StockLedgerQueryDto) {
    return this.svc.getStockLedger(query);
  }

  // ── transfers ──────────────────────────────────────────────────────────────

  @Get('transfers')
  @RequirePermission('inventory.transfer:read')
  @ApiOperation({ summary: 'List stock transfers' })
  listTransfers(@Query() query: ListQueryDto) {
    return this.svc.listTransfers(query);
  }

  @Post('transfers')
  @RequirePermission('inventory.transfer:create')
  @ApiOperation({ summary: 'Create a stock transfer (starts in DRAFT)' })
  createTransfer(@Body() dto: CreateTransferDto) {
    return this.svc.createTransfer(dto);
  }

  @Get('transfers/:id')
  @RequirePermission('inventory.transfer:read')
  @ApiOperation({ summary: 'Get a transfer with lines' })
  getTransfer(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getTransfer(id);
  }

  @Post('transfers/:id/dispatch')
  @RequirePermission('inventory.transfer:dispatch')
  @ApiOperation({ summary: 'Dispatch a transfer — deducts from source store' })
  dispatchTransfer(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.dispatchTransfer(id);
  }

  @Post('transfers/:id/receive')
  @RequirePermission('inventory.transfer:receive')
  @ApiOperation({ summary: 'Receive a transfer — credits destination store' })
  receiveTransfer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReceiveTransferDto) {
    return this.svc.receiveTransfer(id, dto);
  }

  @Delete('transfers/:id')
  @HttpCode(204)
  @RequirePermission('inventory.transfer:create')
  @ApiOperation({ summary: 'Cancel a DRAFT transfer' })
  async cancelTransfer(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.cancelTransfer(id);
  }

  // ── adjustments ────────────────────────────────────────────────────────────

  @Get('adjustments')
  @RequirePermission('inventory.adjustment:read')
  @ApiOperation({ summary: 'List stock adjustments' })
  listAdjustments(@Query() query: ListQueryDto) {
    return this.svc.listAdjustments(query);
  }

  @Post('adjustments')
  @RequirePermission('inventory.adjustment:create')
  @ApiOperation({ summary: 'Create a stock adjustment (immediately posts to ledger)' })
  createAdjustment(@Body() dto: CreateAdjustmentDto) {
    return this.svc.createAdjustment(dto);
  }

  // ── counts ─────────────────────────────────────────────────────────────────

  @Get('counts')
  @RequirePermission('inventory.count:read')
  @ApiOperation({ summary: 'List stock counts' })
  listCounts(@Query() query: ListQueryDto) {
    return this.svc.listCounts(query);
  }

  @Post('counts')
  @RequirePermission('inventory.count:create')
  @ApiOperation({ summary: 'Create a cycle count (snapshots current system quantities)' })
  createCount(@Body() dto: CreateCountDto) {
    return this.svc.createCount(dto);
  }

  @Get('counts/:id')
  @RequirePermission('inventory.count:read')
  @ApiOperation({ summary: 'Get count with lines' })
  getCount(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getCount(id);
  }

  @Patch('counts/:id/lines/:lineId')
  @RequirePermission('inventory.count:create')
  @ApiOperation({ summary: 'Enter the physically counted quantity for a line' })
  enterCountLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() dto: EnterCountLineDto,
  ) {
    return this.svc.enterCountLine(id, lineId, dto);
  }

  @Post('counts/:id/submit')
  @RequirePermission('inventory.count:create')
  @ApiOperation({ summary: 'Submit count for review' })
  submitCount(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.submitCount(id);
  }

  @Post('counts/:id/post')
  @RequirePermission('inventory.count:post')
  @ApiOperation({ summary: 'Post count variances to the stock ledger' })
  postCount(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.postCount(id);
  }

  @Delete('counts/:id')
  @HttpCode(204)
  @RequirePermission('inventory.count:create')
  @ApiOperation({ summary: 'Cancel a count (any status except POSTED)' })
  async cancelCount(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.cancelCount(id);
  }
}
