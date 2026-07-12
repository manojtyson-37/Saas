import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../../common/prisma.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type { AnomalyDetectionDto, NlQueryDto, RevenueForecastDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private ctx(): { tenantId: string; userId: string | undefined } {
    const c = TenantContext.get();
    if (!c?.tenantId) throw new BadRequestException('No tenant context');
    return { tenantId: c.tenantId, userId: c.userId };
  }

  // ─── Natural-language analytics query ────────────────────────────────────────

  async naturalLanguageQuery(dto: NlQueryDto) {
    const { tenantId, userId } = this.ctx();

    const fromDate = dto.fromDate ? new Date(dto.fromDate) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    })();
    const toDate = dto.toDate ? new Date(dto.toDate) : new Date();

    // Resolve intent from question keywords (pattern-based NL → SQL mapping)
    const q = dto.question.toLowerCase();

    let result: Record<string, unknown>;

    if (q.includes('revenue') || q.includes('sales') || q.includes('income')) {
      result = await this.getRevenueSummary(tenantId, dto.companyId, fromDate, toDate);
    } else if (q.includes('order') && (q.includes('count') || q.includes('how many'))) {
      result = await this.getOrderCount(tenantId, dto.companyId, fromDate, toDate);
    } else if (q.includes('top') && (q.includes('item') || q.includes('product') || q.includes('dish'))) {
      result = await this.getTopItems(tenantId, dto.companyId, fromDate, toDate);
    } else if (q.includes('customer') && (q.includes('new') || q.includes('registered'))) {
      result = await this.getNewCustomers(tenantId, fromDate, toDate);
    } else if (q.includes('inventory') || q.includes('stock') || q.includes('low')) {
      result = await this.getLowStockItems(tenantId);
    } else if (q.includes('payroll') || q.includes('salary') || q.includes('wage')) {
      result = await this.getPayrollSummary(tenantId, dto.companyId, fromDate, toDate);
    } else {
      result = await this.getRevenueSummary(tenantId, dto.companyId, fromDate, toDate);
    }

    await this.audit.log({
      action: 'ai.query:run',
      entityType: 'ai_query',
      after: { question: dto.question, resolvedTo: Object.keys(result)[0], runBy: userId },
    });

    return { question: dto.question, fromDate, toDate, data: result };
  }

  private async getRevenueSummary(
    tenantId: string,
    companyId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const orders = await this.prisma.posOrder.findMany({
      where: {
        tenantId,
        ...(companyId ? { companyId } : {}),
        status: 'SETTLED',
        createdAt: { gte: from, lte: to },
      },
      select: { totalAmount: true, createdAt: true },
    });

    const total = orders.reduce((sum: Decimal, o: { totalAmount: Decimal }) => sum.plus(new Decimal(o.totalAmount)), new Decimal(0));
    return {
      revenue: {
        total: total.toFixed(2),
        orderCount: orders.length,
        average: orders.length > 0 ? total.dividedBy(orders.length).toFixed(2) : '0.00',
      },
    };
  }

  private async getOrderCount(
    tenantId: string,
    companyId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const count = await this.prisma.posOrder.count({
      where: {
        tenantId,
        ...(companyId ? { companyId } : {}),
        status: 'SETTLED',
        createdAt: { gte: from, lte: to },
      },
    });
    return { orderCount: { count } };
  }

  private async getTopItems(
    tenantId: string,
    companyId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const lines = await this.prisma.posOrderItem.findMany({
      where: {
        tenantId,
        order: {
          status: 'SETTLED',
          createdAt: { gte: from, lte: to },
          ...(companyId ? { companyId } : {}),
        },
        status: { not: 'VOIDED' },
      },
      select: { menuItemId: true, nameSnapshot: true, qty: true, totalAmount: true },
    });

    const byItem = new Map<string, { name: string; qty: Decimal; revenue: Decimal }>();
    for (const line of lines) {
      const key = line.menuItemId;
      if (!byItem.has(key)) byItem.set(key, { name: line.nameSnapshot, qty: new Decimal(0), revenue: new Decimal(0) });
      const entry = byItem.get(key)!;
      entry.qty = entry.qty.plus(new Decimal(line.qty));
      entry.revenue = entry.revenue.plus(new Decimal(line.totalAmount));
    }

    const sorted = [...byItem.entries()]
      .sort((a, b) => b[1].revenue.comparedTo(a[1].revenue))
      .slice(0, 10)
      .map(([itemId, v]) => ({ itemId, name: v.name, qtySold: v.qty.toFixed(2), revenue: v.revenue.toFixed(2) }));

    return { topItems: sorted };
  }

  private async getNewCustomers(tenantId: string, from: Date, to: Date) {
    const count = await this.prisma.customer.count({
      where: { tenantId, createdAt: { gte: from, lte: to }, deletedAt: null },
    });
    return { newCustomers: { count } };
  }

  private async getLowStockItems(tenantId: string) {
    const summaries = await this.prisma.stockSummary.findMany({
      where: { tenantId, onHand: { lt: 10 } },
      select: { itemId: true, storeId: true, onHand: true },
      orderBy: { onHand: 'asc' },
      take: 50,
    });

    return {
      lowStock: summaries.map((s) => ({
        itemId: s.itemId,
        storeId: s.storeId,
        currentQty: new Decimal(s.onHand).toFixed(2),
      })),
    };
  }

  private async getPayrollSummary(
    tenantId: string,
    companyId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const runs = await this.prisma.payrollRun.findMany({
      where: {
        tenantId,
        ...(companyId ? { companyId } : {}),
        status: 'POSTED',
        createdAt: { gte: from, lte: to },
      },
      select: { totalGross: true, totalNet: true, period: true },
    });

    const gross = runs.reduce((s: Decimal, r: { totalGross: Decimal }) => s.plus(new Decimal(r.totalGross)), new Decimal(0));
    const net = runs.reduce((s: Decimal, r: { totalNet: Decimal }) => s.plus(new Decimal(r.totalNet)), new Decimal(0));

    return {
      payroll: {
        runCount: runs.length,
        totalGross: gross.toFixed(2),
        totalNet: net.toFixed(2),
      },
    };
  }

  // ─── Revenue forecast (simple moving average + trend) ────────────────────────

  async revenueForecast(dto: RevenueForecastDto) {
    const { tenantId, userId } = this.ctx();
    const granularity = dto.granularity ?? 'DAILY';
    const periods = dto.periods ?? 7;

    // Fetch last 90 days of closed orders for the baseline
    const from = new Date();
    from.setDate(from.getDate() - 90);

    const orders = await this.prisma.posOrder.findMany({
      where: {
        tenantId,
        ...(dto.companyId ? { companyId: dto.companyId } : {}),
        ...(dto.outletId ? { outletId: dto.outletId } : {}),
        status: 'SETTLED',
        createdAt: { gte: from },
      },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Bucket historical revenue by period
    const buckets = new Map<string, Decimal>();
    for (const order of orders) {
      const key = this.bucketKey(order.createdAt, granularity);
      buckets.set(key, (buckets.get(key) ?? new Decimal(0)).plus(new Decimal(order.totalAmount)));
    }

    const historical = [...buckets.entries()].map(([period, revenue]) => ({
      period,
      revenue: revenue.toFixed(2),
    }));

    // Simple moving average over last N observed buckets for forecasting
    const values = [...buckets.values()];
    const windowSize = Math.min(7, values.length);
    const recentValues = values.slice(-windowSize);
    const avgRevenue = recentValues.length > 0
      ? recentValues.reduce((s, v) => s.plus(v), new Decimal(0)).dividedBy(recentValues.length)
      : new Decimal(0);

    // Linear trend: (last - first) / (n-1)
    const first = recentValues[0];
    const last = recentValues[recentValues.length - 1];
    const trend = recentValues.length > 1 && first !== undefined && last !== undefined
      ? last.minus(first).dividedBy(recentValues.length - 1)
      : new Decimal(0);

    const forecast = Array.from({ length: periods }, (_, i) => {
      const projected = avgRevenue.plus(trend.times(i + 1));
      return {
        period: this.forecastPeriodKey(i + 1, granularity),
        projectedRevenue: Decimal.max(projected, new Decimal(0)).toFixed(2),
      };
    });

    await this.audit.log({
      action: 'ai.forecast:read',
      entityType: 'ai_forecast',
      after: { granularity, periods, runBy: userId },
    });

    return { granularity, historical, forecast };
  }

  private bucketKey(date: Date, granularity: string): string {
    if (granularity === 'MONTHLY') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (granularity === 'WEEKLY') {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  }

  private forecastPeriodKey(offsetFromNow: number, granularity: string): string {
    const d = new Date();
    if (granularity === 'MONTHLY') {
      d.setMonth(d.getMonth() + offsetFromNow);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (granularity === 'WEEKLY') {
      d.setDate(d.getDate() + offsetFromNow * 7);
    } else {
      d.setDate(d.getDate() + offsetFromNow);
    }
    return d.toISOString().slice(0, 10);
  }

  // ─── Anomaly detection (Z-score over daily revenue) ──────────────────────────

  async detectAnomalies(dto: AnomalyDetectionDto) {
    const { tenantId, userId } = this.ctx();

    const from = dto.fromDate ? new Date(dto.fromDate) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 60);
      return d;
    })();
    const to = dto.toDate ? new Date(dto.toDate) : new Date();

    const orders = await this.prisma.posOrder.findMany({
      where: {
        tenantId,
        ...(dto.companyId ? { companyId: dto.companyId } : {}),
        status: 'SETTLED',
        createdAt: { gte: from, lte: to },
      },
      select: { totalAmount: true, createdAt: true },
    });

    // Bucket by day
    const buckets = new Map<string, Decimal>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? new Decimal(0)).plus(new Decimal(o.totalAmount)));
    }

    const values = [...buckets.values()].map((v) => v.toNumber());
    if (values.length < 3) {
      return { anomalies: [], message: 'Insufficient data for anomaly detection (need ≥3 days)' };
    }

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies: { date: string; revenue: string; zScore: string; type: string }[] = [];
    for (const [date, revenue] of buckets.entries()) {
      const r = revenue.toNumber();
      const z = stdDev > 0 ? (r - mean) / stdDev : 0;
      if (Math.abs(z) >= 2) {
        anomalies.push({
          date,
          revenue: revenue.toFixed(2),
          zScore: z.toFixed(2),
          type: z > 0 ? 'SPIKE' : 'DIP',
        });
      }
    }

    await this.audit.log({
      action: 'ai.anomaly:read',
      entityType: 'ai_anomaly',
      after: { anomalyCount: anomalies.length, runBy: userId },
    });

    return {
      fromDate: from,
      toDate: to,
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      anomalies: anomalies.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
