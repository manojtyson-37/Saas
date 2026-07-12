import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/;
const CODE_MSG = 'code must be 1–30 chars: letters, digits, dash, underscore';

// ── UoMs ─────────────────────────────────────────────────────────────────────

export class CreateUomDto {
  @ApiProperty({ example: 'Kilogram' }) @IsString() @IsNotEmpty() @MaxLength(60)
  name!: string;

  @ApiProperty({ example: 'KG' }) @IsString() @Matches(CODE_RE, { message: CODE_MSG })
  code!: string;

  @ApiPropertyOptional({ default: 3, description: 'Decimal places for this UoM' })
  @IsOptional() @IsInt() @Min(0) @Max(6)
  precision?: number;
}

export class CreateUomConversionDto {
  @ApiProperty({ description: 'Source UoM UUID' }) @IsUUID()
  fromUomId!: string;

  @ApiProperty({ description: 'Target UoM UUID' }) @IsUUID()
  toUomId!: string;

  @ApiProperty({ description: 'Multiply from-qty by this factor to get to-qty', example: 1000 })
  @IsNumber({ maxDecimalPlaces: 6 }) @Min(0.000001)
  factor!: number;
}

// ── inventory items ───────────────────────────────────────────────────────────

export enum InventoryItemType {
  RAW_MATERIAL = 'RAW_MATERIAL',
  SEMI_FINISHED = 'SEMI_FINISHED',
  FINISHED_GOOD = 'FINISHED_GOOD',
  PACKAGING = 'PACKAGING',
  LIQUOR = 'LIQUOR',
  BEVERAGE = 'BEVERAGE',
  HOTEL_SUPPLY = 'HOTEL_SUPPLY',
  CLEANING_SUPPLY = 'CLEANING_SUPPLY',
  STATIONERY = 'STATIONERY',
  ASSET_ITEM = 'ASSET_ITEM',
}

export class CreateInventoryItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_RE, { message: CODE_MSG })
  code!: string;

  @ApiProperty({ enum: InventoryItemType }) @IsEnum(InventoryItemType)
  type!: InventoryItemType;

  @ApiPropertyOptional({ description: 'Freeform category label' })
  @IsOptional() @IsString() @MaxLength(80)
  categoryName?: string;

  @ApiProperty({ description: 'Base UoM UUID (e.g., KG)' }) @IsUUID()
  baseUomId!: string;

  @ApiPropertyOptional({ description: 'Purchase UoM UUID when different from base (e.g., crate → bottles)' })
  @IsOptional() @IsUUID()
  purchaseUomId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  barcode?: string;

  @ApiPropertyOptional({ description: 'HSN code for GST classification' })
  @IsOptional() @IsString() @MaxLength(20)
  hsnCode?: string;

  @ApiPropertyOptional({ description: 'TaxGroup UUID' }) @IsOptional() @IsUUID()
  taxGroupId?: string;

  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean()
  isPerishable?: boolean;

  @ApiPropertyOptional({ description: 'Shelf life in days (for perishables)' })
  @IsOptional() @IsInt() @Min(1)
  shelfLifeDays?: number;

  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean()
  trackBatches?: boolean;

  @ApiPropertyOptional({ description: 'Bottle volume in ml (bar module)' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  bottleVolumeMl?: number;

  @ApiPropertyOptional({ description: 'Standard peg size in ml (bar module)' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  pegSizeMl?: number;

  @ApiPropertyOptional({ default: 0, description: 'Standard / last purchase cost' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  standardCost?: number;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  categoryName?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  purchaseUomId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  barcode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  hsnCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  taxGroupId?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isPerishable?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
  shelfLifeDays?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  trackBatches?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  bottleVolumeMl?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  pegSizeMl?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  standardCost?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ── reorder levels ────────────────────────────────────────────────────────────

export class SetReorderLevelDto {
  @ApiProperty({ description: 'Store UUID' }) @IsUUID()
  storeId!: string;

  @ApiProperty({ description: 'Reorder trigger quantity' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  minQty!: number;

  @ApiProperty({ description: 'Order-up-to quantity' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  parQty!: number;
}

// ── opening stock ─────────────────────────────────────────────────────────────

export class OpeningStockLineDto {
  @ApiProperty({ description: 'InventoryItem UUID' }) @IsUUID()
  itemId!: string;

  @ApiProperty({ description: 'Store UUID' }) @IsUUID()
  storeId!: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  qty!: number;

  @ApiProperty({ description: 'Unit cost (weighted average seed)' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  unitCost!: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ description: 'Batch number (if trackBatches=true)' })
  @IsOptional() @IsString() @MaxLength(60)
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiry date (ISO 8601)' })
  @IsOptional()
  expiryDate?: Date;
}

export class PostOpeningStockDto {
  @ApiProperty({ type: [OpeningStockLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => OpeningStockLineDto)
  lines!: OpeningStockLineDto[];

  @ApiPropertyOptional({ description: 'Business date (defaults to today)' })
  @IsOptional()
  businessDate?: Date;
}

// ── stock ledger ──────────────────────────────────────────────────────────────

export class StockLedgerQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID()
  storeId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ description: 'Cursor (last seen UUID v7)' })
  @IsOptional() @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional() @IsInt() @Min(1) @Max(200) @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'From date (ISO 8601)' }) @IsOptional()
  from?: Date;

  @ApiPropertyOptional({ description: 'To date (ISO 8601)' }) @IsOptional()
  to?: Date;
}

// ── stock transfers ───────────────────────────────────────────────────────────

export class TransferLineDto {
  @ApiProperty({ description: 'InventoryItem UUID' }) @IsUUID()
  itemId!: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)
  qty!: number;

  @ApiProperty({ description: 'Unit cost for ledger valuation' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  unitCost!: number;

  @ApiPropertyOptional({ description: 'Batch UUID (if batch-tracked)' })
  @IsOptional() @IsUUID()
  batchId?: string;
}

export class CreateTransferDto {
  @ApiProperty({ description: 'Source store UUID' }) @IsUUID()
  fromStoreId!: string;

  @ApiProperty({ description: 'Destination store UUID' }) @IsUUID()
  toStoreId!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ApiProperty({ type: [TransferLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => TransferLineDto)
  lines!: TransferLineDto[];
}

export class ReceiveTransferDto {
  @ApiProperty({ type: [Object], description: 'Array of { lineId, qtyReceived }' })
  @IsArray()
  lines!: Array<{ lineId: string; qtyReceived: number }>;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

// ── stock adjustments ─────────────────────────────────────────────────────────

export enum AdjustmentReason {
  WASTE = 'WASTE',
  PILFERAGE = 'PILFERAGE',
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  SPILLAGE = 'SPILLAGE',
  CORRECTION = 'CORRECTION',
  OTHER = 'OTHER',
}

export class AdjustmentLineDto {
  @ApiProperty({ description: 'InventoryItem UUID' }) @IsUUID()
  itemId!: string;

  @ApiProperty({ description: 'Signed quantity (negative to reduce stock)' })
  @IsNumber({ maxDecimalPlaces: 4 })
  qty!: number;

  @ApiProperty({ description: 'Unit cost for ledger' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  unitCost!: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  batchId?: string;
}

export class CreateAdjustmentDto {
  @ApiProperty({ description: 'Store UUID' }) @IsUUID()
  storeId!: string;

  @ApiProperty({ enum: AdjustmentReason }) @IsEnum(AdjustmentReason)
  reason!: AdjustmentReason;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ description: 'Business date (defaults to today)' })
  @IsOptional()
  businessDate?: Date;

  @ApiProperty({ type: [AdjustmentLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => AdjustmentLineDto)
  lines!: AdjustmentLineDto[];
}

// ── stock counts ──────────────────────────────────────────────────────────────

export class CreateCountDto {
  @ApiProperty({ description: 'Store UUID' }) @IsUUID()
  storeId!: string;

  @ApiPropertyOptional({ type: [String], description: 'Optionally scope to specific item UUIDs; empty = all items' })
  @IsOptional() @IsArray() @IsUUID('all', { each: true })
  itemIds?: string[];
}

export class EnterCountLineDto {
  @ApiProperty({ description: 'Physically counted quantity' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  countedQty!: number;
}

// ── list queries ──────────────────────────────────────────────────────────────

export class ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional() @IsInt() @Min(1) @Max(200) @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  storeId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  q?: string;
}

export class StockSummaryQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID()
  storeId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ description: 'Only items below reorder level' })
  @IsOptional() @IsBoolean() @Type(() => Boolean)
  belowReorder?: boolean;
}
