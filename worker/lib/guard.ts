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
