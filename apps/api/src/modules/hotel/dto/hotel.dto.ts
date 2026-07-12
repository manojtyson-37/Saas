import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MealPlan {
  EP = 'EP',
  CP = 'CP',
  MAP = 'MAP',
  AP = 'AP',
}

// ─── Room Types ──────────────────────────────────────────────────────────────

export class CreateRoomTypeDto {
  @IsUUID() locationId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
  @IsOptional() @IsInt() @Min(1) baseOccupancy?: number;
  @IsOptional() @IsInt() @Min(1) maxOccupancy?: number;
  @IsNumber() @Min(0) baseRate: number;
  @IsOptional() @IsNumber() @Min(0) extraBedRate?: number;
  @IsOptional() @IsString({ each: true }) amenities?: string[];
}

export class UpdateRoomTypeDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsNumber() @Min(0) baseRate?: number;
  @IsOptional() @IsNumber() @Min(0) extraBedRate?: number;
  @IsOptional() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

// ─── Rooms ───────────────────────────────────────────────────────────────────

export class CreateRoomDto {
  @IsUUID() locationId: string;
  @IsUUID() roomTypeId: string;
  @IsString() @IsNotEmpty() number: string;
  @IsOptional() @IsString() floor?: string;
}

export class UpdateRoomDto {
  @IsOptional() @IsString() floor?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateRoomStatusDto {
  @IsString() @IsNotEmpty() status: string;
}

export class RoomQueryDto {
  @IsUUID() locationId: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsUUID() roomTypeId?: string;
}

// ─── Rate Plans ───────────────────────────────────────────────────────────────

export class CreateRatePlanDto {
  @IsUUID() roomTypeId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
  @IsNumber() @Min(0) rate: number;
  @IsOptional() @IsEnum(MealPlan) mealPlan?: MealPlan;
  @IsOptional() @IsUUID() taxGroupId?: string;
  @IsOptional() @IsString() cancellationPolicy?: string;
}

export class UpdateRatePlanDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsNumber() @Min(0) rate?: number;
  @IsOptional() @IsEnum(MealPlan) mealPlan?: MealPlan;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateRateOverrideDto {
  @IsUUID() ratePlanId: string;
  @IsISO8601() date: string;
  @IsNumber() @Min(0) rate: number;
  @IsOptional() @IsInt() @Min(1) minStay?: number;
  @IsOptional() @IsBoolean() closed?: boolean;
}

// ─── Guest Profiles ───────────────────────────────────────────────────────────

export class CreateGuestProfileDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() idType?: string;
  @IsOptional() @IsString() idNumber?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsBoolean() vip?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateGuestProfileDto {
  @IsOptional() @IsString() @IsNotEmpty() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() idType?: string;
  @IsOptional() @IsString() idNumber?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsBoolean() vip?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class GuestQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export class ReservationRoomInputDto {
  @IsUUID() roomTypeId: string;
  @IsUUID() ratePlanId: string;
  @IsNumber() @Min(0) nightlyRate: number;
}

export class CreateReservationDto {
  @IsUUID() locationId: string;
  @IsUUID() guestId: string;
  @IsISO8601() checkInDate: string;
  @IsISO8601() checkOutDate: string;
  @IsOptional() @IsInt() @Min(1) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsNumber() @Min(0) depositAmount?: number;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() note?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReservationRoomInputDto)
  rooms: ReservationRoomInputDto[];
}

export class UpdateReservationDto {
  @IsOptional() @IsInt() @Min(1) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsNumber() @Min(0) depositAmount?: number;
}

export class ReservationQueryDto {
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsISO8601() checkInDate?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}

// ─── Check-in / Check-out ─────────────────────────────────────────────────────

export class RoomAssignmentDto {
  @IsUUID() reservationRoomId: string;
  @IsUUID() roomId: string;
}

export class CheckInDto {
  @IsUUID() reservationId: string;
  @IsUUID() companyId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomAssignmentDto)
  roomAssignments: RoomAssignmentDto[];
}

export class CheckOutDto {
  @IsUUID() companyId: string;
}

// ─── Folio ────────────────────────────────────────────────────────────────────

export class PostFolioChargeDto {
  @IsString() @IsNotEmpty() type: string;
  @IsString() @IsNotEmpty() description: string;
  @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsNumber() @Min(0) taxAmount?: number;
  @IsISO8601() businessDate: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() sourceId?: string;
}

export class FolioPaymentInputDto {
  @IsString() @IsNotEmpty() method: string;
  @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsString() reference?: string;
}

export class SettleFolioDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FolioPaymentInputDto)
  payments: FolioPaymentInputDto[];
}

// ─── Night Audit ──────────────────────────────────────────────────────────────

export class NightAuditDto {
  @IsUUID() locationId: string;
  @IsUUID() companyId: string;
  @IsISO8601() businessDate: string;
}

// ─── Housekeeping ─────────────────────────────────────────────────────────────

export class CreateHousekeepingTaskDto {
  @IsUUID() locationId: string;
  @IsUUID() roomId: string;
  @IsString() @IsNotEmpty() type: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsInt() @Min(0) priority?: number;
  @IsOptional() @IsString() note?: string;
}

export class UpdateHousekeepingTaskDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsISO8601() startedAt?: string;
  @IsOptional() @IsISO8601() completedAt?: string;
}

export class HousekeepingQueryDto {
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() assignedTo?: string;
}
