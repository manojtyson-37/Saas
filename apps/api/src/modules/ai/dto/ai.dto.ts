import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Natural-language query ───────────────────────────────────────────────────

export class NlQueryDto {
  @IsString() @IsNotEmpty() question: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsString() fromDate?: string;
  @IsOptional() @IsString() toDate?: string;
}

// ─── Revenue forecast ────────────────────────────────────────────────────────

export enum ForecastGranularity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class RevenueForecastDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() outletId?: string;
  @IsOptional() @IsEnum(ForecastGranularity) granularity?: ForecastGranularity;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) periods?: number;
}

// ─── Anomaly detection ───────────────────────────────────────────────────────

export class AnomalyDetectionDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsISO8601() fromDate?: string;
  @IsOptional() @IsISO8601() toDate?: string;
}
