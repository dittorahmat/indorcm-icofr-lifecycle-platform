import { describe, it, expect } from 'vitest';
import migration from '../migration';

/**
 * migration HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('migration barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(migration).toBeDefined();
    expect(migration.fetch).toBeDefined();
  });

  it('keeps every migration URL byte-identical', () => {
    const routePaths = migration.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('POST /migration/finalize');
    expect(routePaths).toContain('POST /migration/rollover');
  });
});
