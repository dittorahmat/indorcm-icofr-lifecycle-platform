import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import * as schema from '../db/schema';
import { resolveUserRole } from '@shared/member-role';
import type { UserRole } from '@shared/types';

/**
 * The role one request runs as (#106).
 *
 * `member.role` is Better Auth's own `'admin' | 'member'` until the ICOFR role is
 * applied there, so it only wins when it IS a `UserRole`; the session's
 * `user.role` is the ICOFR role today (`shared/member-role.ts`). Split out of
 * `worker/app.ts`'s auth middleware because that middleware needs a live Better
 * Auth session to run, while this needs only a database — the seam is what makes
 * the rule testable.
 *
 * A global Admin (and a request with no active organization) short-circuits the
 * lookup. That keeps the admin hot path one query lighter and cannot demote an
 * Admin whose membership row is stale while the transition runs; the day a
 * per-organization ICOFR role has to scope an Admin too, this is the line to drop.
 */
export const resolveRequestRole = async (
  db: DrizzleDb,
  userId: string,
  activeOrgId: string,
  sessionRole: unknown,
): Promise<UserRole> => {
  if (sessionRole === 'Admin' || !activeOrgId) return resolveUserRole(null, sessionRole);

  try {
    const mem = await db.select({ role: schema.member.role })
      .from(schema.member)
      .where(and(eq(schema.member.userId, userId), eq(schema.member.organizationId, activeOrgId)))
      .limit(1);
    return resolveUserRole(mem[0]?.role ?? null, sessionRole);
  } catch {
    // A read failure must not become an authorization decision.
    return resolveUserRole(null, sessionRole);
  }
};
