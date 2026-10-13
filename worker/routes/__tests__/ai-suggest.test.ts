import { describe, it, expect } from 'vitest';
import aiSuggest from '../ai-suggest';

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
