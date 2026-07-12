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

// ── categories ───────────────────────────────────────────────────────────────

export class CreateCategoryDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_RE, { message: CODE_MSG })
  code!: string;

  @ApiPropertyOptional({ description: 'Parent category UUID for nested menus' })
  @IsOptional() @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  parentId?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ── menu items ───────────────────────────────────────────────────────────────

export enum DietaryType {
  VEG = 'VEG',
  NON_VEG = 'NON_VEG',
  EGG = 'EGG',
  VEGAN = 'VEGAN',
}

export class CreateMenuItemVariantDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)
  name!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  sku?: string;

  @ApiProperty({ description: 'Base selling price' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean()
  isDefault?: boolean;
}

export class CreateMenuItemDto {
  @ApiProperty() @IsUUID()
  categoryId!: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_RE, { message: CODE_MSG })
  code!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ enum: DietaryType, default: DietaryType.VEG })
  @IsOptional() @IsEnum(DietaryType)
  dietaryType?: DietaryType;

  @ApiPropertyOptional({ type: [String], description: 'Allergen tags' })
  @IsOptional() @IsArray() @IsString({ each: true })
  allergens?: string[];

  @ApiPropertyOptional({ description: 'Link to InventoryItem for direct-stock items' })
  @IsOptional() @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional({ description: 'Link to Recipe for recipe-costed items' })
  @IsOptional() @IsUUID()
  recipeId?: string;

  @ApiPropertyOptional({ description: 'TaxGroup UUID' })
  @IsOptional() @IsUUID()
  taxGroupId?: string;

  @ApiPropertyOptional({ description: 'KitchenStation UUID' })
  @IsOptional() @IsUUID()
  kitchenStationId?: string;

  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()
  isSellable?: boolean;

  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;

  @ApiProperty({ type: [CreateMenuItemVariantDto], description: 'At least one variant required' })
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateMenuItemVariantDto)
  variants!: CreateMenuItemVariantDto[];
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ enum: DietaryType }) @IsOptional() @IsEnum(DietaryType)
  dietaryType?: DietaryType;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true })
  allergens?: string[];

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  recipeId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  taxGroupId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  kitchenStationId?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isSellable?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

export class CreateVariantDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)
  name!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  sku?: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  basePrice!: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isDefault?: boolean;
}

export class UpdateVariantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  sku?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  basePrice?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ── modifier groups ───────────────────────────────────────────────────────────

export class CreateModifierDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  price?: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  consumptionQty?: number;
}

export class CreateModifierGroupDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ default: 0, description: 'Minimum number of selections' })
  @IsOptional() @IsInt() @Min(0)
  minSelect?: number;

  @ApiPropertyOptional({ default: 1, description: 'Maximum number of selections' })
  @IsOptional() @IsInt() @Min(1)
  maxSelect?: number;

  @ApiPropertyOptional({ type: [CreateModifierDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateModifierDto)
  modifiers?: CreateModifierDto[];
}

export class UpdateModifierGroupDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  minSelect?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
  maxSelect?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateModifierDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  price?: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  consumptionQty?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class AttachModifierGroupDto {
  @ApiProperty() @IsUUID()
  modifierGroupId!: string;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

// ── price lists ───────────────────────────────────────────────────────────────

export enum PriceListKind {
  OUTLET = 'OUTLET',
  CHANNEL = 'CHANNEL',
  HAPPY_HOUR = 'HAPPY_HOUR',
  DAY_PART = 'DAY_PART',
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreatePriceListDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)
  name!: string;

  @ApiProperty({ enum: PriceListKind }) @IsEnum(PriceListKind)
  kind!: PriceListKind;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  outletId?: string;

  @ApiPropertyOptional({ description: 'Order channel e.g. DINE_IN, DELIVERY, TAKEAWAY' })
  @IsOptional() @IsString() @MaxLength(30)
  channel?: string;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) @Max(100)
  priority?: number;

  @ApiPropertyOptional({ type: [Number], description: 'Days of week (0=Sun … 6=Sat)' })
  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'HH:MM start time for happy hour / day-part' })
  @IsOptional() @IsString() @Matches(TIME_RE, { message: 'startTime must be HH:MM' })
  startTime?: string;

  @ApiPropertyOptional({ description: 'HH:MM end time' })
  @IsOptional() @IsString() @Matches(TIME_RE, { message: 'endTime must be HH:MM' })
  endTime?: string;

  @ApiPropertyOptional() @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional() @IsOptional()
  validTo?: Date;
}

export class UpdatePriceListDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100)
  priority?: number;

  @ApiPropertyOptional() @IsOptional() @IsArray() @IsInt({ each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(TIME_RE, { message: 'startTime must be HH:MM' })
  startTime?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(TIME_RE, { message: 'endTime must be HH:MM' })
  endTime?: string;

  @ApiPropertyOptional() @IsOptional() validFrom?: Date;
  @ApiPropertyOptional() @IsOptional() validTo?: Date;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class PriceListItemDto {
  @ApiProperty() @IsUUID()
  menuItemVariantId!: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  price!: number;
}

export class SetPriceListItemsDto {
  @ApiProperty({ type: [PriceListItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PriceListItemDto)
  items!: PriceListItemDto[];
}

// ── cursor pagination ─────────────────────────────────────────────────────────

export class CatalogListQueryDto {
  @ApiPropertyOptional({ description: 'Cursor (last seen UUID v7)' })
  @IsOptional() @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional() @IsInt() @Min(1) @Max(200) @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by categoryId' })
  @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search by name/code' })
  @IsOptional() @IsString() @MaxLength(100)
  q?: string;
}
