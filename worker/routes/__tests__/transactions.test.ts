import { describe, it, expect } from 'vitest';
import transactions from '../transactions';

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
    expect(routePaths).toContain('DELETE /transaction-details/:noGL');
    expect(routePaths).toContain('POST /transaction-details/upload');
  });
});
