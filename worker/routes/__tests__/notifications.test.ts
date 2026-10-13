import { describe, it, expect } from 'vitest';
import notifications from '../notifications';

/**
 * notifications HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('notifications barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(notifications).toBeDefined();
    expect(notifications.fetch).toBeDefined();
  });

  it('keeps every notifications URL byte-identical', () => {
    const routePaths = notifications.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /notifications/unread-count');
    expect(routePaths).toContain('GET /notifications');
    expect(routePaths).toContain('POST /notifications');
    expect(routePaths).toContain('POST /notifications/:id/read');
    expect(routePaths).toContain('POST /notifications/read-all');
    expect(routePaths).toContain('DELETE /notifications/:id');
    expect(routePaths).toContain('POST /notifications/clear-all');
  });
});
