import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum DepreciationMethod {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  WRITTEN_DOWN_VALUE = 'WRITTEN_DOWN_VALUE',
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export class CreateAssetDto {
  @IsUUID() companyId: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() category: string;
  @IsISO8601() purchaseDate: string;
  @IsNumber() @Min(0) purchaseCost: number;
  @IsOptional() @IsNumber() @Min(0) salvageValue?: number;
  @IsInt() @Min(1) usefulLifeMonths: number;
  @IsOptional() @IsEnum(DepreciationMethod) depreciationMethod?: DepreciationMethod;
  @IsOptional() @IsUUID() vendorId?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsISO8601() warrantyUntil?: string;
}

export class UpdateAssetDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsISO8601() warrantyUntil?: string;
  @IsOptional() @IsISO8601() disposedAt?: string;
}

export class AssetQueryDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}

// ─── Depreciation ─────────────────────────────────────────────────────────────

export class RunDepreciationDto {
  @IsUUID() companyId: string;
  @IsString() @IsNotEmpty() period: string; // "2026-07"
}

// ─── AMC Contracts ────────────────────────────────────────────────────────────

export class CreateAmcDto {
  @IsUUID() assetId: string;
  @IsOptional() @IsUUID() vendorId?: string;
  @IsString() @IsNotEmpty() contractNumber: string;
  @IsISO8601() startDate: string;
  @IsISO8601() endDate: string;
  @IsNumber() @Min(0) cost: number;
  @IsOptional() @IsString() coverage?: string;
  @IsOptional() @IsInt() @Min(0) reminderDaysBefore?: number;
}

// ─── Maintenance Tickets ──────────────────────────────────────────────────────

export class CreateMaintenanceTicketDto {
  @IsUUID() assetId: string;
  @IsString() @IsNotEmpty() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) priority?: number;
  @IsOptional() @IsBoolean() isPreventive?: boolean;
  @IsOptional() @IsISO8601() scheduledFor?: string;
  @IsOptional() @IsString() assignedTo?: string;
}

export class UpdateMaintenanceTicketDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsNumber() @Min(0) cost?: number;
  @IsOptional() @IsISO8601() resolvedAt?: string;
}
