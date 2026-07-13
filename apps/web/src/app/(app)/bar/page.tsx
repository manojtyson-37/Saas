'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Wine, Plus, Droplet, Percent, FileBarChart } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Bottle {
  id: string;
  itemId: string;
  storeId: string;
  batchId: string | null;
  status: 'SEALED' | 'OPEN' | 'EMPTY' | 'WRITTEN_OFF';
  volumeMl: string;
  remainingMl: string;
  openedAt: string | null;
  emptiedAt: string | null;
  createdAt: string;
}

interface Pour {
  id: string;
  bottleId: string;
  type: 'SALE' | 'WASTE' | 'SPILLAGE' | 'COMPLIMENTARY' | 'SAMPLE';
  volumeMl: string;
  orderItemId: string | null;
  reason: string | null;
  pouredBy: string | null;
  createdAt: string;
}

interface VarianceItem {
  itemId: string;
  totalMl: string;
  saleMl: string;
  wasteMl: string;
  spillageMl: string;
  complimentaryMl: string;
  sampleMl: string;
  variancePct: string;
}

interface VarianceReport {
  fromDate: string;
  toDate: string;
  items: VarianceItem[];
}

interface ExciseItem {
  itemId: string;
  bottlesOpened: number;
  soldMl: string;
  wasteMl: string;
}

interface ExciseSummary {
  period: string;
  fromDate: string;
  toDate: string;
  items: ExciseItem[];
}

interface InventoryItem {
  id: string;
  code: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  SEALED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  EMPTY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  WRITTEN_OFF: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const POUR_TYPE_COLORS: Record<string, string> = {
  SALE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  WASTE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SPILLAGE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLIMENTARY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SAMPLE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

type Tab = 'bottles' | 'pours' | 'variance';

export default function BarPage() {
  const [tab, setTab] = useState<Tab>('bottles');
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [pours, setPours] = useState<Pour[]>([]);
  const [variance, setVariance] = useState<VarianceReport | null>(null);
  const [excise, setExcise] = useState<ExciseSummary | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [registering, setRegistering] = useState(false);
  const [pouring, setPouring] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const storesById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);

  // Reference data loaded once — used for item/store name lookups and form selects.
  useEffect(() => {
    api<{ data: InventoryItem[] }>('/inventory/items?limit=200').then((r) => setItems(r.data)).catch(() => undefined);
    api<Store[]>('/organization/stores').then(setStores).catch(() => undefined);
  }, []);

  const loadBottles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBottles(await api<Bottle[]>('/bar/bottles'));
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load bottles');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPours = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPours(await api<Pour[]>('/bar/pours'));
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load pours');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVariance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVariance(await api<VarianceReport>('/bar/variance'));
      setExcise(await api<ExciseSummary>(`/bar/excise?period=${period}`));
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load variance report');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (tab === 'bottles') loadBottles();
    else if (tab === 'pours') loadPours();
    else if (tab === 'variance') loadVariance();
  }, [tab, loadBottles, loadPours, loadVariance]);

  async function registerBottle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/bar/bottles', {
        method: 'POST',
        body: JSON.stringify({
          itemId: String(form.get('itemId')),
          storeId: String(form.get('storeId')),
          batchId: String(form.get('batchId')) || undefined,
          volumeMl: Number(form.get('volumeMl')),
        }),
      });
      setRegistering(false);
      loadBottles();
    } catch (err) {
      setFormError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to register bottle');
    } finally {
      setBusy(false);
    }
  }

  async function recordPour(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/bar/pours', {
        method: 'POST',
        body: JSON.stringify({
          bottleId: String(form.get('bottleId')),
          type: String(form.get('type')),
          volumeMl: Number(form.get('volumeMl')),
          reason: String(form.get('reason')) || undefined,
        }),
      });
      setPouring(false);
      loadBottles();
    } catch (err) {
      setFormError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to record pour');
    } finally {
      setBusy(false);
    }
  }

  async function openBottle(bottleId: string) {
    setError('');
    try {
      await api('/bar/bottles/open', { method: 'POST', body: JSON.stringify({ bottleId }) });
      loadBottles();
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to open bottle');
    }
  }

  const openBottles = bottles.filter((b) => b.status === 'OPEN');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'bottles', label: 'Bottle registry', icon: Wine },
    { id: 'pours', label: 'Pour log', icon: Droplet },
    { id: 'variance', label: 'Variance & excise', icon: FileBarChart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wine className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Bar</h1>
            <p className="mt-1 text-sm text-muted">Bottle registry, pour recording, variance and excise reporting.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPouring(true)}>
            <Droplet className="h-4 w-4" /> Record pour
          </Button>
          <Button size="sm" onClick={() => setRegistering(true)}>
            <Plus className="h-4 w-4" /> Register bottle
          </Button>
        </div>
      </div>

      {registering && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">Register a new bottle</h2>
          <form onSubmit={registerBottle} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="itemId" className="block text-[13px] font-medium">Liquor item</label>
              <select id="itemId" name="itemId" required className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm">
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="storeId" className="block text-[13px] font-medium">Store</label>
              <select id="storeId" name="storeId" required className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm">
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <Input name="batchId" label="Batch ID (optional)" maxLength={60} />
            <Input name="volumeMl" label="Volume (ml)" type="number" min={0.01} step="0.01" required placeholder="750" />
            {formError && <p className="col-span-full text-[13px] text-destructive">{formError}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy}>Register</Button>
              <Button type="button" variant="ghost" onClick={() => { setRegistering(false); setFormError(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {pouring && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">Record a pour</h2>
          <form onSubmit={recordPour} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="bottleId" className="block text-[13px] font-medium">Open bottle</label>
              <select id="bottleId" name="bottleId" required className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm">
                {openBottles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {itemsById.get(b.itemId)?.name ?? b.itemId.slice(0, 8)} — {Number(b.remainingMl).toFixed(0)}ml left
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="type" className="block text-[13px] font-medium">Pour type</label>
              <select id="type" name="type" required className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm">
                {['SALE', 'WASTE', 'SPILLAGE', 'COMPLIMENTARY', 'SAMPLE'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <Input name="volumeMl" label="Volume (ml)" type="number" min={0.01} step="0.01" required placeholder="30" />
            <Input name="reason" label="Reason (optional)" maxLength={200} />
            {openBottles.length === 0 && (
              <p className="col-span-full text-[13px] text-muted">No open bottles available — open a sealed bottle first.</p>
            )}
            {formError && <p className="col-span-full text-[13px] text-destructive">{formError}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy} disabled={openBottles.length === 0}>Record</Button>
              <Button type="button" variant="ghost" onClick={() => { setPouring(false); setFormError(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === id ? 'border-primary text-foreground' : 'border-transparent text-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Bottle registry */}
      {tab === 'bottles' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[12px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Store</th>
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Volume</th>
                  <th className="px-4 py-3 text-right font-medium">Remaining</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bottles.map((b) => {
                  const pct = Number(b.volumeMl) > 0 ? (Number(b.remainingMl) / Number(b.volumeMl)) * 100 : 0;
                  return (
                    <tr key={b.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium">{itemsById.get(b.itemId)?.name ?? b.itemId.slice(0, 8) + '…'}</td>
                      <td className="px-4 py-3 text-muted">{storesById.get(b.storeId)?.name ?? b.storeId.slice(0, 8) + '…'}</td>
                      <td className="px-4 py-3 text-muted">{b.batchId ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cx('rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[b.status] ?? '')}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right tnum">{Number(b.volumeMl).toFixed(0)}ml</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-accent">
                            <div
                              className={cx('h-full rounded-full', pct <= 15 ? 'bg-destructive' : 'bg-primary')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="tnum text-[13px]">{Number(b.remainingMl).toFixed(0)}ml</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.status === 'SEALED' && (
                          <Button size="sm" variant="ghost" onClick={() => openBottle(b.id)}>Open</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loading && bottles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">No bottles registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pour log */}
      {tab === 'pours' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[12px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Bottle</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Volume</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pours.map((p) => {
                  const bottle = bottles.find((b) => b.id === p.bottleId);
                  const itemName = bottle ? itemsById.get(bottle.itemId)?.name : undefined;
                  return (
                    <tr key={p.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-mono text-[12px] text-muted">{itemName ?? p.bottleId.slice(0, 8) + '…'}</td>
                      <td className="px-4 py-3">
                        <span className={cx('rounded px-2 py-0.5 text-xs font-medium', POUR_TYPE_COLORS[p.type] ?? '')}>{p.type}</span>
                      </td>
                      <td className="px-4 py-3 text-right tnum">{Number(p.volumeMl).toFixed(1)}ml</td>
                      <td className="px-4 py-3 text-muted">{p.reason ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
                {!loading && pours.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">No pours recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Variance & excise */}
      {tab === 'variance' && (
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Pour variance (last 30 days)</h2>
              <Percent className="h-4 w-4 text-muted" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface text-left text-[12px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 text-right font-medium">Sale</th>
                    <th className="px-4 py-3 text-right font-medium">Waste</th>
                    <th className="px-4 py-3 text-right font-medium">Spillage</th>
                    <th className="px-4 py-3 text-right font-medium">Compl.</th>
                    <th className="px-4 py-3 text-right font-medium">Sample</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">Variance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {variance?.items.map((v) => (
                    <tr key={v.itemId} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium">{itemsById.get(v.itemId)?.name ?? v.itemId.slice(0, 8) + '…'}</td>
                      <td className="px-4 py-3 text-right tnum">{v.saleMl}ml</td>
                      <td className="px-4 py-3 text-right tnum">{v.wasteMl}ml</td>
                      <td className="px-4 py-3 text-right tnum">{v.spillageMl}ml</td>
                      <td className="px-4 py-3 text-right tnum">{v.complimentaryMl}ml</td>
                      <td className="px-4 py-3 text-right tnum">{v.sampleMl}ml</td>
                      <td className="px-4 py-3 text-right tnum font-medium">{v.totalMl}ml</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cx('font-medium', Number(v.variancePct) > 10 ? 'text-destructive' : 'text-success')}>
                          {v.variancePct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!loading && (!variance || variance.items.length === 0) && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted">No pour activity in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Excise summary</h2>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="h-8 rounded-control border border-border bg-surface px-2 text-[13px]"
                />
                <Button size="sm" variant="ghost" onClick={loadVariance}>Refresh</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface text-left text-[12px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 text-right font-medium">Bottles opened</th>
                    <th className="px-4 py-3 text-right font-medium">Sold</th>
                    <th className="px-4 py-3 text-right font-medium">Waste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {excise?.items.map((e) => (
                    <tr key={e.itemId} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium">{itemsById.get(e.itemId)?.name ?? e.itemId.slice(0, 8) + '…'}</td>
                      <td className="px-4 py-3 text-right tnum">{e.bottlesOpened}</td>
                      <td className="px-4 py-3 text-right tnum">{e.soldMl}ml</td>
                      <td className="px-4 py-3 text-right tnum">{e.wasteMl}ml</td>
                    </tr>
                  ))}
                  {!loading && (!excise || excise.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted">No excise activity for {period}.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
