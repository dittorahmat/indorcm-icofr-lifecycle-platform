/**
 * Resolve the origins `better-auth` may accept requests from.
 *
 * Each deployed instance MUST trust its own host and nothing else: sharing a
 * trusted origin across instances would let a session cookie minted for one host
 * be presented to another. `BETTER_AUTH_URL` is therefore the single source; the
 * legacy primary origin is only kept as a fallback for deployments that have not
 * configured the variable at all (local dev, pre-existing primary).
 *
 * `TRUSTED_ORIGINS` (comma separated) exists for custom domains added later.
 */
const LOCAL_ORIGIN = 'http://localhost:3000';
const LEGACY_PRIMARY_ORIGIN = 'https://icofr.tech1solusi.workers.dev';

export function resolveTrustedOrigins(baseUrl?: string, extraOrigins?: string): string[] {
  const origin = baseUrl?.trim() || LOCAL_ORIGIN;
  const configured = (extraOrigins ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const legacy = baseUrl?.trim() ? [] : [LEGACY_PRIMARY_ORIGIN];

  return [...new Set([origin, ...legacy, ...configured])];
}
