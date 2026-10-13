import { describe, it, expect } from 'vitest';
import aiDocs from '../ai-docs';

/**
 * ai-docs HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('ai-docs barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(aiDocs).toBeDefined();
    expect(aiDocs.fetch).toBeDefined();
  });

  it('keeps every ai-docs URL byte-identical', () => {
    const routePaths = aiDocs.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('POST /ai/chat');
    expect(routePaths).toContain('GET /documents');
    expect(routePaths).toContain('POST /documents');
    expect(routePaths).toContain('DELETE /documents/:id');
    expect(routePaths).toContain('GET /documents/download/:id');
    expect(routePaths).toContain('POST /upload');
    expect(routePaths).toContain('GET /files/*');
  });
});
