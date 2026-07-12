import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// ── Chart of Accounts ─────────────────────────────────────────────────────────

export class CreateAccountDto {
  @IsString() companyId: string;
  @IsString() code: string;
  @IsString() name: string;
  @IsEnum(AccountType) type: AccountType;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsString() systemSlot?: string;
  @IsOptional() @IsBoolean() isGroup?: boolean;
}

export class UpdateAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() systemSlot?: string;
}

export class AccountQueryDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsEnum(AccountType) type?: AccountType;
}

// ── Journals ──────────────────────────────────────────────────────────────────

export class JournalLineInputDto {
  @IsUUID() accountId: string;
  @IsOptional() @IsNumber() @Min(0) debit?: number;
  @IsOptional() @IsNumber() @Min(0) credit?: number;
  @IsOptional() @IsString() locationId?: string;
  @IsOptional() @IsString() outletId?: string;
  @IsOptional() @IsString() costCenter?: string;
  @IsOptional() @IsString() memo?: string;
}

export class CreateJournalDto {
  @IsString() companyId: string;
  @IsDateString() businessDate: string;
  @IsOptional() @IsString() memo?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() sourceId?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineInputDto)
  lines: JournalLineInputDto[];
}

export class JournalQueryDto {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number) limit?: number;
}

// ── Fiscal Years & Periods ────────────────────────────────────────────────────

export class CreateFiscalYearDto {
  @IsString() companyId: string;
  @IsString() label: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
}

// ── Bank Accounts ─────────────────────────────────────────────────────────────

export class CreateBankAccountDto {
  @IsString() companyId: string;
  @IsString() name: string;
  @IsString() bankName: string;
  @IsString() accountNumber: string;
  @IsOptional() @IsString() ifsc?: string;
  @IsOptional() @IsUUID() accountId?: string;
  @IsOptional() @IsString() currency?: string;
}

export class BankTransactionInputDto {
  @IsDateString() date: string;
  @IsString() description: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() reference?: string;
}

export class ImportBankTransactionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BankTransactionInputDto)
  transactions: BankTransactionInputDto[];
}

export class MatchTransactionDto {
  @IsUUID() journalLineId: string;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export class ReportQueryDto {
  @IsString() companyId: string;
  @IsDateString() fromDate: string;
  @IsDateString() toDate: string;
}

export class BalanceSheetQueryDto {
  @IsString() companyId: string;
  @IsDateString() asOfDate: string;
}

export class GstSummaryQueryDto {
  @IsString() companyId: string;
  @IsInt() @Min(1) @Max(12) @Type(() => Number) month: number;
  @IsInt() @Min(2000) @Type(() => Number) year: number;
}

// ── Tax Groups ────────────────────────────────────────────────────────────────

export class TaxComponentInputDto {
  @IsString() name: string;
  @IsNumber() @Min(0) @Max(100) rate: number;
  @IsOptional() @IsString() accountSlot?: string;
}

export class CreateTaxGroupDto {
  @IsString() code: string;
  @IsString() name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TaxComponentInputDto)
  components: TaxComponentInputDto[];
}
