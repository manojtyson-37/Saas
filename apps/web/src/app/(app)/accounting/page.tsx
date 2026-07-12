'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  isGroup: boolean;
  isActive: boolean;
  systemSlot: string | null;
  parentId: string | null;
}

interface Journal {
  id: string;
  number: string;
  status: string;
  businessDate: string;
  memo: string | null;
  sourceType: string;
  createdAt: string;
  lines: JournalLine[];
}

interface JournalLine {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  memo: string | null;
}

interface TaxGroup {
  id: string;
  code: string;
  name: string;
  totalRate: string;
  isActive: boolean;
  components: TaxComponent[];
}

interface TaxComponent {
  id: string;
  name: string;
  rate: string;
}

interface FiscalYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  periods: Period[];
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-blue-500/10 text-blue-600',
  LIABILITY: 'bg-warning/10 text-warning',
  EQUITY: 'bg-purple-500/10 text-purple-600',
  INCOME: 'bg-success/10 text-success',
  EXPENSE: 'bg-destructive/10 text-destructive',
};

const JOURNAL_STATUS_COLORS: Record<string, string> = {
  POSTED: 'bg-success/10 text-success',
  DRAFT: 'bg-accent text-muted',
  REVERSED: 'bg-accent text-muted',
  PENDING_APPROVAL: 'bg-warning/10 text-warning',
};

const PERIOD_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-success/10 text-success',
  CLOSED: 'bg-warning/10 text-warning',
  LOCKED: 'bg-destructive/10 text-destructive',
};

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as const;

type Tab = 'accounts' | 'journals' | 'fiscal-years' | 'tax-groups';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<Account[]>('/accounting/accounts')
      .then(setAccounts)
      .catch(() => undefined);
    api<Journal[]>('/accounting/journals?limit=50')
      .then(setJournals)
      .catch(() => undefined);
    api<TaxGroup[]>('/accounting/tax-groups')
      .then(setTaxGroups)
      .catch(() => undefined);
    api<FiscalYear[]>('/accounting/fiscal-years')
      .then(setFiscalYears)
      .catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  async function createAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/accounting/accounts', {
        method: 'POST',
        body: JSON.stringify({
          companyId: String(form.get('companyId')),
          code: String(form.get('code')),
          name: String(form.get('name')),
          type: String(form.get('type')),
          isGroup: form.get('isGroup') === 'true',
          systemSlot: String(form.get('systemSlot')) || undefined,
        }),
      });
      setCreating(false);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create account');
    } finally {
      setBusy(false);
    }
  }

  async function createTaxGroup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const cgstRate = Number(form.get('cgstRate')) || 0;
    const sgstRate = Number(form.get('sgstRate')) || 0;
    const igstRate = Number(form.get('igstRate')) || 0;
    const components = [];
    if (cgstRate > 0) components.push({ name: 'CGST', rate: cgstRate });
    if (sgstRate > 0) components.push({ name: 'SGST', rate: sgstRate });
    if (igstRate > 0) components.push({ name: 'IGST', rate: igstRate });
    if (components.length === 0) {
      setError('At least one tax component is required');
      setBusy(false);
      return;
    }
    try {
      await api('/accounting/tax-groups', {
        method: 'POST',
        body: JSON.stringify({
          code: String(form.get('code')),
          name: String(form.get('name')),
          components,
        }),
      });
      setCreating(false);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create tax group');
    } finally {
      setBusy(false);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'accounts', label: 'Chart of Accounts' },
    { key: 'journals', label: 'Journals' },
    { key: 'fiscal-years', label: 'Fiscal Years' },
    { key: 'tax-groups', label: 'Tax Groups' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Accounting</h1>
          <p className="mt-1 text-sm text-muted">
            Chart of accounts, journals, GST, banking, and financial reports.
          </p>
        </div>
        {(activeTab === 'accounts' || activeTab === 'tax-groups') && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {activeTab === 'accounts' ? 'New account' : 'New tax group'}
          </Button>
        )}
      </div>

      {creating && activeTab === 'accounts' && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New ledger account</h2>
          <form onSubmit={createAccount} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="companyId" label="Company ID" required placeholder="UUID" />
            <Input name="code" label="Account code" required placeholder="1001" />
            <Input name="name" label="Account name" required placeholder="Cash at bank" />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium">Type</label>
              <select
                name="type"
                required
                className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <Input name="systemSlot" label="System slot (optional)" placeholder="REVENUE_FOOD" />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium">Is group account?</label>
              <select
                name="isGroup"
                className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
              >
                <option value="false">No — posting account</option>
                <option value="true">Yes — group / header</option>
              </select>
            </div>
            {error && <p className="col-span-full text-[13px] text-destructive">{error}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy}>Create</Button>
              <Button type="button" variant="ghost" onClick={() => { setCreating(false); setError(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {creating && activeTab === 'tax-groups' && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New tax group</h2>
          <form onSubmit={createTaxGroup} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="code" label="Code" required placeholder="GST18" />
            <Input name="name" label="Name" required placeholder="GST 18%" />
            <Input name="cgstRate" label="CGST %" type="number" min={0} max={50} step="0.001" placeholder="9" />
            <Input name="sgstRate" label="SGST %" type="number" min={0} max={50} step="0.001" placeholder="9" />
            <Input name="igstRate" label="IGST % (interstate)" type="number" min={0} max={100} step="0.001" placeholder="0" />
            {error && <p className="col-span-full text-[13px] text-destructive">{error}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy}>Create</Button>
              <Button type="button" variant="ghost" onClick={() => { setCreating(false); setError(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-control border border-border bg-accent p-1 w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setCreating(false); setError(null); }}
            className={cx(
              'rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors',
              activeTab === tab.key ? 'bg-surface shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'accounts' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">System slot</th>
                <th className="px-5 py-3 font-medium">Kind</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                    No accounts yet — set up your chart of accounts.
                  </td>
                </tr>
              )}
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3 font-mono text-[13px] font-medium">{a.code}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted shrink-0" />
                      <span className={a.isGroup ? 'font-semibold' : ''}>{a.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cx('rounded-full px-2 py-0.5 text-[12px] font-medium', ACCOUNT_TYPE_COLORS[a.type] ?? 'bg-accent text-muted')}>
                      {a.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted font-mono">
                    {a.systemSlot ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted">
                    {a.isGroup ? 'Group' : 'Posting'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cx('rounded-full px-2 py-0.5 text-[12px] font-medium', a.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                      {a.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'journals' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Lines</th>
                <th className="px-5 py-3 font-medium text-right">Total Dr</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {journals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                    No journals yet — create a manual journal or post a transaction.
                  </td>
                </tr>
              )}
              {journals.map((j) => {
                const totalDr = j.lines.reduce((s, l) => s + Number(l.debit), 0);
                return (
                  <tr key={j.id} className="hover:bg-accent/50">
                    <td className="px-5 py-3 font-mono text-[13px] font-medium">{j.number}</td>
                    <td className="px-5 py-3 text-[13px] text-muted capitalize">{j.sourceType.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3">
                      <span className={cx('rounded-full px-2 py-0.5 text-[12px] font-medium', JOURNAL_STATUS_COLORS[j.status] ?? 'bg-accent text-muted')}>
                        {j.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 tnum text-[13px]">{j.lines.length}</td>
                    <td className="px-5 py-3 tnum text-right text-[13px]">
                      ₹{totalDr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-muted">
                      {new Date(j.businessDate).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'fiscal-years' && (
        <div className="space-y-4">
          {fiscalYears.length === 0 && (
            <Card>
              <p className="text-center text-sm text-muted py-6">
                No fiscal years yet — create one to enable period management.
              </p>
            </Card>
          )}
          {fiscalYears.map((fy) => (
            <Card key={fy.id} className="p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <p className="font-semibold text-[14px]">{fy.label}</p>
                  <p className="text-[12px] text-muted">
                    {new Date(fy.startDate).toLocaleDateString()} – {new Date(fy.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[12px] text-muted">{fy.periods.length} periods</span>
              </div>
              <div className="flex flex-wrap gap-2 px-5 py-3">
                {fy.periods.map((p) => (
                  <div
                    key={p.id}
                    className={cx(
                      'rounded-control border px-3 py-1.5 text-[12px] font-medium',
                      p.status === 'OPEN' ? 'border-success/30 text-success' :
                      p.status === 'CLOSED' ? 'border-warning/30 text-warning' :
                      'border-destructive/30 text-destructive',
                    )}
                  >
                    {p.name}
                    <span className={cx('ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]', PERIOD_STATUS_COLORS[p.status] ?? 'bg-accent text-muted')}>
                      {p.status.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'tax-groups' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Components</th>
                <th className="px-5 py-3 font-medium text-right">Total rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {taxGroups.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                    No tax groups yet — add GST rates to apply on orders and invoices.
                  </td>
                </tr>
              )}
              {taxGroups.map((tg) => (
                <tr key={tg.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3 font-mono text-[13px] font-medium">{tg.code}</td>
                  <td className="px-5 py-3 text-[13px]">{tg.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tg.components.map((c) => (
                        <span key={c.id} className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted">
                          {c.name} {Number(c.rate).toFixed(3)}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 tnum text-right text-[13px] font-medium">
                    {Number(tg.totalRate).toFixed(3)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
