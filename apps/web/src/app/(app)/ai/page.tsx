'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Brain, Send, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

// ─── Query ────────────────────────────────────────────────────────────────────

interface QueryResponse {
  question: string;
  fromDate: string;
  toDate: string;
  data: Record<string, unknown>;
}

const SUGGESTIONS = [
  'What is our revenue this month?',
  'How many orders this month?',
  'What are the top selling items?',
  'Which items are low on stock?',
  'What is the payroll cost this period?',
];

// ─── Forecast ─────────────────────────────────────────────────────────────────

interface RevenuePoint {
  period: string;
  revenue: string;
}

interface ForecastPoint {
  period: string;
  projectedRevenue: string;
}

interface ForecastResponse {
  granularity: string;
  historical: RevenuePoint[];
  forecast: ForecastPoint[];
}

// ─── Anomalies ────────────────────────────────────────────────────────────────

interface Anomaly {
  date: string;
  revenue: string;
  zScore: string;
  type: 'SPIKE' | 'DIP';
}

interface AnomalyResponse {
  fromDate?: string;
  toDate?: string;
  mean?: string;
  stdDev?: string;
  anomalies: Anomaly[];
  message?: string;
}

function labelize(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

/** Renders an arbitrary JSON-ish value returned by the NL query endpoint. */
function ResultValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted">—</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted">None</span>;
    if (typeof value[0] === 'object' && value[0] !== null) {
      const columns = Object.keys(value[0] as Record<string, unknown>);
      return (
        <div className="overflow-x-auto rounded-control border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-[12px] uppercase tracking-wide text-muted">
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2 font-medium">{labelize(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(value as Record<string, unknown>[]).map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2">{String(row[c] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return <span>{value.map(String).join(', ')}</span>;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[12px] uppercase tracking-wide text-muted">{labelize(k)}</dt>
            <dd className="text-sm font-medium">
              {typeof v === 'object' && v !== null ? <ResultValue value={v} /> : String(v)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span>{String(value)}</span>;
}

export default function AiPage() {
  // Query state
  const [question, setQuestion] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);

  // Forecast state
  const [granularity, setGranularity] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [periods, setPeriods] = useState(7);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState('');

  // Anomaly state
  const [anomalies, setAnomalies] = useState<AnomalyResponse | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyError, setAnomalyError] = useState('');

  const runQuery = useCallback(async (e?: FormEvent, presetQuestion?: string) => {
    e?.preventDefault();
    const q = presetQuestion ?? question;
    if (!q.trim()) return;
    setQueryLoading(true);
    setQueryError('');
    try {
      const result = await api<QueryResponse>('/ai/query', {
        method: 'POST',
        body: JSON.stringify({ question: q }),
      });
      setQueryResult(result);
      if (presetQuestion) setQuestion(presetQuestion);
    } catch (err) {
      setQueryError((err as ApiError).message ?? 'Failed to run query');
    } finally {
      setQueryLoading(false);
    }
  }, [question]);

  const loadForecast = useCallback(async () => {
    setForecastLoading(true);
    setForecastError('');
    try {
      const params = new URLSearchParams({ granularity, periods: String(periods) });
      setForecast(await api<ForecastResponse>(`/ai/forecast?${params}`));
    } catch (err) {
      setForecastError((err as ApiError).message ?? 'Failed to load forecast');
    } finally {
      setForecastLoading(false);
    }
  }, [granularity, periods]);

  const loadAnomalies = useCallback(async () => {
    setAnomalyLoading(true);
    setAnomalyError('');
    try {
      setAnomalies(await api<AnomalyResponse>('/ai/anomalies'));
    } catch (err) {
      setAnomalyError((err as ApiError).message ?? 'Failed to load anomalies');
    } finally {
      setAnomalyLoading(false);
    }
  }, []);

  // Load forecast + anomalies on first render.
  useEffect(() => {
    loadForecast();
    loadAnomalies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxProjected = forecast
    ? Math.max(1, ...forecast.forecast.map((f) => Number(f.projectedRevenue)))
    : 1;
  const maxHistorical = forecast
    ? Math.max(1, ...forecast.historical.map((h) => Number(h.revenue)))
    : 1;
  const maxRevenue = Math.max(maxProjected, maxHistorical);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">AI Analytics</h1>
          <p className="mt-1 text-sm text-muted">Natural-language queries, revenue forecasting and anomaly detection.</p>
        </div>
      </div>

      {/* Natural language query */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Ask a question
        </h2>
        <form onSubmit={runQuery} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is our revenue this month?"
            className="flex-1"
          />
          <Button type="submit" loading={queryLoading}>
            <Send className="h-4 w-4" /> Ask
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => runQuery(undefined, s)}
              className="rounded-full border border-border bg-accent px-3 py-1 text-[12px] text-muted transition-colors hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        {queryError && (
          <div className="mt-4 rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            {queryError}
          </div>
        )}

        {queryResult && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <p className="text-[13px] text-muted">
              &ldquo;{queryResult.question}&rdquo; — {new Date(queryResult.fromDate).toLocaleDateString()} to{' '}
              {new Date(queryResult.toDate).toLocaleDateString()}
            </p>
            <ResultValue value={queryResult.data} />
          </div>
        )}

        {!queryResult && !queryError && (
          <p className="mt-4 py-4 text-center text-sm text-muted">Ask a question to see analytics here.</p>
        )}
      </Card>

      {/* Revenue forecast */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" /> Revenue forecast
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as typeof granularity)}
              className="h-8 rounded-control border border-border bg-surface px-2 text-[13px]"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            <input
              type="number"
              min={1}
              max={30}
              value={periods}
              onChange={(e) => setPeriods(Number(e.target.value) || 1)}
              className="h-8 w-16 rounded-control border border-border bg-surface px-2 text-[13px]"
            />
            <Button size="sm" variant="ghost" onClick={loadForecast} disabled={forecastLoading}>Refresh</Button>
          </div>
        </div>

        {forecastError && (
          <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            {forecastError}
          </div>
        )}

        {forecast && (
          <div className="space-y-4">
            {forecast.historical.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No historical revenue in the last 90 days.</p>
            ) : (
              <div>
                <p className="mb-2 text-[12px] uppercase tracking-wide text-muted">Historical</p>
                <div className="space-y-1.5">
                  {forecast.historical.slice(-14).map((h) => (
                    <div key={h.period} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-[12px] text-muted">{h.period}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent">
                        <div
                          className="h-full rounded-full bg-muted/60"
                          style={{ width: `${(Number(h.revenue) / maxRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-[13px] tnum">₹{Number(h.revenue).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-[12px] uppercase tracking-wide text-muted">Forecast (next {forecast.forecast.length})</p>
              <div className="space-y-1.5">
                {forecast.forecast.map((f) => (
                  <div key={f.period} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-[12px] text-muted">{f.period}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(Number(f.projectedRevenue) / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-[13px] font-medium tnum">
                      ₹{Number(f.projectedRevenue).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Anomaly detection */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-primary" /> Revenue anomalies
          </h2>
          <Button size="sm" variant="ghost" onClick={loadAnomalies} disabled={anomalyLoading}>Refresh</Button>
        </div>

        {anomalyError && (
          <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            {anomalyError}
          </div>
        )}

        {anomalies?.message && (
          <p className="py-4 text-center text-sm text-muted">{anomalies.message}</p>
        )}

        {anomalies && !anomalies.message && (
          <div className="space-y-3">
            <p className="text-[13px] text-muted">
              Mean daily revenue ₹{Number(anomalies.mean).toLocaleString('en-IN')}, std. dev ₹
              {Number(anomalies.stdDev).toLocaleString('en-IN')}
            </p>
            <div className="overflow-x-auto rounded-control border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface text-left text-[12px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium">Z-score</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {anomalies.anomalies.map((a) => (
                    <tr key={a.date} className="hover:bg-surface/50">
                      <td className="px-4 py-3">{a.date}</td>
                      <td className="px-4 py-3 text-right tnum">₹{Number(a.revenue).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right tnum">{a.zScore}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cx(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            a.type === 'SPIKE'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                          )}
                        >
                          {a.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {anomalies.anomalies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted">No anomalies detected in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
