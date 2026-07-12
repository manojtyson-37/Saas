import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

// ─── Bottles ──────────────────────────────────────────────────────────────────

export enum BottleStatusEnum {
  SEALED = 'SEALED',
  OPEN = 'OPEN',
  EMPTY = 'EMPTY',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

export class RegisterBottleDto {
  @IsUUID() itemId: string;
  @IsUUID() storeId: string;
  @IsOptional() @IsString() batchId?: string;
  @IsNumber() @Min(0.01) volumeMl: number;
}

export class OpenBottleDto {
  @IsUUID() bottleId: string;
}

export class UpdateBottleStatusDto {
  @IsEnum(BottleStatusEnum) status: BottleStatusEnum;
}

export class BottleQueryDto {
  @IsOptional() @IsUUID() storeId?: string;
  @IsOptional() @IsUUID() itemId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() cursor?: string;
}

// ─── Pours ────────────────────────────────────────────────────────────────────

export enum PourTypeEnum {
  SALE = 'SALE',
  WASTE = 'WASTE',
  SPILLAGE = 'SPILLAGE',
  COMPLIMENTARY = 'COMPLIMENTARY',
  SAMPLE = 'SAMPLE',
}

export class RecordPourDto {
  @IsUUID() bottleId: string;
  @IsEnum(PourTypeEnum) type: PourTypeEnum;
  @IsNumber() @Min(0.01) volumeMl: number;
  @IsOptional() @IsUUID() orderItemId?: string;
  @IsOptional() @IsString() reason?: string;
}

export class PourQueryDto {
  @IsOptional() @IsUUID() bottleId?: string;
  @IsOptional() @IsString() cursor?: string;
}

// ─── Variance ─────────────────────────────────────────────────────────────────

export class BarVarianceQueryDto {
  @IsOptional() @IsUUID() storeId?: string;
  @IsOptional() @IsString() fromDate?: string;
  @IsOptional() @IsString() toDate?: string;
}

// ─── Excise ───────────────────────────────────────────────────────────────────

export class ExciseQueryDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsString() period?: string;
}

export class CreateExciseEntryDto {
  @IsUUID() companyId: string;
  @IsString() @IsNotEmpty() period: string;
  @IsUUID() itemId: string;
  @IsString() @IsNotEmpty() licenseNumber: string;
  @IsNumber() @Min(0) openingQty: number;
  @IsNumber() @Min(0) purchasedQty: number;
  @IsNumber() @Min(0) soldQty: number;
  @IsNumber() @Min(0) closingQty: number;
  @IsOptional() @IsNumber() @Min(0) dutyPaid?: number;
}
