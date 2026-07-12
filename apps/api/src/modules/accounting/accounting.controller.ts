import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AccountingService } from './accounting.service';
import {
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

@ApiTags('accounting')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingController {
  constructor(private readonly svc: AccountingService) {}

  // ── Chart of Accounts ──────────────────────────────────────────────────────

  @Get('accounts')
  @RequirePermission('accounting.account:read')
  @ApiOperation({ summary: 'List chart of accounts' })
  listAccounts(@Query() q: AccountQueryDto) {
    return this.svc.listAccounts(q);
  }

  @Post('accounts')
  @RequirePermission('accounting.account:manage')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a ledger account' })
  createAccount(@Body() dto: CreateAccountDto) {
    return this.svc.createAccount(dto);
  }

  @Get('accounts/:id')
  @RequirePermission('accounting.account:read')
  @ApiOperation({ summary: 'Get account with parent and children' })
  getAccount(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getAccount(id);
  }

  @Patch('accounts/:id')
  @RequirePermission('accounting.account:manage')
  @ApiOperation({ summary: 'Update account name, active state, or system slot' })
  updateAccount(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAccountDto) {
    return this.svc.updateAccount(id, dto);
  }

  // ── Journals ───────────────────────────────────────────────────────────────

  @Get('journals')
  @RequirePermission('accounting.journal:read')
  @ApiOperation({ summary: 'List posted journals (cursor-paginated)' })
  listJournals(@Query() q: JournalQueryDto) {
    return this.svc.listJournals(q);
  }

  @Post('journals')
  @RequirePermission('accounting.journal:create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create and post a balanced manual journal' })
  createJournal(@Body() dto: CreateJournalDto) {
    return this.svc.createJournal(dto);
  }

  @Get('journals/:id')
  @RequirePermission('accounting.journal:read')
  @ApiOperation({ summary: 'Get journal with all lines' })
  getJournal(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getJournal(id);
  }

  @Post('journals/:id/reverse')
  @RequirePermission('accounting.journal:create')
  @ApiOperation({ summary: 'Reverse a posted journal (creates counter-entry)' })
  reverseJournal(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.reverseJournal(id);
  }

  // ── Fiscal Years & Periods ─────────────────────────────────────────────────

  @Get('fiscal-years')
  @RequirePermission('accounting.account:read')
  @ApiOperation({ summary: 'List fiscal years with periods' })
  listFiscalYears(@Query('companyId') companyId?: string) {
    return this.svc.listFiscalYears(companyId);
  }

  @Post('fiscal-years')
  @RequirePermission('accounting.account:manage')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create fiscal year and auto-generate monthly periods' })
  createFiscalYear(@Body() dto: CreateFiscalYearDto) {
    return this.svc.createFiscalYear(dto);
  }

  @Get('fiscal-years/:id/periods')
  @RequirePermission('accounting.account:read')
  @ApiOperation({ summary: 'List periods for a fiscal year' })
  listPeriods(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.listPeriods(id);
  }

  @Patch('periods/:id/close')
  @RequirePermission('accounting.period:close')
  @ApiOperation({ summary: 'Close an accounting period (prevents new postings)' })
  closePeriod(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.closePeriod(id);
  }

  @Patch('periods/:id/lock')
  @RequirePermission('accounting.period:close')
  @ApiOperation({ summary: 'Lock an accounting period (hard freeze, cannot reopen)' })
  lockPeriod(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.lockPeriod(id);
  }

  // ── Bank Accounts ──────────────────────────────────────────────────────────

  @Get('bank-accounts')
  @RequirePermission('accounting.bank:read')
  @ApiOperation({ summary: 'List bank accounts' })
  listBankAccounts(@Query('companyId') companyId?: string) {
    return this.svc.listBankAccounts(companyId);
  }

  @Post('bank-accounts')
  @RequirePermission('accounting.bank:manage')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a bank account' })
  createBankAccount(@Body() dto: CreateBankAccountDto) {
    return this.svc.createBankAccount(dto);
  }

  @Get('bank-accounts/:id/transactions')
  @RequirePermission('accounting.bank:read')
  @ApiOperation({ summary: 'List bank statement transactions' })
  listBankTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listBankTransactions(id, status);
  }

  @Post('bank-accounts/:id/transactions')
  @RequirePermission('accounting.bank:manage')
  @HttpCode(201)
  @ApiOperation({ summary: 'Import bank statement transactions (bulk)' })
  importBankTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ImportBankTransactionsDto,
  ) {
    return this.svc.importBankTransactions(id, dto);
  }

  @Post('bank-accounts/:bankAccountId/transactions/:txId/match')
  @RequirePermission('accounting.reconciliation:manage')
  @ApiOperation({ summary: 'Match a bank transaction to a journal line' })
  matchBankTransaction(
    @Param('txId', ParseUUIDPipe) txId: string,
    @Body() dto: MatchTransactionDto,
  ) {
    return this.svc.matchBankTransaction(txId, dto);
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  @Get('reports/trial-balance')
  @RequirePermission('accounting.report:read')
  @ApiOperation({ summary: 'Trial balance for a date range' })
  trialBalance(@Query() q: ReportQueryDto) {
    return this.svc.trialBalance(q);
  }

  @Get('reports/profit-loss')
  @RequirePermission('accounting.report:read')
  @ApiOperation({ summary: 'Profit & Loss statement for a period' })
  profitLoss(@Query() q: ReportQueryDto) {
    return this.svc.profitLoss(q);
  }

  @Get('reports/balance-sheet')
  @RequirePermission('accounting.report:read')
  @ApiOperation({ summary: 'Balance sheet as of a date' })
  balanceSheet(@Query() q: BalanceSheetQueryDto) {
    return this.svc.balanceSheet(q);
  }

  @Get('reports/gst-summary')
  @RequirePermission('accounting.report:read')
  @ApiOperation({ summary: 'GST summary from settled POS orders for a month' })
  gstSummary(@Query() q: GstSummaryQueryDto) {
    return this.svc.gstSummary(q);
  }

  // ── Tax Groups ─────────────────────────────────────────────────────────────

  @Get('tax-groups')
  @RequirePermission('accounting.tax:read')
  @ApiOperation({ summary: 'List tax groups with components' })
  listTaxGroups() {
    return this.svc.listTaxGroups();
  }

  @Post('tax-groups')
  @RequirePermission('accounting.tax:manage')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a tax group (e.g. GST 18% = CGST 9% + SGST 9%)' })
  createTaxGroup(@Body() dto: CreateTaxGroupDto) {
    return this.svc.createTaxGroup(dto);
  }
}
