import { describe, it, expect } from 'vitest';
import remediation from '../remediation';

/**
 * remediation HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('remediation barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(remediation).toBeDefined();
    expect(remediation.fetch).toBeDefined();
  });

  it('keeps every remediation URL byte-identical', () => {
    const routePaths = remediation.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /deficiencies');
    expect(routePaths).toContain('GET /actionplans');
    expect(routePaths).toContain('POST /actionplans');
    expect(routePaths).toContain('PUT /actionplans/:id');
    expect(routePaths).toContain('POST /actionplans/:id/workflow');
    expect(routePaths).toContain('GET /aggregatedeficiencies');
    expect(routePaths).toContain('POST /aggregatedeficiencies');
    expect(routePaths).toContain('PUT /deficiencies/:id');
  });
});
