import { describe, it, expect } from 'vitest';
import rcm from '../rcm';

describe('RCM barrel routes and sub-apps', () => {
  it('exposes a valid Hono instance', () => {
    expect(rcm).toBeDefined();
    expect(rcm.fetch).toBeDefined();
  });

  it('contains expected registered routes in the router', () => {
    const routePaths = rcm.routes.map((r) => `${r.method} ${r.path}`);
    
    // Check RCM item routes
    expect(routePaths).toContain('GET /rcm');
    expect(routePaths).toContain('POST /rcm');
    expect(routePaths).toContain('PUT /rcm/:id');
    expect(routePaths).toContain('POST /rcm/:id/workflow');
    expect(routePaths).toContain('DELETE /rcm/:id');

    // Check Controls routes
    expect(routePaths).toContain('GET /controls');
    expect(routePaths).toContain('POST /controls');
    expect(routePaths).toContain('PUT /controls/:id');
    expect(routePaths).toContain('DELETE /controls/:id');

    // Check Matrix routes
    expect(routePaths).toContain('GET /rcm-matrix/tlc');
    expect(routePaths).toContain('GET /rcm-matrix/elc');
    expect(routePaths).toContain('GET /rcm-matrix/itgc');
    expect(routePaths).toContain('GET /rcm-matrix/verification-design');
  });
});
