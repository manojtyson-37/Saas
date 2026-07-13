/**
 * Commercial module catalog. Tenants activate modules independently;
 * CORE and IDENTITY are always on. The API rejects requests to routes of
 * inactive modules with 402 MODULE_NOT_ACTIVE, which the web app maps to
 * an upgrade screen.
 */
export const MODULES = [
  'core',
  'pos',
  'hotel',
  'inventory',
  'procurement',
  'production',
  'bar',
  'crm',
  'accounting',
  'hr',
  'assets',
  'reporting',
  'ai',
  'integrations',
] as const;

export type ModuleCode = (typeof MODULES)[number];

export const ALWAYS_ACTIVE_MODULES: readonly ModuleCode[] = ['core', 'reporting'];

/** Maps a permission's top-level resource prefix to the module that owns it. */
export const PERMISSION_MODULE_MAP: Record<string, ModuleCode> = {
  identity: 'core',
  organization: 'core',
  settings: 'core',
  billing: 'core',
  catalog: 'pos',
  pos: 'pos',
  hotel: 'hotel',
  inventory: 'inventory',
  procurement: 'procurement',
  production: 'production',
  bar: 'bar',
  crm: 'crm',
  accounting: 'accounting',
  hr: 'hr',
  assets: 'assets',
  reporting: 'reporting',
  ai: 'ai',
  integrations: 'integrations',
};
