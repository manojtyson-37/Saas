'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building2, ChevronRight, MapPin, Plus, Store } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui/primitives';

interface Company {
  id: string;
  name: string;
  code: string;
  _count: { brands: number; locations: number };
}

interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
  city: string | null;
  company: { id: string; name: string };
  brand: { id: string; name: string } | null;
  _count: { outlets: number; stores: number };
}

const LOCATION_TYPES = [
  'RESTAURANT', 'HOTEL', 'CLOUD_KITCHEN', 'CAFE', 'BAKERY', 'BAR', 'BREWERY',
  'FOOD_COURT_UNIT', 'CATERING_UNIT', 'WAREHOUSE', 'COMMISSARY', 'HEAD_OFFICE',
];

export default function OrganizationPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [creating, setCreating] = useState<'company' | 'location' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<Company[]>('/companies').then(setCompanies).catch(() => undefined);
    api<Location[]>('/locations').then(setLocations).catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      if (creating === 'company') {
        await api('/companies', {
          method: 'POST',
          body: JSON.stringify({
            name: String(form.get('name')),
            legalName: String(form.get('legalName')),
            code: String(form.get('code')),
            taxRegistrationNumber: String(form.get('gstin')) || undefined,
          }),
        });
      } else {
        await api('/locations', {
          method: 'POST',
          body: JSON.stringify({
            companyId: String(form.get('companyId')),
            name: String(form.get('name')),
            code: String(form.get('code')),
            type: String(form.get('type')),
            city: String(form.get('city')) || undefined,
          }),
        });
      }
      setCreating(null);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Organization</h1>
          <p className="mt-1 text-sm text-muted">
            Companies (legal entities), brands, locations and outlets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCreating('location')}>
            <Plus className="h-4 w-4" /> Location
          </Button>
          <Button size="sm" onClick={() => setCreating('company')}>
            <Plus className="h-4 w-4" /> Company
          </Button>
        </div>
      </div>

      {creating && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">
            {creating === 'company' ? 'New company' : 'New location'}
          </h2>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {creating === 'company' ? (
              <>
                <Input name="name" label="Name" required maxLength={120} />
                <Input name="legalName" label="Legal name" required maxLength={200} />
                <Input name="code" label="Code" required maxLength={30} placeholder="ACME-CO" />
                <Input name="gstin" label="GSTIN (optional)" maxLength={30} />
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="companyId" className="block text-[13px] font-medium">Company</label>
                  <select
                    id="companyId"
                    name="companyId"
                    required
                    className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="type" className="block text-[13px] font-medium">Type</label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
                  >
                    {LOCATION_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <Input name="name" label="Name" required maxLength={120} />
                <Input name="code" label="Code" required maxLength={30} placeholder="BLR-02" />
                <Input name="city" label="City (optional)" maxLength={80} />
              </>
            )}
            {error && <p className="col-span-full text-[13px] text-destructive">{error}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy}>Create</Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-muted" /> Companies
          </h2>
          {companies.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No companies yet — create your first legal entity.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {companies.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-[12px] text-muted">{c.code}</p>
                  </div>
                  <p className="tnum text-[13px] text-muted">
                    {c._count.brands} brands · {c._count.locations} locations
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-muted" /> Locations
          </h2>
          {locations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No locations yet — add your first site.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {locations.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-control bg-accent p-1.5 text-muted">
                      <Store className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{l.name}</p>
                      <p className="text-[12px] text-muted">
                        {l.type.replaceAll('_', ' ')}
                        {l.city ? ` · ${l.city}` : ''} · {l.company.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[13px] text-muted">
                    <span className="tnum">{l._count.outlets} outlets</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
