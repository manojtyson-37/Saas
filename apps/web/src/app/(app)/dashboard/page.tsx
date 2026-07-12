'use client';

import { useEffect, useState } from 'react';
import { Building2, MapPin, Store, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/primitives';

interface Counts {
  companies: number;
  locations: number;
  outlets: number;
  users: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<unknown[]>('/companies'),
      api<unknown[]>('/locations'),
      api<unknown[]>('/outlets'),
      api<{ data: unknown[] }>('/users?limit=200'),
      api<{ data: AuditEntry[] }>('/audit-logs?limit=10'),
    ])
      .then(([companies, locations, outlets, users, audit]) => {
        setCounts({
          companies: companies.length,
          locations: locations.length,
          outlets: outlets.length,
          users: users.data.length,
        });
        setActivity(audit.data);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const tiles = [
    { label: 'Companies', value: counts?.companies, icon: Building2 },
    { label: 'Locations', value: counts?.locations, icon: MapPin },
    { label: 'Outlets', value: counts?.outlets, icon: Store },
    { label: 'Team members', value: counts?.users, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Your organization at a glance. Sales, food cost and cash KPIs light up as the POS,
          inventory and accounting modules come online (see the roadmap in docs/07).
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card key={tile.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-muted">{tile.label}</p>
                  <p className="tnum mt-1 text-2xl font-semibold">
                    {tile.value ?? <span className="inline-block h-7 w-10 animate-pulse rounded bg-accent" />}
                  </p>
                </div>
                <div className="rounded-control bg-accent p-2 text-muted">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <p className="mb-3 mt-0.5 text-[13px] text-muted">
          Every mutation in the platform is audited — this feed reads the live trail.
        </p>
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No activity yet</p>
        ) : (
          <ul className="divide-y divide-border">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[12px] font-medium text-muted">
                    {entry.entityType}
                  </span>
                  <span className="font-mono text-[13px]">{entry.action}</span>
                </div>
                <time className="tnum text-[12px] text-muted">
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
