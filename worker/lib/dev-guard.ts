/**
 * dev-guard — the non-production gate shared by the `/dev/*` tooling routes.
 *
 * Reads env flags only. They are not declared in `HonoEnv.Bindings`, which is why
 * the call sites used to take the whole context as `any`; a narrow env shape (with
 * an index signature, so a real Bindings object still satisfies it) keeps this
 * cast-free.
 *
 * Discipline (AGENTS.md): no runtime DDL behind this guard — the single source of
 * DDL truth is the versioned `drizzle/*.sql` files.
 */
export interface DevGuardEnv {
  ENV?: string;
  NODE_ENV?: string;
  DEV_CONFIRM_TOKEN?: string;
  [key: string]: unknown;
}

export interface DevGateResult {
  allowed: boolean;
  reason?: string;
}

/** `{ allowed: false }` in production, so the route refuses instead of mutating. */
export function assertDevAllowed(env: DevGuardEnv): DevGateResult {
  const scope = env.ENV || env.NODE_ENV || (typeof process !== 'undefined' ? process.env.NODE_ENV : '');
  if (scope === 'production') {
    return {
      allowed: false,
      reason: 'Disabled in production. Use versioned drizzle migrations + CLI scripts.',
    };
  }
  return { allowed: true };
}

/** `true` when DEV_CONFIRM_TOKEN is configured and matches the request token; fails closed if unset. */
export function assertConfirmToken(env: DevGuardEnv, token: string | undefined): boolean {
  const expected = env.DEV_CONFIRM_TOKEN || (typeof process !== 'undefined' ? process.env.DEV_CONFIRM_TOKEN : '');
  if (!expected) return false;
  return token === expected;
}
