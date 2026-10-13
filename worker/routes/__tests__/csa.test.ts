import { describe, it, expect } from 'vitest';
import csa from '../csa';

/**
 * CSA HTTP contract lock. The worklist tab (spec #65) and the execution
 * workspace both depend on these URLs; refactors must keep them
 * byte-identical. Handlers stay thin adapters over CsaDomainService.
 */
describe('CSA barrel routes and sub-apps', () => {
  it('exposes a valid Hono instance', () => {
    expect(csa).toBeDefined();
    expect(csa.fetch).toBeDefined();
  });

  it('keeps every CSA record URL byte-identical', () => {
    const routePaths = csa.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /csa');
    expect(routePaths).toContain('POST /csa');
    expect(routePaths).toContain('PUT /csa/:id');
    expect(routePaths).toContain('POST /csa/:id/workflow');
    expect(routePaths).toContain('DELETE /csa/:id');
    expect(routePaths).toContain('GET /csa/:id/export-pdf');
  });
});
