'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Wallet, Gift, Tag, Megaphone } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Customer {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  walletBalance: string;
  loyaltyPoints: string;
  loyaltyTier: string | null;
  totalVisits: number;
  totalSpend: string;
  marketingOptIn: boolean;
  tags: string[];
}

interface GiftCard {
  id: string;
  code: string;
  initialValue: string;
  balance: string;
  status: string;
  expiresAt: string | null;
}

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: string;
  usageCount: number;
  usageLimit: number | null;
  validTo: string | null;
  isActive: boolean;
}

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  sentCount: number;
  scheduledAt: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REDEEMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SMS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EMAIL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

type Tab = 'customers' | 'gift-cards' | 'coupons' | 'campaigns';

export default function CrmPage() {
  const [tab, setTab] = useState<Tab>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [giftCards] = useState<GiftCard[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCustomers = useCallback(async (q?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const data = await api<Customer[]>(`/crm/customers?${params}`);
      setCustomers(data);
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Coupon[]>('/crm/coupons');
      setCoupons(data);
    } catch {
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Campaign[]>('/crm/campaigns');
      setCampaigns(data);
    } catch {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'customers') loadCustomers();
    else if (tab === 'coupons') loadCoupons();
    else if (tab === 'campaigns') loadCampaigns();
  }, [tab, loadCustomers, loadCoupons, loadCampaigns]);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'gift-cards', label: 'Gift Cards', icon: Gift },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">CRM</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted hover:text-foreground',
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

      {/* Customers tab */}
      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search by name, phone or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadCustomers(search)}
              className="max-w-xs"
            />
            <Button onClick={() => loadCustomers(search)} disabled={loading}>
              Search
            </Button>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-right font-medium">Wallet</th>
                    <th className="px-4 py-3 text-right font-medium">Points</th>
                    <th className="px-4 py-3 text-left font-medium">Tier</th>
                    <th className="px-4 py-3 text-right font-medium">Visits</th>
                    <th className="px-4 py-3 text-right font-medium">Total Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium">
                        {c.firstName} {c.lastName ?? ''}
                      </td>
                      <td className="px-4 py-3 text-muted">{c.phone ?? '-'}</td>
                      <td className="px-4 py-3 text-muted">{c.email ?? '-'}</td>
                      <td className="px-4 py-3 text-right">₹{Number(c.walletBalance).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{Number(c.loyaltyPoints).toFixed(0)}</td>
                      <td className="px-4 py-3">
                        {c.loyaltyTier ? (
                          <span className="rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {c.loyaltyTier}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{c.totalVisits}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{Number(c.totalSpend).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {!loading && customers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted">
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Gift Cards tab */}
      {tab === 'gift-cards' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-right font-medium">Initial Value</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {giftCards.map((gc) => (
                  <tr key={gc.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono font-medium">{gc.code}</td>
                    <td className="px-4 py-3 text-right">₹{Number(gc.initialValue).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(gc.balance).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={cx('rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[gc.status] ?? '')}>
                        {gc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {gc.expiresAt ? new Date(gc.expiresAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {giftCards.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No gift cards. Search by code via the API.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Coupons tab */}
      {tab === 'coupons' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Value</th>
                  <th className="px-4 py-3 text-right font-medium">Used / Limit</th>
                  <th className="px-4 py-3 text-left font-medium">Valid To</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                    <td className="px-4 py-3">
                      <span className="rounded px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.usageCount} / {c.usageLimit ?? '∞'}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.validTo ? new Date(c.validTo).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {!loading && coupons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No active coupons
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Campaigns tab */}
      {tab === 'campaigns' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Sent Count</th>
                  <th className="px-4 py-3 text-left font-medium">Scheduled</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={cx('rounded px-2 py-0.5 text-xs font-medium', CHANNEL_COLORS[c.channel] ?? '')}>
                        {c.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cx('rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[c.status] ?? '')}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{c.sentCount}</td>
                    <td className="px-4 py-3 text-muted">
                      {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!loading && campaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No campaigns
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
