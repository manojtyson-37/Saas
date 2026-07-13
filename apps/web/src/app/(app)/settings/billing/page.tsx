'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { billingApi, type ApiError, type Plan, type Subscription } from '@/lib/api';
import { Button, Card, cx } from '@/components/ui/primitives';

const MODULE_NAMES: Record<string, string> = {
  core: 'Core',
  pos: 'POS',
  hotel: 'Hotel PMS',
  inventory: 'Inventory',
  procurement: 'Procurement',
  production: 'Kitchen Production',
  bar: 'Bar',
  crm: 'CRM & Loyalty',
  accounting: 'Accounting',
  hr: 'HR & Payroll',
  assets: 'Assets',
  reporting: 'Reports & Dashboards',
  ai: 'AI Intelligence',
  integrations: 'Integrations',
};

const STATUS_STYLES: Record<string, string> = {
  TRIAL: 'bg-warning/10 text-warning',
  ACTIVE: 'bg-success/10 text-success',
  SUSPENDED: 'bg-destructive/10 text-destructive',
  CHURNED: 'bg-destructive/10 text-destructive',
};

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [changingTo, setChangingTo] = useState<string | null>(null);

  const refresh = useCallback(() => {
    Promise.all([billingApi.getSubscription(), billingApi.getPlans()])
      .then(([sub, planList]) => {
        setSubscription(sub);
        setPlans(planList);
      })
      .catch((e) => setError(((e as { api?: ApiError }).api?.message as string) ?? 'Failed to load'));
  }, []);

  useEffect(refresh, [refresh]);

  async function choosePlan(planCode: string) {
    setChangingTo(planCode);
    setError(null);
    try {
      const updated = await billingApi.changePlan(planCode);
      setSubscription(updated);
    } catch (e) {
      setError(((e as { api?: ApiError }).api?.message as string) ?? 'Could not change plan');
    } finally {
      setChangingTo(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Billing &amp; plan</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your subscription — pick the plan that matches the modules you run.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <Card>
        {subscription ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  Current plan — {subscription.plan?.name ?? subscription.planCode}
                </p>
                <span
                  className={cx(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                    STATUS_STYLES[subscription.status] ?? 'bg-accent text-muted',
                  )}
                >
                  {subscription.status}
                </span>
              </div>
              {subscription.status === 'TRIAL' && (
                <p className="mt-1 text-[13px] text-muted">
                  {subscription.trialDaysRemaining ?? 0} day
                  {(subscription.trialDaysRemaining ?? 0) === 1 ? '' : 's'} left in your trial
                  {subscription.trialEndsAt
                    ? ` (ends ${new Date(subscription.trialEndsAt).toLocaleDateString()})`
                    : ''}
                  .
                </p>
              )}
              {subscription.plan && (
                <p className="mt-1 text-[13px] text-muted">
                  {subscription.plan.priceInrMonthly === 0
                    ? 'Free'
                    : `${inr.format(subscription.plan.priceInrMonthly)}/month`}{' '}
                  · {subscription.plan.limits.maxLocations ?? 'Unlimited'} location
                  {subscription.plan.limits.maxLocations === 1 ? '' : 's'} ·{' '}
                  {subscription.plan.limits.maxUsers ?? 'Unlimited'} users
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-16 animate-pulse rounded-control bg-accent" />
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.planCode === plan.code;
          const modules = ['core', 'reporting', ...plan.moduleCodes];
          return (
            <Card
              key={plan.code}
              className={cx('flex flex-col gap-4', isCurrent && 'border-primary ring-1 ring-primary/30')}
            >
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="tnum mt-1 text-2xl font-semibold">
                  {plan.priceInrMonthly === 0 ? 'Free' : inr.format(plan.priceInrMonthly)}
                  {plan.priceInrMonthly !== 0 && (
                    <span className="text-sm font-normal text-muted">/month</span>
                  )}
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {plan.limits.maxLocations ?? 'Unlimited'} location
                  {plan.limits.maxLocations === 1 ? '' : 's'} ·{' '}
                  {plan.limits.maxUsers ?? 'Unlimited'} users · {plan.trialDays}-day trial
                </p>
              </div>

              <ul className="flex-1 space-y-1.5">
                {modules.map((code) => (
                  <li key={code} className="flex items-center gap-2 text-[13px]">
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    {MODULE_NAMES[code] ?? code}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent || (changingTo !== null && changingTo !== plan.code)}
                loading={changingTo === plan.code}
                onClick={() => choosePlan(plan.code)}
                className="w-full"
              >
                {isCurrent ? 'Current plan' : 'Choose plan'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
