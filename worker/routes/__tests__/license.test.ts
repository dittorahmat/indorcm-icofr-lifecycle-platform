import { describe, it, expect } from 'vitest';
import license from '../license';

/**
 * license HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('license barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(license).toBeDefined();
    expect(license.fetch).toBeDefined();
  });

  it('keeps every license URL byte-identical', () => {
    const routePaths = license.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /license/status');
    expect(routePaths).toContain('POST /license/activate');
  });
});
