import { describe, it, expect } from 'vitest';
import transactions from '../transactions';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

/**
 * transactions HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('transactions barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(transactions).toBeDefined();
    expect(transactions.fetch).toBeDefined();
  });

  it('keeps every transactions URL byte-identical', () => {
    const routePaths = transactions.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /transaction-details');
    expect(routePaths).toContain('POST /transaction-details');
    expect(routePaths).toContain('GET /transaction-uploads');
    expect(routePaths).toContain('DELETE /transaction-details/:noGL');
    expect(routePaths).toContain('POST /transaction-details/upload');
  });
});

/**
 * #97: every mutating route in this barrel must refuse a role that has no
 * business writing operational data. The subject is the barrel's own route list
 * and the mechanics live in ./rbac-coverage — see there for why no fixtures are
 * needed and what a failure means.
 */
describe('transactions mutating routes carry an rbac guard (#97)', () => {
  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(transactions).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route', async () => {
    for (const role of OVERSIGHT_ROLES) {
      expect(await reachableBy(transactions, role), role).toEqual([]);
    }
  });
});
