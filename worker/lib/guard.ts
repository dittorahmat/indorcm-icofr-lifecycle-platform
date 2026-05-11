import { Context, Next } from "hono";
import type { HonoEnv } from '../app';
import type { UserRole } from "@shared/types";
import { bad } from "./utils";

/**
 * RBAC Middleware for Hono.
 * Ensures the authenticated user has one of the required roles.
 */
export const rbac = (allowedRoles: UserRole[]) => {
  return async (c: Context<HonoEnv>, next: Next) => {
    const userRole = c.get('userRole');

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn(`[RBAC] Access denied for user ${c.get('userId')} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
      return bad(c, 'Access Denied: Insufficient permissions', 403);
    }

    await next();
  };
};
