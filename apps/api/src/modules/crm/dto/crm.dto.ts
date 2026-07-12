import {
  IsArray,
  IsBoolean,
  IsDateString,
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

// ─── Customers ────────────────────────────────────────────────────────────────

export class CreateCustomerDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsISO8601() birthday?: string;
  @IsOptional() @IsISO8601() anniversary?: string;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() marketingOptIn?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsISO8601() birthday?: string;
  @IsOptional() @IsISO8601() anniversary?: string;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() marketingOptIn?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class CustomerQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export class WalletOperationDto {
  @IsUUID() customerId: string;
  @IsString() type: 'LOAD' | 'REDEEM' | 'REFUND' | 'ADJUSTMENT';
  @IsNumber() amount: number;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() sourceId?: string;
  @IsOptional() @IsString() note?: string;
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export class UpsertLoyaltyProgramDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) earnRate: number;
  @IsNumber() @Min(0) redeemValue: number;
  @IsOptional() @IsInt() @Min(1) pointExpiryDays?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class LoyaltyOperationDto {
  @IsUUID() customerId: string;
  @IsString() type: 'EARN' | 'REDEEM' | 'ADJUSTMENT';
  @IsNumber() points: number;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() sourceId?: string;
}

// ─── Gift Cards ───────────────────────────────────────────────────────────────

export class IssueGiftCardDto {
  @IsString() @IsNotEmpty() code: string;
  @IsNumber() @Min(1) initialValue: number;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsISO8601() expiresAt?: string;
}

export class RedeemGiftCardDto {
  @IsString() @IsNotEmpty() code: string;
  @IsNumber() @Min(0.01) amount: number;
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  AMOUNT = 'AMOUNT',
  BOGO = 'BOGO',
}

export class CreateCouponDto {
  @IsString() @IsNotEmpty() code: string;
  @IsEnum(CouponType) type: CouponType;
  @IsNumber() @Min(0) value: number;
  @IsOptional() @IsNumber() @Min(0) minOrderAmount?: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscountAmount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perCustomerLimit?: number;
  @IsOptional() @IsISO8601() validFrom?: string;
  @IsOptional() @IsISO8601() validTo?: string;
  @IsOptional() @IsArray() channels?: string[];
}

export class ValidateCouponDto {
  @IsString() @IsNotEmpty() code: string;
  @IsNumber() @Min(0) orderAmount: number;
  @IsOptional() @IsUUID() customerId?: string;
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export class CreateCampaignDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  @IsString() @IsNotEmpty() template: string;
  @IsOptional() segment?: Record<string, unknown>;
  @IsOptional() @IsISO8601() scheduledAt?: string;
  @IsOptional() @IsString() trigger?: string;
  @IsOptional() @IsBoolean() isRecurring?: boolean;
}
