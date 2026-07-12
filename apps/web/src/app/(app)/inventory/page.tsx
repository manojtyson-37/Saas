'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Package, Plus, TrendingDown } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Uom {
  id: string;
  code: string;
  name: string;
}

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  standardCost: string;
  categoryName: string | null;
  stockSummaries?: StockSummary[];
}

interface StockSummary {
  id: string;
  storeId: string;
  itemId: string;
  onHand: string;
  avgCost: string;
}

interface PaginatedItems {
  data: InventoryItem[];
  nextCursor: string | null;
}

const ITEM_TYPE_COLORS: Record<string, string> = {
  RAW_MATERIAL: 'bg-primary/10 text-primary',
  BEVERAGE: 'bg-blue-500/10 text-blue-600',
  LIQUOR: 'bg-purple-500/10 text-purple-600',
  FINISHED_GOOD: 'bg-success/10 text-success',
  PACKAGING: 'bg-warning/10 text-warning',
};

const ITEM_TYPES = [
  'RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING',
  'LIQUOR', 'BEVERAGE', 'HOTEL_SUPPLY', 'CLEANING_SUPPLY', 'STATIONERY', 'ASSET_ITEM',
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'stock'>('items');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stockSummaries, setStockSummaries] = useState<StockSummary[]>([]);

  const refresh = useCallback(() => {
    api<PaginatedItems>('/inventory/items?limit=50').then((r) => {
      setItems(r.data);
      setNextCursor(r.nextCursor);
    }).catch(() => undefined);
    api<Uom[]>('/inventory/uoms').then(setUoms).catch(() => undefined);
    api<StockSummary[]>('/inventory/stock').then(setStockSummaries).catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  const filteredItems = search
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.code.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  async function createItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/inventory/items', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name')),
          code: String(form.get('code')),
          type: String(form.get('type')),
          baseUomId: String(form.get('baseUomId')),
          categoryName: String(form.get('categoryName')) || undefined,
          standardCost: Number(form.get('standardCost')) || 0,
        }),
      });
      setCreating(false);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create item');
    } finally {
      setBusy(false);
    }
  }

  // Group stock summaries by itemId
  const stockByItem = new Map<string, StockSummary[]>();
  for (const s of stockSummaries) {
    const arr = stockByItem.get(s.itemId) ?? [];
    arr.push(s);
    stockByItem.set(s.itemId, arr);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="mt-1 text-sm text-muted">
            Item master, stock on hand, transfers, adjustments and cycle counts.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New item
        </Button>
      </div>

      {creating && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New inventory item</h2>
          <form onSubmit={createItem} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="name" label="Name" required maxLength={120} />
            <Input name="code" label="Code" required maxLength={30} placeholder="TOMATO-LOCAL" />
            <div className="space-y-1.5">
              <label htmlFor="type" className="block text-[13px] font-medium">Type</label>
              <select
                id="type"
                name="type"
                required
                className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="baseUomId" className="block text-[13px] font-medium">Base UoM</label>
              <select
                id="baseUomId"
                name="baseUomId"
                required
                className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
              >
                {uoms.map((u) => (
                  <option key={u.id} value={u.id}>{u.code} — {u.name}</option>
                ))}
              </select>
            </div>
            <Input name="categoryName" label="Category (freeform)" maxLength={80} />
            <Input
              name="standardCost"
              label="Standard cost"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
            />
            {error && <p className="col-span-full text-[13px] text-destructive">{error}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy}>Create</Button>
              <Button type="button" variant="ghost" onClick={() => { setCreating(false); setError(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-control border border-border bg-accent p-1 w-fit">
        {(['items', 'stock'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cx(
              'rounded-[6px] px-3 py-1.5 text-[13px] font-medium capitalize transition-colors',
              activeTab === tab ? 'bg-surface shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            {tab === 'stock' ? 'Stock on hand' : 'Item master'}
          </button>
        ))}
      </div>

      {activeTab === 'items' && (
        <>
          <div className="max-w-xs">
            <Input
              label=""
              placeholder="Search by name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium text-right">Std. cost</th>
                  <th className="px-5 py-3 font-medium text-right">On hand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                      No inventory items yet — create your first item.
                    </td>
                  </tr>
                )}
                {filteredItems.map((item) => {
                  const summaries = stockByItem.get(item.id) ?? [];
                  const totalOnHand = summaries.reduce(
                    (acc, s) => acc + Number(s.onHand),
                    0,
                  );
                  return (
                    <tr key={item.id} className="hover:bg-accent/50">
                      <td className="px-5 py-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[12px] text-muted font-mono">{item.code}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cx(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            ITEM_TYPE_COLORS[item.type] ?? 'bg-accent text-muted',
                          )}
                        >
                          {item.type.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-muted">{item.categoryName ?? '—'}</td>
                      <td className="px-5 py-3 tnum text-right text-[13px]">
                        ₹{Number(item.standardCost).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 tnum text-right">
                        <span
                          className={cx(
                            'text-[13px] font-medium',
                            totalOnHand === 0 ? 'text-destructive' : 'text-success',
                          )}
                        >
                          {totalOnHand.toFixed(3)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {nextCursor && (
              <div className="border-t border-border px-5 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    api<PaginatedItems>(`/inventory/items?limit=50&cursor=${nextCursor}`)
                      .then((r) => {
                        setItems((prev) => [...prev, ...r.data]);
                        setNextCursor(r.nextCursor);
                      })
                      .catch(() => undefined)
                  }
                >
                  Load more
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'stock' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Store</th>
                <th className="px-5 py-3 font-medium text-right">On hand</th>
                <th className="px-5 py-3 font-medium text-right">Avg cost</th>
                <th className="px-5 py-3 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stockSummaries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                    No stock posted yet — post opening stock or receive a GRN to see data here.
                  </td>
                </tr>
              )}
              {stockSummaries.map((s) => {
                const item = items.find((i) => i.id === s.itemId);
                const value = Number(s.onHand) * Number(s.avgCost);
                const isLow = Number(s.onHand) <= 0;
                return (
                  <tr key={s.id} className="hover:bg-accent/50">
                    <td className="px-5 py-3">
                      {item ? (
                        <>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-[12px] text-muted font-mono">{item.code}</p>
                        </>
                      ) : (
                        <p className="text-[13px] text-muted font-mono">{s.itemId.slice(0, 8)}…</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-muted font-mono">{s.storeId.slice(0, 8)}…</td>
                    <td className="px-5 py-3 tnum text-right">
                      <span className={cx('font-medium', isLow ? 'text-destructive' : '')}>
                        {Number(s.onHand).toFixed(3)}
                        {isLow && <TrendingDown className="ml-1 inline h-3 w-3" />}
                      </span>
                    </td>
                    <td className="px-5 py-3 tnum text-right text-[13px]">
                      ₹{Number(s.avgCost).toFixed(4)}
                    </td>
                    <td className="px-5 py-3 tnum text-right text-[13px] font-medium">
                      ₹{value.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
