'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface PosOrder {
  id: string;
  number: string | null;
  status: string;
  channel: string;
  outletId: string;
  totalAmount: string;
  subtotal: string;
  businessDate: string;
  createdAt: string;
  tableId: string | null;
  guestCount: number | null;
}

interface CashSession {
  id: string;
  terminalId: string;
  outletId: string;
  status: string;
  openingFloat: string;
  expectedCash: string | null;
  countedCash: string | null;
  overShort: string | null;
  openedAt: string;
  closedAt: string | null;
  businessDate: string;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-accent text-muted',
  PLACED: 'bg-primary/10 text-primary',
  IN_KITCHEN: 'bg-warning/10 text-warning',
  SERVED: 'bg-blue-500/10 text-blue-600',
  BILLED: 'bg-purple-500/10 text-purple-600',
  SETTLED: 'bg-success/10 text-success',
  CANCELLED: 'bg-accent text-muted',
  VOIDED: 'bg-destructive/10 text-destructive',
};

const CHANNEL_LABELS: Record<string, string> = {
  DINE_IN: 'Dine-in',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery',
  QR: 'QR',
  ROOM_SERVICE: 'Room service',
  BANQUET: 'Banquet',
  SWIGGY: 'Swiggy',
  ZOMATO: 'Zomato',
  UBER_EATS: 'Uber Eats',
};

const SESSION_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-success/10 text-success',
  CLOSED: 'bg-accent text-muted',
};

const CHANNELS = [
  'DINE_IN', 'TAKEAWAY', 'DELIVERY', 'QR', 'ROOM_SERVICE', 'BANQUET',
  'SWIGGY', 'ZOMATO', 'UBER_EATS',
];

export default function PosPage() {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'sessions'>('orders');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<{ data: PosOrder[] }>('/pos/orders?limit=50')
      .then((r) => setOrders(r.data))
      .catch(() => undefined);
    api<CashSession[]>('/pos/sessions')
      .then(setSessions)
      .catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  async function createOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/pos/orders', {
        method: 'POST',
        body: JSON.stringify({
          outletId: String(form.get('outletId')),
          companyId: String(form.get('companyId')),
          channel: String(form.get('channel')),
          guestCount: Number(form.get('guestCount')) || undefined,
          businessDate: new Date().toISOString().split('T')[0],
        }),
      });
      setCreating(false);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Point of Sale</h1>
          <p className="mt-1 text-sm text-muted">
            Orders, KOTs, payments, cash sessions and settlement.
          </p>
        </div>
        {activeTab === 'orders' && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New order
          </Button>
        )}
      </div>

      {creating && activeTab === 'orders' && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New POS order</h2>
          <form onSubmit={createOrder} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="outletId" label="Outlet ID" required placeholder="UUID of outlet" />
            <Input name="companyId" label="Company ID" required placeholder="UUID of company" />
            <div className="space-y-1.5">
              <label htmlFor="channel" className="block text-[13px] font-medium">Channel</label>
              <select
                id="channel"
                name="channel"
                required
                className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{CHANNEL_LABELS[c] ?? c}</option>
                ))}
              </select>
            </div>
            <Input
              name="guestCount"
              label="Guest count"
              type="number"
              min={1}
              placeholder="2"
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
        {([
          { key: 'orders', label: 'Orders' },
          { key: 'sessions', label: 'Cash sessions' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cx(
              'rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors',
              activeTab === tab.key ? 'bg-surface shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                    No orders yet — create your first POS order.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted shrink-0" />
                      <div>
                        <p className="font-mono text-[13px] font-medium">
                          {o.number ?? o.id.slice(0, 8) + '…'}
                        </p>
                        {o.guestCount != null && (
                          <p className="text-[12px] text-muted">{o.guestCount} guest{o.guestCount !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-muted">
                    {CHANNEL_LABELS[o.channel] ?? o.channel}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-[12px] font-medium',
                        ORDER_STATUS_COLORS[o.status] ?? 'bg-accent text-muted',
                      )}
                    >
                      {o.status.replaceAll('_', ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 tnum text-right text-[13px]">
                    {Number(o.totalAmount) > 0
                      ? `₹${Number(o.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted">
                    {new Date(o.businessDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'sessions' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Terminal</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Opening float</th>
                <th className="px-5 py-3 font-medium text-right">Over/short</th>
                <th className="px-5 py-3 font-medium">Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                    No cash sessions yet — open a session from a POS terminal.
                  </td>
                </tr>
              )}
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3 font-mono text-[13px]">{s.terminalId.slice(0, 8)}…</td>
                  <td className="px-5 py-3">
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-[12px] font-medium',
                        SESSION_STATUS_COLORS[s.status] ?? 'bg-accent text-muted',
                      )}
                    >
                      {s.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 tnum text-right text-[13px]">
                    ₹{Number(s.openingFloat).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 tnum text-right text-[13px]">
                    {s.overShort != null ? (
                      <span className={Number(s.overShort) < 0 ? 'text-destructive' : ''}>
                        {Number(s.overShort) >= 0 ? '+' : ''}₹{Number(s.overShort).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted">
                    {new Date(s.openedAt).toLocaleString()}
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
