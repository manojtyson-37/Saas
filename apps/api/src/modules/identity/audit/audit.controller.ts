import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { PrismaService } from '../../../common/prisma.service';
import { TenantContext } from '../../../common/tenant-context';
import { PaginationQuery, toPage } from '../../../common/pagination';

class AuditQuery extends PaginationQuery {
  @ApiPropertyOptional({ description: 'Filter by action, e.g. pos.order:void' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00Z' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  to?: string;
}

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('identity.audit:read')
  @ApiOperation({ summary: 'Filterable, append-only audit trail' })
  async list(@Query() query: AuditQuery) {
    const tenantId = TenantContext.requireTenantId();
    const limit = query.limit ?? 50;
    const rows = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        action: query.action,
        entityType: query.entityType,
        entityId: query.entityId,
        actorId: query.actorId,
        ...(query.from || query.to
          ? {
              createdAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
        ...(query.cursor ? { id: { lt: query.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });
    return toPage(rows, limit);
  }
}
