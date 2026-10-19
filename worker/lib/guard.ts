import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../app';
import type { UserRole } from "@shared/types";
import { bad } from "./utils";

/**
 * RBAC middleware for Hono. Ensures the authenticated user has one of the
 * required roles, answering 403 otherwise.
 *
 * Declared as `MiddlewareHandler<HonoEnv, P>` rather than a bare
 * `(c: Context<HonoEnv>, next: Next) => …` on purpose: an untyped middleware
 * makes TypeScript resolve Hono's loose registration overload, which drops the
 * path literal from the following handler's context — `c.req.param('id')`
 * degrades to `string | undefined` and every drizzle `eq(column, id)`
 * downstream stops compiling. Routes guarded before this typing carry `!` to
 * compensate (`worker/routes/bpm.ts`); new call sites should not have to.
 *
 * Not every write wants a role list. A route whose handler writes strictly the
 * caller's own row (`WHERE userId = c.get('userId')`) is *session-scoped*: a role
 * list there would deny a role its own settings and go stale the day a role is
 * added. Those routes say so with a reason instead of a guard:
 * `// rbac-exempt: self-scoped — writes the caller's own row`
 * (`local/routes-require-rbac` requires the reason, and reports a directive left
 * on a route that does carry a guard).
 */
export const rbac = <P extends string = string>(allowedRoles: UserRole[]): MiddlewareHandler<HonoEnv, P> => {
  return async (c, next) => {
    const userRole = c.get('userRole');

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn(`[RBAC] Access denied for user ${c.get('userId')} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
      return bad(c, 'Access Denied: Insufficient permissions', 403);
    }

    await next();
  };
};
