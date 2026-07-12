import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

function currentFiscalYear(date = new Date()): string {
  // India FY: Apr 1 – Mar 31. Generalise if needed.
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return m >= 4
    ? `${y}-${(y + 1).toString().slice(2)}`
    : `${y - 1}-${y.toString().slice(2)}`;
}

/** Tenant-level sentinel used as companyId for documents that aren't
 *  company-scoped (transfers, adjustments, counts, purchase requests). */
export const TENANT_SCOPE = '__tenant__';

/**
 * Atomic document number allocator backed by `document_sequence`.
 * Uses an UPSERT + increment in a single statement — safe under concurrent
 * requests without advisory locks.
 */
@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Allocate the next number for a document type.
   * @param tenantId   tenant
   * @param companyId  company UUID, or TENANT_SCOPE for tenant-wide docs
   * @param docType    e.g. "GRN", "PO", "TRANSFER"
   * @param prefix     short prefix included in the formatted number
   * @param padding    zero-pad width (default 6)
   */
  async next(
    tenantId: string,
    companyId: string,
    docType: string,
    prefix: string,
    padding = 6,
  ): Promise<string> {
    const fy = currentFiscalYear();
    // Atomic upsert: on first row insert nextNumber=2 so that RETURNING gives
    // nextNumber-1 = 1. On UPDATE, increment by 1 and return the old value.
    const rows = await this.prisma.$queryRaw<
      Array<{ seq: bigint }>
    >`
      INSERT INTO document_sequence
        (id, "tenantId", "companyId", "docType", "fiscalYear", prefix, "nextNumber", padding)
      VALUES
        (gen_random_uuid()::text, ${tenantId}, ${companyId}, ${docType}, ${fy}, ${prefix}, 2, ${padding})
      ON CONFLICT ("tenantId", "companyId", "docType", "fiscalYear")
      DO UPDATE
        SET "nextNumber" = document_sequence."nextNumber" + 1
      RETURNING document_sequence."nextNumber" - 1 AS seq
    `;
    const seq = Number(rows[0]!.seq);
    const padded = String(seq).padStart(padding, '0');
    return `${prefix}${fy.replace('-', '')}-${padded}`;
  }
}
