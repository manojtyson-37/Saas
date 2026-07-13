'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CreditCard } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Card, cx } from '@/components/ui/primitives';

interface ModuleState {
  code: string;
  active: boolean;
  alwaysActive: boolean;
}

const MODULE_LABELS: Record<string, { name: string; blurb: string }> = {
  core: { name: 'Core', blurb: 'Organization, users, audit' },
  pos: { name: 'POS', blurb: 'Billing, tables, KOT, cash sessions' },
  hotel: { name: 'Hotel', blurb: 'Reservations, front desk, housekeeping' },
  inventory: { name: 'Inventory', blurb: 'Stock, transfers, counts, batches' },
  procurement: { name: 'Procurement', blurb: 'Vendors, PO, GRN, invoices' },
  production: { name: 'Kitchen Production', blurb: 'Recipes, BOM, prep' },
  bar: { name: 'Bar', blurb: 'Bottle tracking, pegs, variance' },
  crm: { name: 'CRM & Loyalty', blurb: 'Customers, wallet, campaigns' },
  accounting: { name: 'Accounting', blurb: 'Ledger, GST, banking, P&L' },
  hr: { name: 'HR & Payroll', blurb: 'Attendance, shifts, payroll' },
  assets: { name: 'Assets', blurb: 'Register, depreciation, AMC' },
  reporting: { name: 'Reports & Dashboards', blurb: 'Realtime analytics' },
  ai: { name: 'AI Intelligence', blurb: 'Forecasts, anomalies, NL analytics' },
  integrations: { name: 'Integrations', blurb: 'Payments, aggregators, messaging' },
};

export default function SettingsPage() {
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<ModuleState[]>('/settings/modules').then(setModules).catch((e) =>
      setError(((e as { api?: ApiError }).api?.message as string) ?? 'Failed to load'),
    );
  }, []);

  useEffect(refresh, [refresh]);

  async function toggle(moduleCode: string, active: boolean) {
    setModules((prev) => prev.map((m) => (m.code === moduleCode ? { ...m, active } : m)));
    try {
      await api('/settings/modules', {
        method: 'PUT',
        body: JSON.stringify({ moduleCode, active }),
      });
    } catch {
      refresh(); // roll back the optimistic flip
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Modules — activate only what you use; pricing follows activation.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <Link href="/settings/billing">
        <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <div className="rounded-control bg-accent p-2 text-muted">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Billing &amp; plan</p>
              <p className="mt-0.5 text-[13px] text-muted">
                View your subscription, trial status and upgrade options
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted" />
        </Card>
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const meta = MODULE_LABELS[mod.code] ?? { name: mod.code, blurb: '' };
          return (
            <Card key={mod.code} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{meta.name}</p>
                <p className="mt-0.5 text-[13px] text-muted">{meta.blurb}</p>
              </div>
              <button
                role="switch"
                aria-checked={mod.active}
                disabled={mod.alwaysActive}
                onClick={() => toggle(mod.code, !mod.active)}
                className={cx(
                  'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors',
                  mod.active ? 'bg-primary' : 'bg-border',
                  mod.alwaysActive && 'opacity-50',
                )}
              >
                <span
                  className={cx(
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                    mod.active ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
