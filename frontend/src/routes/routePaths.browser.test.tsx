import { describe, it, expect } from 'vitest';

import * as routePaths from './routePaths';

describe('routePaths', () => {
  it('getMenuEntries returns menu items for the given roles', () => {
    // Empty roles → only routes without a role gate (Dashboard, Project
    // Search, Reports). Admin route is filtered out because it requires
    // REPT_ADMIN.
    const entries = routePaths.getMenuEntries([]);
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.some((e) => e.id === 'Dashboard')).toBe(true);
    expect(entries.some((e) => e.id === 'Administration')).toBe(false);

    // With REPT_ADMIN the gated route appears.
    const adminEntries = routePaths.getMenuEntries(['REPT_ADMIN']);
    expect(adminEntries.some((e) => e.id === 'Administration')).toBe(true);
  });

  it('getPublicRoutes returns the unauthenticated route set', () => {
    const result = routePaths.getPublicRoutes();
    // Landing is the first entry; other public routes are Unauthorized
    // and the wildcard 404 catch-all.
    expect(result.some((r) => r.id === 'Landing')).toBe(true);
    expect(result.some((r) => r.id === 'Unauthorized')).toBe(true);
    expect(result.some((r) => r.id === 'Not Found')).toBe(true);
  });

  it('getProtectedRoutes returns protected and system routes', () => {
    const result = routePaths.getProtectedRoutes();
    expect(Array.isArray(result)).toBe(true);
    expect(result.some((r) => r.id === 'Dashboard')).toBe(true);
  });

  it('getNoRoleRoutes returns the unauthorized route plus a catch-all redirect', () => {
    const result = routePaths.getNoRoleRoutes();
    expect(result.some((r) => r.id === 'Unauthorized')).toBe(true);
    // Catch-all redirect ensures a no-role user never lands on a stale URL.
    expect(result.some((r) => r.path === '*')).toBe(true);
    // No-role users should not see protected pages like Dashboard.
    expect(result.some((r) => r.id === 'Dashboard')).toBe(false);
  });
});
