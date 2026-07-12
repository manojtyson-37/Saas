import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../../common/prisma.service';
import { SequenceService } from '../../common/sequence.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  AccountQueryDto,
  BalanceSheetQueryDto,
  CreateAccountDto,
  CreateBankAccountDto,
  CreateFiscalYearDto,
  CreateJournalDto,
  CreateTaxGroupDto,
  GstSummaryQueryDto,
  ImportBankTransactionsDto,
  JournalQueryDto,
  MatchTransactionDto,
  ReportQueryDto,
  UpdateAccountDto,
} from './dto/accounting.dto';

interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  totalDebit: string;
  totalCredit: string;
}

interface PnlRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  net: string;
}

interface BsRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  balance: string;
}

interface GstRow {
  outletId: string;
  channel: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
}

@Injectable()
export class AccountingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly seq: SequenceService,
  ) {}

  private ctx(): { tenantId: string; userId: string | undefined } {
    const c = TenantContext.get();
    if (!c?.tenantId) throw new BadRequestException('No tenant context');
    return { tenantId: c.tenantId, userId: c.userId };
  }

  // ── Chart of Accounts ──────────────────────────────────────────────────────

  async createAccount(dto: CreateAccountDto) {
    const { tenantId } = this.ctx();

    if (dto.parentId) {
      const parent = await this.prisma.chartOfAccount.findFirst({
        where: { id: dto.parentId, tenantId, companyId: dto.companyId },
      });
      if (!parent) throw new NotFoundException('Parent account not found');
      if (!parent.isGroup) throw new BadRequestException('Parent must be a group account');
    }

    const account = await this.prisma.chartOfAccount.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId,
        systemSlot: dto.systemSlot,
        isGroup: dto.isGroup ?? false,
      },
    });

    await this.audit.log({
      action: 'accounting.account:create',
      entityType: 'chart_of_account',
      entityId: account.id,
      after: { code: account.code, name: account.name, type: account.type },
    });

    return account;
  }

  async listAccounts(dto: AccountQueryDto) {
    const { tenantId } = this.ctx();
    return this.prisma.chartOfAccount.findMany({
      where: {
        tenantId,
        ...(dto.companyId ? { companyId: dto.companyId } : {}),
        ...(dto.type ? { type: dto.type } : {}),
      },
      include: {
        children: { select: { id: true, code: true, name: true, isGroup: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getAccount(id: string) {
    const { tenantId } = this.ctx();
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id, tenantId },
      include: { parent: true, children: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async updateAccount(id: string, dto: UpdateAccountDto) {
    const { tenantId } = this.ctx();
    const before = await this.prisma.chartOfAccount.findFirst({ where: { id, tenantId } });
    if (!before) throw new NotFoundException('Account not found');

    const updated = await this.prisma.chartOfAccount.update({ where: { id }, data: dto });

    await this.audit.log({
      action: 'accounting.account:update',
      entityType: 'chart_of_account',
      entityId: id,
      before: { name: before.name, isActive: before.isActive, systemSlot: before.systemSlot },
      after: dto,
    });

    return updated;
  }

  // ── Journals ───────────────────────────────────────────────────────────────

  async createJournal(dto: CreateJournalDto) {
    const { tenantId } = this.ctx();

    // Validate each line has exactly one side
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);
    for (const line of dto.lines) {
      const dr = new Decimal(line.debit ?? 0);
      const cr = new Decimal(line.credit ?? 0);
      if (dr.gt(0) && cr.gt(0)) {
        throw new BadRequestException('Journal line cannot have both debit and credit');
      }
      if (dr.isZero() && cr.isZero()) {
        throw new BadRequestException('Each journal line must have a non-zero debit or credit');
      }
      totalDebit = totalDebit.plus(dr);
      totalCredit = totalCredit.plus(cr);
    }
    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestException(
        `Journal is not balanced: Dr ${totalDebit.toFixed(4)} ≠ Cr ${totalCredit.toFixed(4)}`,
      );
    }

    // Validate all accounts exist and are leaf accounts
    const accountIds = [...new Set(dto.lines.map((l) => l.accountId))];
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { id: { in: accountIds }, tenantId, isGroup: false },
    });
    if (accounts.length !== accountIds.length) {
      throw new BadRequestException('One or more accounts not found or are group accounts');
    }

    await this.assertPeriodOpen(tenantId, dto.companyId, new Date(dto.businessDate));

    const number = await this.seq.next(tenantId, dto.companyId, 'JOURNAL', 'JNL', 6);

    const journal = await this.prisma.journal.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        number,
        status: 'POSTED',
        businessDate: new Date(dto.businessDate),
        memo: dto.memo,
        sourceType: dto.sourceType ?? 'manual',
        sourceId: dto.sourceId,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            accountId: l.accountId,
            debit: new Decimal(l.debit ?? 0),
            credit: new Decimal(l.credit ?? 0),
            locationId: l.locationId,
            outletId: l.outletId,
            costCenter: l.costCenter,
            memo: l.memo,
          })),
        },
      },
      include: { lines: true },
    });

    await this.audit.log({
      action: 'accounting.journal:create',
      entityType: 'journal',
      entityId: journal.id,
      after: { number: journal.number, totalDebit: totalDebit.toFixed(4), lineCount: dto.lines.length },
    });

    return journal;
  }

  async listJournals(dto: JournalQueryDto) {
    const { tenantId } = this.ctx();
    const limit = Math.min(dto.limit ?? 50, 100);
    return this.prisma.journal.findMany({
      where: {
        tenantId,
        ...(dto.companyId ? { companyId: dto.companyId } : {}),
        ...(dto.sourceType ? { sourceType: dto.sourceType } : {}),
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      include: { lines: true },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async getJournal(id: string) {
    const { tenantId } = this.ctx();
    const journal = await this.prisma.journal.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!journal) throw new NotFoundException('Journal not found');
    return journal;
  }

  async reverseJournal(id: string) {
    const { tenantId } = this.ctx();
    const original = await this.prisma.journal.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!original) throw new NotFoundException('Journal not found');
    if (original.status !== 'POSTED') {
      throw new BadRequestException('Only POSTED journals can be reversed');
    }

    const today = new Date();
    await this.assertPeriodOpen(tenantId, original.companyId, today);

    const number = await this.seq.next(tenantId, original.companyId, 'JOURNAL', 'JNL', 6);

    const reversed = await this.prisma.$transaction(async (tx) => {
      const rev = await tx.journal.create({
        data: {
          tenantId,
          companyId: original.companyId,
          number,
          status: 'POSTED',
          businessDate: today,
          memo: `Reversal of ${original.number}`,
          sourceType: 'reversal',
          sourceId: original.id,
          reversesJournalId: original.id,
          lines: {
            create: original.lines.map((l) => ({
              tenantId,
              accountId: l.accountId,
              debit: l.credit,
              credit: l.debit,
              locationId: l.locationId,
              outletId: l.outletId,
              costCenter: l.costCenter,
              memo: l.memo,
            })),
          },
        },
        include: { lines: true },
      });

      await tx.journal.update({ where: { id: original.id }, data: { status: 'REVERSED' } });

      return rev;
    });

    await this.audit.log({
      action: 'accounting.journal:reverse',
      entityType: 'journal',
      entityId: reversed.id,
      after: { number: reversed.number, reversesJournalId: original.id },
    });

    return reversed;
  }

  // ── Fiscal Years & Periods ─────────────────────────────────────────────────

  async createFiscalYear(dto: CreateFiscalYearDto) {
    const { tenantId } = this.ctx();

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) throw new BadRequestException('endDate must be after startDate');

    const periods: { tenantId: string; name: string; startDate: Date; endDate: Date; status: 'OPEN' }[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const periodStart = new Date(cursor);
      const periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const actualEnd = periodEnd > end ? end : periodEnd;
      periods.push({
        tenantId,
        name: periodStart.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
        startDate: periodStart,
        endDate: actualEnd,
        status: 'OPEN',
      });
      cursor.setMonth(cursor.getMonth() + 1);
      cursor.setDate(1);
    }

    const fy = await this.prisma.fiscalYear.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        label: dto.label,
        startDate: start,
        endDate: end,
        periods: { create: periods },
      },
      include: { periods: { orderBy: { startDate: 'asc' } } },
    });

    await this.audit.log({
      action: 'accounting.fiscal_year:create',
      entityType: 'fiscal_year',
      entityId: fy.id,
      after: { label: fy.label, periods: periods.length },
    });

    return fy;
  }

  async listFiscalYears(companyId?: string) {
    const { tenantId } = this.ctx();
    return this.prisma.fiscalYear.findMany({
      where: { tenantId, ...(companyId ? { companyId } : {}) },
      include: { periods: { orderBy: { startDate: 'asc' } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async listPeriods(fiscalYearId: string) {
    const { tenantId } = this.ctx();
    const fy = await this.prisma.fiscalYear.findFirst({ where: { id: fiscalYearId, tenantId } });
    if (!fy) throw new NotFoundException('Fiscal year not found');
    return this.prisma.accountingPeriod.findMany({
      where: { fiscalYearId, tenantId },
      orderBy: { startDate: 'asc' },
    });
  }

  async closePeriod(periodId: string) {
    const { tenantId, userId } = this.ctx();
    const period = await this.prisma.accountingPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Period not found');
    if (period.status !== 'OPEN') throw new BadRequestException('Period is not open');

    const updated = await this.prisma.accountingPeriod.update({
      where: { id: periodId },
      data: { status: 'CLOSED', closedBy: userId, closedAt: new Date() },
    });

    await this.audit.log({
      action: 'accounting.period:close',
      entityType: 'accounting_period',
      entityId: periodId,
      before: { status: period.status },
      after: { status: 'CLOSED' },
    });

    return updated;
  }

  async lockPeriod(periodId: string) {
    const { tenantId, userId } = this.ctx();
    const period = await this.prisma.accountingPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Period not found');
    if (period.status === 'LOCKED') throw new BadRequestException('Period is already locked');

    const updated = await this.prisma.accountingPeriod.update({
      where: { id: periodId },
      data: { status: 'LOCKED', closedBy: userId, closedAt: new Date() },
    });

    await this.audit.log({
      action: 'accounting.period:lock',
      entityType: 'accounting_period',
      entityId: periodId,
      before: { status: period.status },
      after: { status: 'LOCKED' },
    });

    return updated;
  }

  // ── Bank Accounts ──────────────────────────────────────────────────────────

  async createBankAccount(dto: CreateBankAccountDto) {
    const { tenantId } = this.ctx();
    const account = await this.prisma.bankAccount.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        name: dto.name,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        ifsc: dto.ifsc,
        accountId: dto.accountId,
        currency: dto.currency ?? 'INR',
      },
    });

    await this.audit.log({
      action: 'accounting.bank_account:create',
      entityType: 'bank_account',
      entityId: account.id,
      after: { name: account.name, bankName: account.bankName },
    });

    return account;
  }

  async listBankAccounts(companyId?: string) {
    const { tenantId } = this.ctx();
    return this.prisma.bankAccount.findMany({
      where: { tenantId, ...(companyId ? { companyId } : {}), isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async importBankTransactions(bankAccountId: string, dto: ImportBankTransactionsDto) {
    const { tenantId } = this.ctx();
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, tenantId },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    const importBatchId = crypto.randomUUID();

    await this.prisma.bankTransaction.createMany({
      data: dto.transactions.map((t) => ({
        tenantId,
        bankAccountId,
        date: new Date(t.date),
        description: t.description,
        amount: new Decimal(t.amount),
        reference: t.reference,
        importBatchId,
      })),
    });

    return { imported: dto.transactions.length, importBatchId };
  }

  async listBankTransactions(bankAccountId: string, status?: string) {
    const { tenantId } = this.ctx();
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, tenantId },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    return this.prisma.bankTransaction.findMany({
      where: {
        tenantId,
        bankAccountId,
        ...(status ? { status: status as 'UNRECONCILED' | 'MATCHED' | 'RECONCILED' } : {}),
      },
      orderBy: { date: 'desc' },
      take: 200,
    });
  }

  async matchBankTransaction(txId: string, dto: MatchTransactionDto) {
    const { tenantId } = this.ctx();
    const tx = await this.prisma.bankTransaction.findFirst({ where: { id: txId, tenantId } });
    if (!tx) throw new NotFoundException('Bank transaction not found');
    if (tx.status === 'RECONCILED') throw new BadRequestException('Transaction is already reconciled');

    return this.prisma.bankTransaction.update({
      where: { id: txId },
      data: { status: 'MATCHED', matchedJournalLineId: dto.journalLineId },
    });
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  async trialBalance(dto: ReportQueryDto) {
    const { tenantId } = this.ctx();
    const rows = await this.prisma.$queryRaw<TrialBalanceRow[]>`
      SELECT
        a.id            AS "accountId",
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(jl.debit),  0)::text AS "totalDebit",
        COALESCE(SUM(jl.credit), 0)::text AS "totalCredit"
      FROM journal_line jl
      JOIN journal j            ON j.id  = jl.journal_id
      JOIN chart_of_account a   ON a.id  = jl.account_id
      WHERE j.tenant_id    = ${tenantId}
        AND j.company_id   = ${dto.companyId}
        AND j.business_date >= ${new Date(dto.fromDate)}::date
        AND j.business_date <= ${new Date(dto.toDate)}::date
        AND j.status       = 'POSTED'
        AND jl.tenant_id   = ${tenantId}
        AND a.is_group     = false
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code
    `;

    return rows.map((r) => ({
      accountId: r.accountId,
      code: r.code,
      name: r.name,
      type: r.type,
      totalDebit: Number(r.totalDebit),
      totalCredit: Number(r.totalCredit),
      balance: Number(r.totalDebit) - Number(r.totalCredit),
    }));
  }

  async profitLoss(dto: ReportQueryDto) {
    const { tenantId } = this.ctx();
    const rows = await this.prisma.$queryRaw<PnlRow[]>`
      SELECT
        a.id   AS "accountId",
        a.code,
        a.name,
        a.type,
        (COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0))::text AS net
      FROM journal_line jl
      JOIN journal j          ON j.id = jl.journal_id
      JOIN chart_of_account a ON a.id = jl.account_id
      WHERE j.tenant_id    = ${tenantId}
        AND j.company_id   = ${dto.companyId}
        AND j.business_date >= ${new Date(dto.fromDate)}::date
        AND j.business_date <= ${new Date(dto.toDate)}::date
        AND j.status       = 'POSTED'
        AND jl.tenant_id   = ${tenantId}
        AND a.type IN ('INCOME', 'EXPENSE')
        AND a.is_group     = false
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `;

    const income = rows
      .filter((r) => r.type === 'INCOME')
      .map((r) => ({ ...r, net: Number(r.net) }));
    const expenses = rows
      .filter((r) => r.type === 'EXPENSE')
      .map((r) => ({ ...r, net: -Number(r.net) }));

    const totalIncome = income.reduce((s, r) => s + r.net, 0);
    const totalExpenses = expenses.reduce((s, r) => s + r.net, 0);

    return {
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    };
  }

  async balanceSheet(dto: BalanceSheetQueryDto) {
    const { tenantId } = this.ctx();
    const rows = await this.prisma.$queryRaw<BsRow[]>`
      SELECT
        a.id   AS "accountId",
        a.code,
        a.name,
        a.type,
        (COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0))::text AS balance
      FROM journal_line jl
      JOIN journal j          ON j.id = jl.journal_id
      JOIN chart_of_account a ON a.id = jl.account_id
      WHERE j.tenant_id    = ${tenantId}
        AND j.company_id   = ${dto.companyId}
        AND j.business_date <= ${new Date(dto.asOfDate)}::date
        AND j.status       = 'POSTED'
        AND jl.tenant_id   = ${tenantId}
        AND a.type IN ('ASSET', 'LIABILITY', 'EQUITY')
        AND a.is_group     = false
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `;

    const assets = rows
      .filter((r) => r.type === 'ASSET')
      .map((r) => ({ ...r, balance: Number(r.balance) }));
    const liabilities = rows
      .filter((r) => r.type === 'LIABILITY')
      .map((r) => ({ ...r, balance: -Number(r.balance) }));
    const equity = rows
      .filter((r) => r.type === 'EQUITY')
      .map((r) => ({ ...r, balance: -Number(r.balance) }));

    return {
      asOfDate: dto.asOfDate,
      assets,
      liabilities,
      equity,
      totalAssets: assets.reduce((s, r) => s + r.balance, 0),
      totalLiabilities: liabilities.reduce((s, r) => s + r.balance, 0),
      totalEquity: equity.reduce((s, r) => s + r.balance, 0),
    };
  }

  async gstSummary(dto: GstSummaryQueryDto) {
    const { tenantId } = this.ctx();
    const fromDate = new Date(dto.year, dto.month - 1, 1);
    const toDate = new Date(dto.year, dto.month, 0);

    const rows = await this.prisma.$queryRaw<GstRow[]>`
      SELECT
        o.outlet_id                           AS "outletId",
        o.channel,
        COALESCE(SUM(o.subtotal),         0)::text AS subtotal,
        COALESCE(SUM(o.discount_amount),  0)::text AS "discountAmount",
        COALESCE(SUM(o.tax_amount),       0)::text AS "taxAmount",
        COALESCE(SUM(o.total_amount),     0)::text AS "totalAmount"
      FROM pos_order o
      WHERE o.tenant_id    = ${tenantId}
        AND o.business_date >= ${fromDate}::date
        AND o.business_date <= ${toDate}::date
        AND o.status       = 'SETTLED'
      GROUP BY o.outlet_id, o.channel
    `;

    const mapped = rows.map((r) => ({
      outletId: r.outletId,
      channel: r.channel,
      subtotal: Number(r.subtotal),
      discountAmount: Number(r.discountAmount),
      taxableValue: Number(r.subtotal) - Number(r.discountAmount),
      taxAmount: Number(r.taxAmount),
      totalAmount: Number(r.totalAmount),
    }));

    return {
      month: dto.month,
      year: dto.year,
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      byOutletChannel: mapped,
      totalTaxableValue: mapped.reduce((s, r) => s + r.taxableValue, 0),
      totalTax: mapped.reduce((s, r) => s + r.taxAmount, 0),
      totalRevenue: mapped.reduce((s, r) => s + r.totalAmount, 0),
    };
  }

  // ── Tax Groups ─────────────────────────────────────────────────────────────

  async createTaxGroup(dto: CreateTaxGroupDto) {
    const { tenantId } = this.ctx();
    const totalRate = dto.components.reduce((s, c) => s + c.rate, 0);

    const taxGroup = await this.prisma.taxGroup.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        totalRate: new Decimal(totalRate),
        components: {
          create: dto.components.map((c) => ({
            tenantId,
            name: c.name,
            rate: new Decimal(c.rate),
            accountSlot: c.accountSlot,
          })),
        },
      },
      include: { components: true },
    });

    await this.audit.log({
      action: 'accounting.tax_group:create',
      entityType: 'tax_group',
      entityId: taxGroup.id,
      after: { code: taxGroup.code, totalRate: Number(taxGroup.totalRate) },
    });

    return taxGroup;
  }

  async listTaxGroups() {
    const { tenantId } = this.ctx();
    return this.prisma.taxGroup.findMany({
      where: { tenantId, isActive: true },
      include: { components: true },
      orderBy: { code: 'asc' },
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async assertPeriodOpen(tenantId: string, companyId: string, date: Date): Promise<void> {
    const period = await this.prisma.accountingPeriod.findFirst({
      where: {
        tenantId,
        fiscalYear: { companyId },
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
    if (period?.status === 'LOCKED') {
      throw new BadRequestException(
        `Accounting period "${period.name}" is locked — no postings allowed`,
      );
    }
  }
}
