'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Recipe {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  theoreticalCost: string;
  currentVersion: number;
  outputItemId: string | null;
  yieldQty: string;
  ingredients: RecipeIngredient[];
}

interface RecipeIngredient {
  id: string;
  itemId: string | null;
  subRecipeId: string | null;
  qty: string;
  wastagePct: string;
}

interface ProductionOrder {
  id: string;
  number: string;
  recipeId: string;
  storeId: string;
  status: string;
  plannedQty: string;
  producedQty: string | null;
  businessDate: string;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-accent text-muted',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

export default function ProductionPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'recipes' | 'orders'>('recipes');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<{ data: Recipe[] }>('/production/recipes?limit=100')
      .then((r) => setRecipes(r.data))
      .catch(() => undefined);
    api<{ data: ProductionOrder[] }>('/production/orders?limit=50')
      .then((r) => setOrders(r.data))
      .catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  async function createRecipe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await api('/production/recipes', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name')),
          code: String(form.get('code')),
          yieldQty: Number(form.get('yieldQty')) || 1,
          instructions: String(form.get('instructions')) || undefined,
        }),
      });
      setCreating(false);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create recipe');
    } finally {
      setBusy(false);
    }
  }

  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Production</h1>
          <p className="mt-1 text-sm text-muted">
            Recipes, bill of materials, costing, and production orders.
          </p>
        </div>
        {activeTab === 'recipes' && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New recipe
          </Button>
        )}
      </div>

      {creating && activeTab === 'recipes' && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New recipe</h2>
          <form onSubmit={createRecipe} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="name" label="Recipe name" required maxLength={120} />
            <Input name="code" label="Code" required maxLength={30} placeholder="BUTTER-CHICKEN" />
            <Input
              name="yieldQty"
              label="Yield qty"
              type="number"
              min={0.001}
              step="0.001"
              placeholder="1"
            />
            <div className="col-span-full space-y-1.5">
              <label className="block text-[13px] font-medium">Instructions</label>
              <textarea
                name="instructions"
                rows={3}
                maxLength={2000}
                className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm resize-none"
                placeholder="Preparation steps…"
              />
            </div>
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
          { key: 'recipes', label: 'Recipes' },
          { key: 'orders', label: 'Production orders' },
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

      {activeTab === 'recipes' && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Recipe</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Yield</th>
                <th className="px-5 py-3 font-medium">Ingredients</th>
                <th className="px-5 py-3 font-medium text-right">Theoretical cost</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recipes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                    No recipes yet — create your first BOM.
                  </td>
                </tr>
              )}
              {recipes.map((r) => (
                <tr key={r.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-muted shrink-0" />
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-[12px] text-muted font-mono">{r.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] tnum">v{r.currentVersion}</td>
                  <td className="px-5 py-3 text-[13px] tnum">{Number(r.yieldQty).toFixed(3)}</td>
                  <td className="px-5 py-3 text-[13px] tnum text-muted">{r.ingredients.length}</td>
                  <td className="px-5 py-3 tnum text-right">
                    ₹{Number(r.theoreticalCost).toFixed(4)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-[12px] font-medium',
                        r.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {r.isActive ? 'active' : 'inactive'}
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
                <th className="px-5 py-3 font-medium">Order no.</th>
                <th className="px-5 py-3 font-medium">Recipe</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Planned qty</th>
                <th className="px-5 py-3 font-medium text-right">Produced qty</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                    No production orders yet.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-accent/50">
                  <td className="px-5 py-3 font-mono text-[13px] font-medium">{o.number}</td>
                  <td className="px-5 py-3 text-[13px]">
                    {recipeMap.get(o.recipeId)?.name ?? o.recipeId.slice(0, 8)}
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
                  <td className="px-5 py-3 tnum text-right text-[13px]">{Number(o.plannedQty).toFixed(3)}</td>
                  <td className="px-5 py-3 tnum text-right text-[13px]">
                    {o.producedQty != null ? Number(o.producedQty).toFixed(3) : '—'}
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
    </div>
  );
}
