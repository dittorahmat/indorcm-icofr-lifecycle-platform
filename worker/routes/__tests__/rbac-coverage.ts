// worker/routes/__tests__/rbac-coverage.ts — the shared half of the #97 coverage
// assertion. One place, because every barrel asserts the same thing and the
// per-file app construction drifted each time it was copied.
//
// The subject is the barrel itself: the mutating routes are enumerated from
// `barrel.routes`, so a route added later is covered the moment it is registered,
// and the test never keeps a second list of URLs to go stale.
import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import type { UserRole } from '@shared/types';

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** Roles that may not write operational data anywhere. */
export const OVERSIGHT_ROLES: UserRole[] = ['External Auditor', 'Line 3'];

export interface Reachable {
  /** `METHOD /path` as the barrel declares it. */
  route: string;
  status: number;
}

/**
 * The barrel's own mutating registrations — what the assertion has to cover.
 * Deduped by `METHOD path`: Hono lists a `.route('/', subApp)` child's routes
 * twice (once for the child, once for the mount), and the assertion compares sets.
 */
export function mutatingRoutes(barrel: Hono<HonoEnv>) {
  const seen = new Set<string>();
  return barrel.routes.filter((route) => {
    if (!MUTATING_METHODS.includes(route.method)) return false;
    const key = `${route.method} ${route.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * The mutating routes `role` can still reach, i.e. everything that did not answer
 * 403. A guard runs before its handler, so a refused role never reaches the DB and
 * no fixtures are needed; removing an `rbac(...)` makes the handler run instead and
 * answer 500, which is what the returned status shows.
 */
export async function reachableBy(barrel: Hono<HonoEnv>, role: UserRole): Promise<Reachable[]> {
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    c.set('userRole', role);
    await next();
  });
  app.route('/', barrel);

  const reached: Reachable[] = [];
  for (const route of mutatingRoutes(barrel)) {
    const response = await app.request(route.path, { method: route.method });
    if (response.status !== 403) reached.push({ route: `${route.method} ${route.path}`, status: response.status });
  }
  return reached;
}
