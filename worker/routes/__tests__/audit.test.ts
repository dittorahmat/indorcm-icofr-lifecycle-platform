import { describe, it, expect } from 'vitest';
import audit from '../audit';

/**
 * audit HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('audit barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(audit).toBeDefined();
    expect(audit.fetch).toBeDefined();
  });

  it('keeps every audit URL byte-identical', () => {
    const routePaths = audit.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /changelogs');
    expect(routePaths).toContain('GET /change-logs');
  });
});
