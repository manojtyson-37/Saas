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

// ── vendors ───────────────────────────────────────────────────────────────────

export class CreateVendorDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @Matches(CODE_RE, { message: CODE_MSG })
  code!: string;

  @ApiPropertyOptional({ description: 'GST / VAT number' })
  @IsOptional() @IsString() @MaxLength(30)
  taxRegistrationNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  panNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressLine1?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12)
  postalCode?: string;

  @ApiPropertyOptional({ default: 0, description: 'Net payment terms in days' })
  @IsOptional() @IsInt() @Min(0) @Max(365)
  paymentTermsDays?: number;

  @ApiPropertyOptional({ description: 'TDS rate (%)' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(100)
  tdsRate?: number;
}

export class UpdateVendorDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  taxRegistrationNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  panNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressLine1?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80)
  state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12)
  postalCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(365)
  paymentTermsDays?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(100)
  tdsRate?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ── vendor items ──────────────────────────────────────────────────────────────

export class UpsertVendorItemDto {
  @ApiProperty({ description: 'InventoryItem UUID' }) @IsUUID()
  itemId!: string;

  @ApiPropertyOptional({ description: "Vendor's own SKU / article number" })
  @IsOptional() @IsString() @MaxLength(60)
  vendorSku?: string;

  @ApiPropertyOptional({ description: 'Last purchase price' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  lastPrice?: number;

  @ApiPropertyOptional({ default: 0, description: 'Lead time in days' })
  @IsOptional() @IsInt() @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean()
  isPreferred?: boolean;
}

// ── purchase requests ─────────────────────────────────────────────────────────

export class PrLineDto {
  @ApiProperty({ description: 'InventoryItem UUID' }) @IsUUID()
  itemId!: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)
  qty!: number;

  @ApiProperty({ description: 'UoM UUID' }) @IsUUID()
  uomId!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  note?: string;
}

export class CreatePurchaseRequestDto {
  @ApiProperty({ description: 'Location UUID' }) @IsUUID()
  locationId!: string;

  @ApiProperty({ description: 'Store UUID (destination)' }) @IsUUID()
  storeId!: string;

  @ApiPropertyOptional({ description: 'Required-by date' }) @IsOptional()
  neededBy?: Date;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ApiProperty({ type: [PrLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PrLineDto)
  lines!: PrLineDto[];
}

export class ReviewPrDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

// ── purchase orders ───────────────────────────────────────────────────────────

export class PoLineDto {
  @ApiProperty({ description: 'InventoryItem UUID' }) @IsUUID()
  itemId!: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)
  qty!: number;

  @ApiProperty({ description: 'UoM UUID' }) @IsUUID()
  uomId!: string;

  @ApiProperty({ description: 'Unit price before tax' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ description: 'TaxGroup UUID' }) @IsOptional() @IsUUID()
  taxGroupId?: string;

  @ApiPropertyOptional({ default: 0, description: 'Tax rate (%)' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(100)
  taxRate?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Company UUID' }) @IsUUID()
  companyId!: string;

  @ApiProperty({ description: 'Vendor UUID' }) @IsUUID()
  vendorId!: string;

  @ApiProperty({ description: 'Destination store UUID' }) @IsUUID()
  storeId!: string;

  @ApiPropertyOptional({ description: 'Source PR UUID (for PR→PO conversion)' })
  @IsOptional() @IsUUID()
  purchaseRequestId?: string;

  @ApiPropertyOptional({ default: 'INR' }) @IsOptional() @IsString() @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date' }) @IsOptional()
  expectedAt?: Date;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ApiProperty({ type: [PoLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PoLineDto)
  lines!: PoLineDto[];
}

export class ReviewPoDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

// ── goods receipts ────────────────────────────────────────────────────────────

export class GrnLineDto {
  @ApiPropertyOptional({ description: 'PO line UUID (if GRN is against a PO)' })
  @IsOptional() @IsUUID()
  poLineId?: string;

  @ApiProperty({ description: 'InventoryItem UUID' }) @IsUUID()
  itemId!: string;

  @ApiProperty({ description: 'Quantity received' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)
  qtyReceived!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  qtyRejected?: number;

  @ApiProperty({ description: 'UoM UUID' }) @IsUUID()
  uomId!: string;

  @ApiProperty({ description: 'Unit price (from PO or spot)' })
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ description: 'Batch/lot number' })
  @IsOptional() @IsString() @MaxLength(60)
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiry date for perishables' })
  @IsOptional()
  expiryDate?: Date;
}

export class CreateGrnDto {
  @ApiProperty({ description: 'Company UUID' }) @IsUUID()
  companyId!: string;

  @ApiPropertyOptional({ description: 'Purchase Order UUID (optional — direct GRN allowed)' })
  @IsOptional() @IsUUID()
  poId?: string;

  @ApiProperty({ description: 'Vendor UUID' }) @IsUUID()
  vendorId!: string;

  @ApiProperty({ description: 'Destination store UUID' }) @IsUUID()
  storeId!: string;

  @ApiPropertyOptional({ description: "Vendor's delivery challan number" })
  @IsOptional() @IsString() @MaxLength(60)
  vendorChallanNumber?: string;

  @ApiPropertyOptional({ description: 'Business date (defaults to today)' })
  @IsOptional()
  businessDate?: Date;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ApiProperty({ type: [GrnLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => GrnLineDto)
  lines!: GrnLineDto[];
}

// ── purchase invoices ─────────────────────────────────────────────────────────

export class InvoiceLineDto {
  @ApiPropertyOptional({ description: 'PO line UUID' }) @IsOptional() @IsUUID()
  poLineId?: string;

  @ApiPropertyOptional({ description: 'GRN line UUID' }) @IsOptional() @IsUUID()
  grnLineId?: string;

  @ApiProperty({ description: 'InventoryItem UUID' }) @IsUUID()
  itemId!: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)
  qty!: number;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  taxGroupId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(100)
  taxRate?: number;
}

export class CreatePurchaseInvoiceDto {
  @ApiProperty({ description: 'Company UUID' }) @IsUUID()
  companyId!: string;

  @ApiProperty({ description: "Vendor's invoice number" })
  @IsString() @IsNotEmpty() @MaxLength(60)
  vendorInvoiceNumber!: string;

  @ApiProperty({ description: 'Vendor UUID' }) @IsUUID()
  vendorId!: string;

  @ApiPropertyOptional({ description: 'Purchase Order UUID' }) @IsOptional() @IsUUID()
  poId?: string;

  @ApiProperty({ description: 'Invoice date (ISO 8601 date)' })
  invoiceDate!: Date;

  @ApiPropertyOptional({ description: 'Due date' }) @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ default: 'INR' }) @IsOptional() @IsString() @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ApiProperty({ type: [InvoiceLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceLineDto)
  lines!: InvoiceLineDto[];
}

// ── vendor notes ──────────────────────────────────────────────────────────────

export class CreateVendorNoteDto {
  @ApiProperty({ description: 'Company UUID' }) @IsUUID()
  companyId!: string;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'] }) @IsEnum(['DEBIT', 'CREDIT'])
  type!: 'DEBIT' | 'CREDIT';

  @ApiProperty({ description: 'Vendor UUID' }) @IsUUID()
  vendorId!: string;

  @ApiPropertyOptional({ description: 'Related purchase invoice UUID' })
  @IsOptional() @IsUUID()
  invoiceId?: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.01)
  amount!: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  reason?: string;

  @ApiProperty({ description: 'Business date (ISO 8601 date)' })
  businessDate!: Date;
}

// ── vendor payments ───────────────────────────────────────────────────────────

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  UPI = 'UPI',
  CARD = 'CARD',
  WALLET = 'WALLET',
}

export class PaymentAllocationDto {
  @ApiProperty({ description: 'PurchaseInvoice UUID' }) @IsUUID()
  invoiceId!: string;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.01)
  amount!: number;
}

export class CreateVendorPaymentDto {
  @ApiProperty({ description: 'Company UUID' }) @IsUUID()
  companyId!: string;

  @ApiProperty({ description: 'Vendor UUID' }) @IsUUID()
  vendorId!: string;

  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  tdsAmount?: number;

  @ApiPropertyOptional({ description: 'UTR / cheque / reference number' })
  @IsOptional() @IsString() @MaxLength(60)
  reference?: string;

  @ApiProperty({ description: 'Business date (ISO 8601 date)' })
  businessDate!: Date;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ type: [PaymentAllocationDto], description: 'Invoice allocations' })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PaymentAllocationDto)
  allocations?: PaymentAllocationDto[];
}

// ── list queries ──────────────────────────────────────────────────────────────

export class ProcurementListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional() @IsInt() @Min(1) @Max(200) @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  companyId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  status?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  q?: string;
}

export class VendorLedgerQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @IsInt() @Min(1) @Max(200) @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'From date (ISO 8601)' }) @IsOptional()
  from?: Date;

  @ApiPropertyOptional({ description: 'To date (ISO 8601)' }) @IsOptional()
  to?: Date;
}
