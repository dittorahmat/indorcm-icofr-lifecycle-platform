import { describe, it, expect } from 'vitest';
import reporting from '../reporting';

/**
 * reporting HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('reporting barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(reporting).toBeDefined();
    expect(reporting.fetch).toBeDefined();
  });

  it('keeps every reporting URL byte-identical', () => {
    const routePaths = reporting.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /reports/summary');
    expect(routePaths).toContain('POST /reports/sign-off');
    expect(routePaths).toContain('POST /reports/export');
    expect(routePaths).toContain('GET /bpm-exports');
    expect(routePaths).toContain('POST /bpm-exports');
  });
});
