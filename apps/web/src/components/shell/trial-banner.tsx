'use client';

import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { cx } from '@/components/ui/primitives';
import type { Subscription } from '@/lib/api';

/** Shown at the top of the authenticated shell while the tenant is on a trial. */
export function TrialBanner({ subscription }: { subscription: Subscription | null }) {
  if (!subscription || subscription.status !== 'TRIAL') return null;

  const days = subscription.trialDaysRemaining ?? 0;
  const urgent = days <= 3;

  return (
    <div
      className={cx(
        'flex h-9 items-center justify-center gap-2 border-b px-4 text-[13px] font-medium',
        urgent
          ? 'border-warning/30 bg-warning/10 text-warning'
          : 'border-border bg-accent text-muted',
      )}
    >
      <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
      <span>
        {days} day{days === 1 ? '' : 's'} left in your trial —{' '}
        <Link href="/settings/billing" className="font-semibold underline underline-offset-2">
          Upgrade
        </Link>
      </span>
    </div>
  );
}
