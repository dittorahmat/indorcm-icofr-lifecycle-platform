import { describe, it, expect } from 'vitest';
import rcm from '../rcm';

/**
 * RCM HTTP contract lock (arch-09 T4). Write behavior (allow-list partition,
 * TOD upsert via decideTest, auto-deficiency, consolidated batch) is specified
 * through the domain seam with a fake store — no HTTP — in
 * worker/services/__tests__/rcm-matrix-write.test.ts. This file only proves
 * the route URLs stayed byte-identical while handlers thinned into adapters.
 */
describe('RCM barrel routes and sub-apps', () => {
  it('exposes a valid Hono instance', () => {
    expect(rcm).toBeDefined();
    expect(rcm.fetch).toBeDefined();
  });

  it('keeps every RCM item/control/matrix URL byte-identical', () => {
    const routePaths = rcm.routes.map((r) => `${r.method} ${r.path}`);

    // RCM item routes
    expect(routePaths).toContain('GET /rcm');
    expect(routePaths).toContain('POST /rcm');
    expect(routePaths).toContain('PUT /rcm/:id');
    expect(routePaths).toContain('POST /rcm/:id/workflow');
    expect(routePaths).toContain('DELETE /rcm/:id');

    // Controls routes
    expect(routePaths).toContain('GET /controls');
    expect(routePaths).toContain('POST /controls');
    expect(routePaths).toContain('PUT /controls/:id');
    expect(routePaths).toContain('DELETE /controls/:id');

    // Matrix read routes
    expect(routePaths).toContain('GET /rcm-matrix/tlc');
    expect(routePaths).toContain('GET /rcm-matrix/elc');
    expect(routePaths).toContain('GET /rcm-matrix/itgc');
    expect(routePaths).toContain('GET /rcm-matrix/verification-design');
    expect(routePaths).toContain('GET /rcm-matrix/tlc/mapping/:id');

    // Matrix write routes (thin adapters over the domain seam)
    expect(routePaths).toContain('PATCH /rcm-matrix/verification-design/:mappingId');
    expect(routePaths).toContain('POST /rcm-matrix/verification-design');
    expect(routePaths).toContain('POST /rcm-matrix/:type/batch-update');
  });
});
