import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/;
const CODE_MESSAGE = 'code must be 1–30 chars: letters, digits, dash, underscore';
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// ── companies ───────────────────────────────────────────────────────────────

export class CreateCompanyDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200)
  legalName!: string;

  @ApiProperty() @IsString() @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code!: string;

  @ApiPropertyOptional({ description: 'GSTIN / VAT registration' })
  @IsOptional() @IsString() @MaxLength(30)
  taxRegistrationNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  panNumber?: string;

  @ApiPropertyOptional({ default: 'INR' }) @IsOptional() @IsString() @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ default: 'IN' }) @IsOptional() @IsString() @MaxLength(2)
  country?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressLine1?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressLine2?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12)
  postalCode?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 12, default: 4 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12)
  fiscalYearStartMonth?: number;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200)
  legalName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  taxRegistrationNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  panNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressLine1?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressLine2?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12)
  postalCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ── brands ──────────────────────────────────────────────────────────────────

export class CreateBrandDto {
  @ApiProperty() @IsUUID()
  companyId!: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  cuisineType?: string;
}

export class UpdateBrandDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  cuisineType?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ── locations ───────────────────────────────────────────────────────────────

export enum LocationTypeDto {
  RESTAURANT = 'RESTAURANT',
  HOTEL = 'HOTEL',
  CLOUD_KITCHEN = 'CLOUD_KITCHEN',
  CAFE = 'CAFE',
  BAKERY = 'BAKERY',
  BAR = 'BAR',
  BREWERY = 'BREWERY',
  FOOD_COURT_UNIT = 'FOOD_COURT_UNIT',
  CATERING_UNIT = 'CATERING_UNIT',
  WAREHOUSE = 'WAREHOUSE',
  COMMISSARY = 'COMMISSARY',
  HEAD_OFFICE = 'HEAD_OFFICE',
}

export class CreateLocationDto {
  @ApiProperty() @IsUUID()
  companyId!: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  brandId?: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code!: string;

  @ApiProperty({ enum: LocationTypeDto }) @IsEnum(LocationTypeDto)
  type!: LocationTypeDto;

  @ApiPropertyOptional({ default: 'Asia/Kolkata' }) @IsOptional() @IsString() @MaxLength(60)
  timezone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressLine1?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12)
  postalCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(254)
  email?: string;
}

export class UpdateLocationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  brandId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  timezone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressLine1?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12)
  postalCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(254)
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ── outlets, floors, tables ─────────────────────────────────────────────────

export enum OutletTypeDto {
  DINE_IN = 'DINE_IN',
  QSR = 'QSR',
  BAR = 'BAR',
  BAKERY_COUNTER = 'BAKERY_COUNTER',
  ROOM_SERVICE = 'ROOM_SERVICE',
  BANQUET = 'BANQUET',
  DELIVERY_ONLY = 'DELIVERY_ONLY',
  TAKEAWAY_COUNTER = 'TAKEAWAY_COUNTER',
}

export class CreateOutletDto {
  @ApiProperty() @IsUUID()
  locationId!: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code!: string;

  @ApiProperty({ enum: OutletTypeDto }) @IsEnum(OutletTypeDto)
  type!: OutletTypeDto;

  @ApiPropertyOptional({ default: '04:00', description: 'HH:mm local — when the business day rolls' })
  @IsOptional() @IsString() @Matches(TIME_PATTERN, { message: 'dayCloseTime must be HH:mm' })
  dayCloseTime?: string;
}

export class UpdateOutletDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(TIME_PATTERN, { message: 'dayCloseTime must be HH:mm' })
  dayCloseTime?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CreateFloorDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;
}

export class CreateTableDto {
  @ApiProperty({ example: 'T1' }) @IsString() @IsNotEmpty() @MaxLength(20)
  name!: string;

  @ApiPropertyOptional({ default: 4 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  capacity?: number;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @Type(() => Number) @IsInt()
  posX?: number;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @Type(() => Number) @IsInt()
  posY?: number;

  @ApiPropertyOptional({ default: 'square', enum: ['square', 'round', 'rect'] })
  @IsOptional() @IsString() @MaxLength(20)
  shape?: string;
}

export class UpdateTableDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(20)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  capacity?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt()
  posX?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt()
  posY?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  shape?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ── stores & terminals ──────────────────────────────────────────────────────

export enum StoreTypeDto {
  MAIN = 'MAIN',
  KITCHEN = 'KITCHEN',
  BAR = 'BAR',
  HOUSEKEEPING = 'HOUSEKEEPING',
  WAREHOUSE = 'WAREHOUSE',
  COMMISSARY = 'COMMISSARY',
}

export class CreateStoreDto {
  @ApiProperty() @IsUUID()
  locationId!: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code!: string;

  @ApiProperty({ enum: StoreTypeDto }) @IsEnum(StoreTypeDto)
  type!: StoreTypeDto;

  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean()
  allowNegativeStock?: boolean;
}

export class UpdateStoreDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  allowNegativeStock?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CreateTerminalDto {
  @ApiProperty() @IsUUID()
  outletId!: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code!: string;
}

export class UpdateTerminalDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'DISABLED'] })
  @IsOptional() @IsEnum({ ACTIVE: 'ACTIVE', DISABLED: 'DISABLED' })
  status?: 'ACTIVE' | 'DISABLED';
}
