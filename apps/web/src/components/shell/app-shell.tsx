'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ChefHat,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Users,
} from 'lucide-react';
import { api, loadTokens, saveTokens } from '@/lib/api';
import { Kbd, cx } from '@/components/ui/primitives';
import { CommandPalette, type Command } from './command-palette';

interface Me {
  firstName: string;
  lastName: string | null;
  email: string;
  tenant: { name: string; slug: string; plan: string };
  roles: Array<{ code: string; name: string }>;
}

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/organization', label: 'Organization', icon: Building2 },
  { href: '/users', label: 'Team', icon: Users },
  { href: '/catalog', label: 'Catalog', icon: ChefHat },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/procurement', label: 'Procurement', icon: ShoppingCart },
  { href: '/production', label: 'Production', icon: FlaskConical },
  { href: '/pos', label: 'POS', icon: Monitor },
  { href: '/reports', label: 'Reports', icon: ClipboardList, disabled: true },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [dark, setDark] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!loadTokens()) {
      router.replace('/login');
      return;
    }
    api<Me>('/auth/me')
      .then(setMe)
      .catch(() => router.replace('/login'));
  }, [router]);

  useEffect(() => {
    const stored = window.localStorage.getItem('aureus.theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored ? stored === 'dark' : prefersDark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((isDark: boolean) => {
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('aureus.theme', isDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const logout = useCallback(async () => {
    const tokens = loadTokens();
    if (tokens) {
      await api('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      }).catch(() => undefined);
    }
    saveTokens(null);
    router.replace('/login');
  }, [router]);

  const commands = useMemo<Command[]>(
    () => [
      ...NAV.filter((n) => !('disabled' in n && n.disabled)).map((n) => ({
        id: `nav:${n.href}`,
        label: `Go to ${n.label}`,
        group: 'Navigate',
        run: () => router.push(n.href),
      })),
      {
        id: 'theme',
        label: dark ? 'Switch to light mode' : 'Switch to dark mode',
        group: 'Preferences',
        run: () => setTheme(!dark),
      },
      { id: 'logout', label: 'Sign out', group: 'Account', run: logout },
    ],
    [router, dark, setTheme, logout],
  );

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Nav rail */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-border bg-surface">
        <div className="flex h-14 items-center gap-2 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">
            A
          </div>
          <span className="text-sm font-semibold">Aureus</span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const disabled = 'disabled' in item && item.disabled;
            const Icon = item.icon;
            if (disabled) {
              return (
                <div
                  key={item.href}
                  className="flex h-9 cursor-not-allowed items-center gap-3 rounded-control px-3 text-sm text-muted opacity-50"
                  title="Coming in a later phase"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  'relative flex h-9 items-center gap-3 rounded-control px-3 text-sm transition-colors',
                  active
                    ? 'bg-accent font-medium text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
                    : 'text-muted hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-control px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[13px] font-medium">
              {me.firstName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">
                {me.firstName} {me.lastName ?? ''}
              </p>
              <p className="truncate text-[12px] text-muted">{me.tenant.name}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-control p-1.5 text-muted hover:bg-accent hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-60 flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-8 w-72 items-center gap-2 rounded-control border border-border bg-surface px-3 text-[13px] text-muted hover:bg-accent"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search or jump to…</span>
            <Kbd>⌘K</Kbd>
          </button>
          <button
            onClick={() => setTheme(!dark)}
            className="rounded-control p-2 text-muted hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>
        <main className="mx-auto max-w-[1440px] p-6">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </div>
  );
}
