import { describe, it, expect } from 'vitest';
import bpm from '../bpm';

/**
 * bpm HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('bpm barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(bpm).toBeDefined();
    expect(bpm.fetch).toBeDefined();
  });

  it('keeps every bpm URL byte-identical', () => {
    const routePaths = bpm.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /bpm-diagrams');
    expect(routePaths).toContain('POST /bpm-diagrams/cleanup-flow-prefix');
    // The mutating ANY-verb route is gone: cleanup writes, so it is POST-only.
    expect(routePaths).not.toContain('ALL /bpm-diagrams/cleanup-flow-prefix');
    expect(routePaths).toContain('GET /bpm-diagrams/:id');
    expect(routePaths).toContain('POST /bpm-diagrams');
    expect(routePaths).toContain('PUT /bpm-diagrams/:id');
    expect(routePaths).toContain('DELETE /bpm-diagrams/:id');
    expect(routePaths).toContain('GET /bpm-diagrams/by-control/:controlId');
    expect(routePaths).toContain('GET /bpm-diagrams/by-gl/:noGL');
    expect(routePaths).toContain('POST /bpm-diagrams/ocr');
    expect(routePaths).toContain('GET /bpm-processes');
    expect(routePaths).toContain('GET /bpm-processes/:id/controls');
    expect(routePaths).toContain('GET /bpm-processes/:id/next-sequences');
    expect(routePaths).toContain('POST /bpm-processes');
    expect(routePaths).toContain('POST /bpm-processes/batch-reorganize');
    expect(routePaths).toContain('PATCH /bpm-processes/:id');
    expect(routePaths).toContain('POST /bpm-processes/:id/workflow');
    expect(routePaths).toContain('DELETE /bpm-processes/:id');
    expect(routePaths).toContain('GET /legacy/bpm-summary');
  });

  it('has no ALL-verb route left, so a stray GET cannot mutate', () => {
    // `.all(` is gone, so a GET to that path is absorbed by `GET /bpm-diagrams/:id`
    // — a read (`getDiagramById`), not a write. This locks the absence of ALL
    // routes, which is what made a GET rewrite every diagram name in the tenant.
    expect(bpm.routes.some((r) => r.method === 'ALL')).toBe(false);
    const getPaths = bpm.routes.filter((r) => r.method === 'GET').map((r) => r.path);
    expect(getPaths).toContain('/bpm-diagrams/:id');
  });
});
