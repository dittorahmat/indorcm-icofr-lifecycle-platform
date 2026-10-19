import { describe, it, expect } from 'vitest';
import migration from '../migration';
import { reachableBy } from './rbac-coverage';
import { ROLLOVER_ROLES } from '@shared/rollover-roles';
import type { UserRole } from '@shared/types';

/**
 * migration HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('migration barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(migration).toBeDefined();
    expect(migration.fetch).toBeDefined();
  });

  it('keeps every migration URL byte-identical', () => {
    const routePaths = migration.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('POST /migration/finalize');
    expect(routePaths).toContain('POST /migration/rollover');
  });

  it('registers the two mutating routes as POST and nothing else', () => {
    // Hono lists a sub-app route twice after `.route('/', subApp)`; dedupe.
    const migrationRoutes = [...new Set(
      migration.routes
        .filter((r) => r.path.startsWith('/migration/'))
        .map((r) => `${r.method} ${r.path}`),
    )].sort();

    expect(migrationRoutes).toEqual([
      'POST /migration/finalize',
      'POST /migration/rollover',
    ]);
  });
});

/**
 * #103: the rollover guard is pinned per role instead of by the repository-wide
 * coverage assertion, because the owner decision deliberately grants it to
 * Line 3 — a member of `OVERSIGHT_ROLES` ("may not write operational data
 * anywhere"). The exception is the point of the test, so it is spelled out.
 */
describe('migration rollover role policy (#103)', () => {
  it('admits Line 3 and Admin, and only them', async () => {
    expect(ROLLOVER_ROLES).toEqual(['Line 3', 'Admin']);

    for (const role of ROLLOVER_ROLES) {
      const reached = (await reachableBy(migration, role)).map((r) => r.route);
      // Admin also holds the pre-existing `finalize` right; Line 3 holds neither.
      expect(reached, role).toEqual(
        role === 'Admin'
          ? ['POST /migration/finalize', 'POST /migration/rollover']
          : ['POST /migration/rollover'],
      );
    }
  });

  it('refuses the preparers, the approvers and the external auditor', async () => {
    const refused: UserRole[] = ['Line 1', 'CFO', 'Commissioner', 'External Auditor'];
    for (const role of refused) {
      expect(await reachableBy(migration, role), role).toEqual([]);
    }
  });

  it('keeps finalize out of the rollover decision (Line 2 unchanged)', async () => {
    const reached = (await reachableBy(migration, 'Line 2')).map((r) => r.route);
    expect(reached).toEqual(['POST /migration/finalize']);
  });
});
