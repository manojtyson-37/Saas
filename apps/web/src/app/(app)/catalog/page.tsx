'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ChefHat, Plus, Tag, Layers } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Category {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  _count: { items: number };
}

interface Variant {
  id: string;
  name: string;
  basePrice: string;
  isDefault: boolean;
  isActive: boolean;
}

interface MenuItem {
  id: string;
  code: string;
  name: string;
  dietaryType: 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';
  isAvailable: boolean;
  isSellable: boolean;
  category: { id: string; name: string };
  variants: Variant[];
}

interface PaginatedItems {
  data: MenuItem[];
  nextCursor: string | null;
}

const DIETARY_COLORS: Record<string, string> = {
  VEG: 'bg-success/10 text-success',
  NON_VEG: 'bg-destructive/10 text-destructive',
  EGG: 'bg-warning/10 text-warning',
  VEGAN: 'bg-success/20 text-success',
};

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [creating, setCreating] = useState<'category' | 'item' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const refresh = useCallback(() => {
    api<Category[]>('/catalog/categories').then(setCategories).catch(() => undefined);
    api<PaginatedItems>('/catalog/items?limit=50').then((r) => {
      setItems(r.data);
      setNextCursor(r.nextCursor);
    }).catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  const filteredItems = search
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.code.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  async function submitCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/catalog/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name')),
          code: String(form.get('code')),
        }),
      });
      setCreating(null);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create category');
    } finally {
      setBusy(false);
    }
  }

  async function submitItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/catalog/items', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: String(form.get('categoryId')),
          name: String(form.get('name')),
          code: String(form.get('code')),
          dietaryType: String(form.get('dietaryType')),
          variants: [
            {
              name: String(form.get('variantName')) || 'Regular',
              basePrice: Number(form.get('basePrice')),
              isDefault: true,
            },
          ],
        }),
      });
      setCreating(null);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create item');
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    try {
      await api(`/catalog/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)),
      );
    } catch {
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Catalog</h1>
          <p className="mt-1 text-sm text-muted">
            Menu items, variants, modifiers and price lists for POS and QR ordering.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCreating('category')}>
            <Plus className="h-4 w-4" /> Category
          </Button>
          <Button size="sm" onClick={() => setCreating('item')}>
            <Plus className="h-4 w-4" /> Item
          </Button>
        </div>
      </div>

      {creating === 'category' && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New category</h2>
          <form onSubmit={submitCategory} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="name" label="Name" required maxLength={80} />
            <Input name="code" label="Code" required maxLength={30} placeholder="BEVERAGES" />
            {error && <p className="col-span-full text-[13px] text-destructive">{error}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy}>Create</Button>
              <Button type="button" variant="ghost" onClick={() => { setCreating(null); setError(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {creating === 'item' && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New menu item</h2>
          <form onSubmit={submitItem} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="categoryId" className="block text-[13px] font-medium">Category</label>
              <select
                id="categoryId"
                name="categoryId"
                required
                className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dietaryType" className="block text-[13px] font-medium">Dietary type</label>
              <select
                id="dietaryType"
                name="dietaryType"
                className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
              >
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-Veg</option>
                <option value="EGG">Egg</option>
                <option value="VEGAN">Vegan</option>
              </select>
            </div>
            <Input name="name" label="Item name" required maxLength={120} />
            <Input name="code" label="Code" required maxLength={30} placeholder="MASALA-CHAI" />
            <Input name="variantName" label="Variant name" placeholder="Regular" maxLength={80} />
            <Input
              name="basePrice"
              label="Base price"
              type="number"
              required
              min={0}
              step="0.01"
              placeholder="0.00"
            />
            {error && <p className="col-span-full text-[13px] text-destructive">{error}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy}>Create</Button>
              <Button type="button" variant="ghost" onClick={() => { setCreating(null); setError(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-control border border-border bg-accent p-1 w-fit">
        {(['items', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cx(
              'rounded-[6px] px-3 py-1.5 text-[13px] font-medium capitalize transition-colors',
              activeTab === tab ? 'bg-surface shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            {tab}
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
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Variants</th>
                  <th className="px-5 py-3 font-medium">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                      No items yet — create your first menu item.
                    </td>
                  </tr>
                )}
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cx(
                            'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                            DIETARY_COLORS[item.dietaryType],
                          )}
                        >
                          {item.dietaryType === 'NON_VEG' ? 'NV' : item.dietaryType.slice(0, 3)}
                        </span>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-[12px] text-muted font-mono">{item.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted">{item.category.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.variants.filter((v) => v.isActive).map((v) => (
                          <span key={v.id} className="rounded-full bg-accent px-2 py-0.5 text-[12px]">
                            {v.name} · ₹{Number(v.basePrice).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        role="switch"
                        aria-checked={item.isAvailable}
                        onClick={() => toggleAvailability(item)}
                        className={cx(
                          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                          item.isAvailable ? 'bg-primary' : 'bg-border',
                        )}
                      >
                        <span
                          className={cx(
                            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                            item.isAvailable ? 'translate-x-4' : 'translate-x-0.5',
                          )}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nextCursor && (
              <div className="border-t border-border px-5 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    api<PaginatedItems>(`/catalog/items?limit=50&cursor=${nextCursor}`)
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

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length === 0 && (
            <Card>
              <p className="py-6 text-center text-sm text-muted">No categories yet.</p>
            </Card>
          )}
          {categories.map((cat) => (
            <Card key={cat.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-control bg-accent p-1.5 text-muted">
                  <Tag className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-[12px] text-muted">{cat.code}</p>
                </div>
              </div>
              <span className="tnum text-[13px] text-muted">{cat._count.items} items</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
