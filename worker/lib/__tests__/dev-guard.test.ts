import { describe, it, expect } from 'vitest';
import { assertConfirmToken, assertDevAllowed } from '../dev-guard';

/**
 * The demo/tenant Worker sets `ENV=production` in its Wrangler config so the
 * destructive `/api/dev/*` routes refuse. This locks that gate: without it a
 * tenant database could be reseeded or purged by any Admin session.
 */
describe('dev-guard production gate', () => {
  it('refuses when ENV is production', () => {
    expect(assertDevAllowed({ ENV: 'production' }).allowed).toBe(false);
  });

  it('refuses when NODE_ENV is production', () => {
    expect(assertDevAllowed({ NODE_ENV: 'production' }).allowed).toBe(false);
  });

  it('allows outside production', () => {
    expect(assertDevAllowed({ ENV: 'development' })).toEqual({ allowed: true });
    expect(assertDevAllowed({})).toEqual({ allowed: true });
  });

  it('requires the confirm token only when one is configured', () => {
    expect(assertConfirmToken({}, undefined)).toBe(true);
    expect(assertConfirmToken({ DEV_CONFIRM_TOKEN: 't' }, 'wrong')).toBe(false);
    expect(assertConfirmToken({ DEV_CONFIRM_TOKEN: 't' }, 't')).toBe(true);
  });
});
