'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi, saveTokens, type ApiError } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui/primitives';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSlug, setNeedsSlug] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const result =
        mode === 'login'
          ? await publicApi.login({
              email: String(form.get('email')),
              password: String(form.get('password')),
              tenantSlug: needsSlug ? String(form.get('tenantSlug')) : undefined,
            })
          : await publicApi.register({
              tenantName: String(form.get('tenantName')),
              email: String(form.get('email')),
              password: String(form.get('password')),
              firstName: String(form.get('firstName')),
            });
      saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      router.replace('/dashboard');
    } catch (err) {
      const apiError = (err as { api?: ApiError }).api;
      if (apiError?.code === 'TENANT_SLUG_REQUIRED') {
        setNeedsSlug(true);
        setError('This email exists in multiple workspaces — enter your workspace slug.');
      } else {
        setError(apiError?.message ?? 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-primary text-lg font-semibold text-primary-foreground">
            A
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">
              {mode === 'login' ? 'Sign in to Aureus' : 'Create your workspace'}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {mode === 'login'
                ? 'Run your entire hospitality business in one place'
                : '14-day full-feature trial, no card required'}
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <Input name="tenantName" label="Business name" required maxLength={120} placeholder="Blue Tokai Coffee" />
                <Input name="firstName" label="Your first name" required maxLength={80} placeholder="Asha" />
              </>
            )}
            <Input name="email" label="Email" type="email" required placeholder="you@business.com" autoComplete="email" />
            <Input
              name="password"
              label="Password"
              type="password"
              required
              minLength={mode === 'register' ? 10 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? 'Min 10 chars, letters + digits' : '••••••••••'}
            />
            {needsSlug && mode === 'login' && (
              <Input name="tenantSlug" label="Workspace slug" required placeholder="my-workspace" />
            )}
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              {mode === 'login' ? 'Sign in' : 'Create workspace'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted">
          {mode === 'login' ? "New to Aureus? " : 'Already have a workspace? '}
          <button
            className="font-medium text-primary hover:underline"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
              setNeedsSlug(false);
            }}
          >
            {mode === 'login' ? 'Create a workspace' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
