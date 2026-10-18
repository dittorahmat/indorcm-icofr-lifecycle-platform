/**
 * coerce — request-body narrowing shared by the worker write seams.
 *
 * Request bodies arrive as `unknown`. Writing them straight through is what
 * invites an unchecked assertion (round 9 removed one from the CSA test-record
 * insert); a named coercion says out loud that a malformed value is dropped
 * rather than stored. One owner, so a second local `booleanField` cannot drift
 * from this one (`CODING_STANDARDS.md`: normalizers are single-sourced).
 */

/** `true`/`false` pass through; anything else is `undefined` (the column default applies). */
export const booleanField = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

/** A string passes through; anything else is `undefined`. */
export const stringField = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;
