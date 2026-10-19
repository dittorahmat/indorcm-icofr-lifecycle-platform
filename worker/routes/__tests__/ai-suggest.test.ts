import { describe, it, expect } from 'vitest';
import aiSuggest from '../ai-suggest';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

/**
 * ai-suggest HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('ai-suggest barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(aiSuggest).toBeDefined();
    expect(aiSuggest.fetch).toBeDefined();
  });

  it('keeps every ai-suggest URL byte-identical', () => {
    const routePaths = aiSuggest.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('POST /ai/suggest-risk-controls');
  });
});

/**
 * #97: every mutating route in this barrel must refuse a role that has no
 * business writing operational data. `POST /ai/suggest-risk-controls` carries a
 * `rbac-exempt:` directive (ai-suggest.ts) because it writes no lifecycle entity
 * — it returns a suggestion and records an audit entry — so it is listed here
 * rather than silently skipped.
 */
describe('ai-suggest mutating routes carry an rbac guard (#97)', () => {
  const generationOnly = ['POST /ai/suggest-risk-controls'];

  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(aiSuggest).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles everywhere except the generator', async () => {
    for (const role of OVERSIGHT_ROLES) {
      const reached = await reachableBy(aiSuggest, role);
      expect(reached.map((r) => r.route).sort(), role).toEqual([...generationOnly].sort());
    }
  });
});
