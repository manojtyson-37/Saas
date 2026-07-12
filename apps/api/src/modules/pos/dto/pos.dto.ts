import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CashMovementType,
  DiscountType,
  KotStatus,
  OrderChannel,
  TenderType,
} from '@aureus/database';

// ── Cash Sessions ───────────────────────────────────────────────────────────

export class OpenSessionDto {
  @IsUUID() terminalId: string;
  @IsUUID() outletId: string;
  @IsNumber() @Min(0) openingFloat: number;
  @IsDateString() businessDate: string;
}

export class CloseSessionDto {
  @IsNumber() @Min(0) countedCash: number;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class AddCashMovementDto {
  @IsEnum(CashMovementType) type: CashMovementType;
  @IsNumber() @IsPositive() amount: number;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

// ── Orders ──────────────────────────────────────────────────────────────────

export class CreateOrderDto {
  @IsUUID() outletId: string;
  @IsUUID() companyId: string;
  @IsEnum(OrderChannel) channel: OrderChannel;
  @IsOptional() @IsUUID() tableId?: string;
  @IsOptional() @IsInt() @Min(1) guestCount?: number;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() waiterId?: string;
  @IsDateString() businessDate: string;
  @IsOptional() @IsString() @MaxLength(100) clientOpId?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class AddOrderItemModifierDto {
  @IsUUID() modifierId: string;
  @IsString() @IsNotEmpty() @MaxLength(120) nameSnapshot: string;
  @IsNumber() @Min(0) price: number;
}

export class AddOrderItemDto {
  @IsUUID() menuItemId: string;
  @IsUUID() variantId: string;
  @IsString() @IsNotEmpty() @MaxLength(120) nameSnapshot: string;
  @IsNumber() @IsPositive() qty: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsUUID() taxGroupId?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxRate?: number;
  @IsOptional() @IsInt() @Min(1) seatNumber?: number;
  @IsOptional() @IsInt() @Min(1) courseNumber?: number;
  @IsOptional() @IsUUID() kitchenStationId?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddOrderItemModifierDto)
  modifiers?: AddOrderItemModifierDto[];
}

export class UpdateOrderItemDto {
  @IsOptional() @IsNumber() @IsPositive() qty?: number;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class OrderDiscountDto {
  @IsEnum(DiscountType) type: DiscountType;
  @IsNumber() @IsPositive() value: number;
  @IsOptional() @IsString() @MaxLength(200) reason?: string;
  @IsOptional() @IsString() couponId?: string;
  @IsOptional() @IsString() approvedBy?: string;
}

export class BillOrderDto {
  @IsOptional() @IsNumber() @Min(0) @Max(0.5) serviceChargeRate?: number;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderDiscountDto)
  discounts?: OrderDiscountDto[];
}

export class AddPaymentDto {
  @IsEnum(TenderType) tender: TenderType;
  @IsNumber() @IsPositive() amount: number;
  @IsOptional() @IsNumber() @Min(0) tipAmount?: number;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
  @IsOptional() @IsUUID() cashSessionId?: string;
}

export class VoidOrderDto {
  @IsString() @IsNotEmpty() @MaxLength(500) voidReason: string;
}

export class VoidOrderItemDto {
  @IsString() @IsNotEmpty() @MaxLength(500) voidReason: string;
  @IsOptional() @IsString() voidedBy?: string;
}

export class SplitItemsDto {
  @IsArray() @ArrayMinSize(1) @IsUUID(undefined, { each: true }) itemIds: string[];
}

export class SplitOrderDto {
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => SplitItemsDto)
  splits: SplitItemsDto[];
}

export class MergeOrdersDto {
  @IsArray() @ArrayMinSize(2) @IsUUID(undefined, { each: true }) orderIds: string[];
}

// ── KDS ─────────────────────────────────────────────────────────────────────

export class UpdateKotStatusDto {
  @IsEnum(KotStatus) status: KotStatus;
}

export class KotQueryDto {
  @IsUUID() kitchenStationId: string;
  @IsOptional() @IsEnum(KotStatus) status?: KotStatus;
  @IsOptional() @IsDateString() businessDate?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}

// ── List queries ─────────────────────────────────────────────────────────────

export class PosOrderQueryDto {
  @IsOptional() @IsUUID() outletId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() businessDate?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}
