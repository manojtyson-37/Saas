import {
  IsArray,
  IsBoolean,
  IsDateString,
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

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

// ─── Employees ────────────────────────────────────────────────────────────────

export class CreateEmployeeDto {
  @IsUUID() companyId: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsUUID() userId?: string;
  @IsString() @IsNotEmpty() employeeCode: string;
  @IsString() @IsNotEmpty() firstName: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @IsISO8601() joinedAt: string;
  @IsOptional() @IsNumber() @Min(0) monthlySalary?: number;
  @IsOptional() @IsNumber() @Min(0) hourlyRate?: number;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() bankIfsc?: string;
  @IsOptional() @IsString() pfNumber?: string;
  @IsOptional() @IsString() esiNumber?: string;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @IsOptional() @IsNumber() @Min(0) monthlySalary?: number;
  @IsOptional() @IsNumber() @Min(0) hourlyRate?: number;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() bankIfsc?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsISO8601() exitedAt?: string;
}

export class EmployeeQueryDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}

// ─── Shifts ───────────────────────────────────────────────────────────────────

export class CreateShiftDto {
  @IsUUID() locationId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() startTime: string;
  @IsString() @IsNotEmpty() endTime: string;
}

// ─── Roster ───────────────────────────────────────────────────────────────────

export class RosterEntryInputDto {
  @IsUUID() employeeId: string;
  @IsUUID() shiftId: string;
  @IsISO8601() date: string;
}

export class BulkRosterDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RosterEntryInputDto)
  entries: RosterEntryInputDto[];
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export class ClockInDto {
  @IsUUID() employeeId: string;
  @IsISO8601() date: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsISO8601() clockIn?: string;
}

export class ClockOutDto {
  @IsOptional() @IsISO8601() clockOut?: string;
  @IsOptional() @IsString() note?: string;
}

export class AttendanceQueryDto {
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsISO8601() fromDate?: string;
  @IsOptional() @IsISO8601() toDate?: string;
}

// ─── Leave Types ──────────────────────────────────────────────────────────────

export class CreateLeaveTypeDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
  @IsNumber() @Min(0) annualQuota: number;
  @IsOptional() @IsBoolean() isPaid?: boolean;
}

// ─── Leave Requests ───────────────────────────────────────────────────────────

export class CreateLeaveRequestDto {
  @IsUUID() employeeId: string;
  @IsUUID() leaveTypeId: string;
  @IsISO8601() startDate: string;
  @IsISO8601() endDate: string;
  @IsNumber() @Min(0.5) days: number;
  @IsOptional() @IsString() reason?: string;
}

export class ReviewLeaveDto {
  @IsString() action: 'approve' | 'reject';
  @IsOptional() @IsString() note?: string;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export class CreatePayrollRunDto {
  @IsUUID() companyId: string;
  @IsString() @IsNotEmpty() period: string; // "2026-07"
}

export class PayrollQueryDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsString() period?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}
