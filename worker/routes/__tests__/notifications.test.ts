import { describe, it, expect } from 'vitest';
import notifications from '../notifications';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

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

/**
 * #97: every mutating route in this barrel must refuse a role with no business
 * writing operational data — except the four session-scoped ones, which carry an
 * `rbac-exempt:` directive in notifications.ts because each write is filtered by
 * the caller's own userId. Listing them here as well keeps the exemption honest in
 * both directions: a stray guard on one of them fails this assertion as well as
 * the rule's staleExemption check.
 */
describe('notifications mutating routes carry an rbac guard (#97)', () => {
  const sessionScoped = [
    'POST /notifications/:id/read',
    'POST /notifications/read-all',
    'DELETE /notifications/:id',
    'POST /notifications/clear-all',
  ];

  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(notifications).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route that is not session-scoped', async () => {
    for (const role of OVERSIGHT_ROLES) {
      const reached = await reachableBy(notifications, role);
      expect(reached.map((r) => r.route).sort(), role).toEqual([...sessionScoped].sort());
    }
  });
});
