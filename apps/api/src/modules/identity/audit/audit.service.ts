import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { TenantContext } from '../../../common/tenant-context';

export interface AuditEntry {
  action: string; // permission-style verb, e.g. "organization.company:create"
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Append-only audit trail. Actor/tenant/ip come from the request context.
 * Failures are logged, never propagated — auditing must not break the
 * business operation (the DB-level trail via RLS-safe triggers is the
 * long-term backstop).
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    const ctx = TenantContext.get();
    if (!ctx?.tenantId) return;
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          actorId: ctx.userId,
          actorType: ctx.userId ? 'USER' : 'SYSTEM',
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          before: entry.before === undefined ? undefined : (entry.before as object),
          after: entry.after === undefined ? undefined : (entry.after as object),
          ip: ctx.ip,
          terminalId: ctx.terminalId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log for ${entry.action}: ${String(error)}`);
    }
  }
}
