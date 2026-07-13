'use client';

/**
 * Minimal typed API client with automatic access-token refresh.
 * Tokens live in localStorage for the dev shell; production hardening
 * moves the refresh token to an httpOnly cookie (API already supports it).
 */

const BASE = '/api/v1';

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  code?: string;
  details?: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  tenantId: string;
  tenantSlug: string;
  isTenantOwner: boolean;
}

interface TokenBundle {
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEY = 'aureus.auth';

export function loadTokens(): TokenBundle | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenBundle;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: TokenBundle | null): void {
  if (typeof window === 'undefined') return;
  if (tokens) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  else window.localStorage.removeItem(STORAGE_KEY);
}

async function rawRequest<T>(
  path: string,
  options: RequestInit,
  accessToken?: string,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(new Error(body?.message ?? `Request failed (${res.status})`), {
      api: (body ?? { statusCode: res.status }) as ApiError,
    });
  }
  return body as T;
}

let refreshing: Promise<TokenBundle | null> | null = null;

async function refreshTokens(): Promise<TokenBundle | null> {
  const current = loadTokens();
  if (!current) return null;
  refreshing ??= rawRequest<TokenBundle>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  })
    .then((next) => {
      saveTokens(next);
      return next;
    })
    .catch(() => {
      saveTokens(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Authenticated request with one transparent refresh-and-retry on 401. */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = loadTokens();
  try {
    return await rawRequest<T>(path, options, tokens?.accessToken);
  } catch (error) {
    const apiError = (error as { api?: ApiError }).api;
    const status = apiError?.statusCode;

    // Tenant is fully locked out (trial ended / subscription inactive) — every
    // module route 402s, so send the user straight to the plan picker instead
    // of letting every page render a raw error. Re-thrown so callers that want
    // to show inline messaging (e.g. the billing page itself) still can.
    if (
      status === 402 &&
      (apiError?.code === 'TRIAL_EXPIRED' || apiError?.code === 'SUBSCRIPTION_INACTIVE')
    ) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/settings/billing') {
        window.location.href = '/settings/billing';
      }
      throw error;
    }

    if (status !== 401 || !tokens) throw error;
    const next = await refreshTokens();
    if (!next) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw error;
    }
    return rawRequest<T>(path, options, next.accessToken);
  }
}

export interface PlanLimits {
  maxLocations: number | null;
  maxUsers: number | null;
}

export interface Plan {
  code: string;
  name: string;
  priceInrMonthly: number;
  moduleCodes: readonly string[];
  limits: PlanLimits;
  trialDays: number;
}

export interface SubscriptionModule {
  code: string;
  active: boolean;
}

export interface Subscription {
  planCode: string;
  plan: Plan | null;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CHURNED';
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  modules: SubscriptionModule[];
}

export const billingApi = {
  getPlans: () => api<Plan[]>('/billing/plans'),
  getSubscription: () => api<Subscription>('/billing/subscription'),
  changePlan: (planCode: string) =>
    api<Subscription>('/billing/subscription/change-plan', {
      method: 'POST',
      body: JSON.stringify({ planCode }),
    }),
};

export const publicApi = {
  login: (payload: { email: string; password: string; tenantSlug?: string }) =>
    rawRequest<TokenBundle & { user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload: {
    tenantName: string;
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }) =>
    rawRequest<TokenBundle & { user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
