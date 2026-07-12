'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FileText, Plus, ShoppingCart, Truck } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Vendor {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  city: string | null;
  paymentTermsDays: number;
  _count: { items: number };
}

interface PurchaseOrder {
  id: string;
  number: string;
  status: string;
  totalAmount: string;
  vendorId: string;
  createdAt: string;
}

interface GoodsReceipt {
  id: string;
  number: string;
  status: string;
  vendorId: string;
  receivedAt: string;
}

const PO_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-accent text-muted',
  PENDING_APPROVAL: 'bg-warning/10 text-warning',
  APPROVED: 'bg-primary/10 text-primary',
  SENT: 'bg-blue-500/10 text-blue-600',
  PARTIALLY_RECEIVED: 'bg-warning/10 text-warning',
  RECEIVED: 'bg-success/10 text-success',
  CLOSED: 'bg-accent text-muted',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

const GRN_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-accent text-muted',
  POSTED: 'bg-success/10 text-success',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

export default function ProcurementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceipt[]>([]);
  const [activeTab, setActiveTab] = useState<'vendors' | 'orders' | 'receipts'>('vendors');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<{ data: Vendor[] }>('/procurement/vendors?limit=100').then((r) => setVendors(r.data)).catch(() => undefined);
    api<{ data: PurchaseOrder[] }>('/procurement/purchase-orders?limit=50').then((r) => setPos(r.data)).catch(() => undefined);
    api<{ data: GoodsReceipt[] }>('/procurement/goods-receipts?limit=50').then((r) => setGrns(r.data)).catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  async function createVendor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/procurement/vendors', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name')),
          code: String(form.get('code')),
          email: String(form.get('email')) || undefined,
          phone: String(form.get('phone')) || undefined,
          city: String(form.get('city')) || undefined,
          paymentTermsDays: Number(form.get('paymentTermsDays')) || 0,
        }),
      });
      setCreating(false);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create vendor');
    } finally {
      setBusy(false);
    }
  }

  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Procurement</h1>
          <p className="mt-1 text-sm text-muted">
            Vendors, purchase requests, purchase orders, GRNs and invoices.
          </p>
        </div>
        {activeTab === 'vendors' && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New vendor
          </Button>
        )}
      </div>

      {creating && activeTab === 'vendors' && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New vendor</h2>
          <form onSubmit={createVendor} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="name" label="Vendor name" required maxLength={120} />
            <Input name="code" label="Code" required maxLength={30} placeholder="ACME-VND" />
            <Input name="email" label="Email" type="email" maxLength={200} />
            <Input name="phone" label="Phone" maxLength={30} />
            <Input name="city" label="City" maxLength={80} />
            <Input
              name="paymentTermsDays"
              label="Payment terms (days)"
              type="number"
              min={0}
              max={365}
              placeholder="30"
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
          { key: 'vendors', label: 'Vendors' },
          { key: 'orders', label: 'Purchase orders' },
          { key: 'receipts', label: 'Goods receipts' },
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

      {activeTab === 'vendors' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Payment terms</th>
                <th className="px-5 py-3 font-medium">Items catalogued</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                    No vendors yet — add your first supplier.
                  </td>
                </tr>
              )}
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3">
                    <p className="font-medium">{v.name}</p>
                    <p className="text-[12px] text-muted font-mono">{v.code}</p>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-muted">{v.city ?? '—'}</td>
                  <td className="px-5 py-3 text-[13px]">
                    {v.paymentTermsDays === 0 ? 'Immediate' : `Net ${v.paymentTermsDays}`}
                  </td>
                  <td className="px-5 py-3 tnum text-[13px] text-muted">{v._count.items}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-[12px] font-medium',
                        v.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {v.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'orders' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">PO number</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                    No purchase orders yet.
                  </td>
                </tr>
              )}
              {pos.map((po) => (
                <tr key={po.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3 font-mono text-[13px] font-medium">{po.number}</td>
                  <td className="px-5 py-3 text-[13px]">
                    {vendorMap.get(po.vendorId)?.name ?? po.vendorId.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-[12px] font-medium',
                        PO_STATUS_COLORS[po.status] ?? 'bg-accent text-muted',
                      )}
                    >
                      {po.status.replaceAll('_', ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 tnum text-right">
                    ₹{Number(po.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'receipts' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">GRN number</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                    No goods receipts yet — create a GRN when goods arrive.
                  </td>
                </tr>
              )}
              {grns.map((grn) => (
                <tr key={grn.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3 font-mono text-[13px] font-medium">{grn.number}</td>
                  <td className="px-5 py-3 text-[13px]">
                    {vendorMap.get(grn.vendorId)?.name ?? grn.vendorId.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-[12px] font-medium',
                        GRN_STATUS_COLORS[grn.status] ?? 'bg-accent text-muted',
                      )}
                    >
                      {grn.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted">
                    {new Date(grn.receivedAt).toLocaleDateString()}
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
