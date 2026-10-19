/**
 * member-role — how the ICOFR role sits next to Better Auth's own role
 * vocabulary (#106).
 *
 * Two columns can hold a role, and they are not the same thing:
 *
 * - `user.role` is the ICOFR role (`UserRole`) — what `GET /api/user/me` returns
 *   and what the client surfaces (sidebar, rollover card) read.
 * - `member.role` is Better Auth's own `'admin' | 'member'`, per organization.
 *   It will carry the ICOFR role only once that is applied *there*; until then
 *   every writer maps through `toMemberRole`, and `resolveUserRole` accepts
 *   either vocabulary so a row written before the change cannot 403 its owner.
 *
 * The rule is pure on purpose: the request gate (`worker/app.ts`) is not
 * unit-testable without a live session, so the decision lives here with tests.
 */
import type { UserRole } from './types/common';
import { isUserRole } from './role-options';

/** Better Auth's built-in organization roles. */
export type MemberRole = 'admin' | 'member';

/**
 * What Better Auth's `member.role` should hold for a user with this ICOFR role.
 *
 * Accepts the raw text column / mock-data typing too, because only `'Admin'` is
 * special: anything else — including a value nobody recognises — is a plain
 * member, which is the fail-safe direction.
 */
export const toMemberRole = (role: UserRole | string | null | undefined): MemberRole =>
  role === 'Admin' ? 'admin' : 'member';

/**
 * The ICOFR role for one request.
 *
 * `member.role` wins when it is a real `UserRole` (the per-organization row is
 * the more specific statement, and it is what the role will be applied to later);
 * otherwise the session's `user.role` decides, and `'Line 1'` is the floor a
 * brand-new account lands on — same default the request gate used before.
 *
 * `memberRole` is `null` when the caller skipped the lookup (an Admin session) or
 * when the row is absent; both fall through to the session role.
 */
export const resolveUserRole = (memberRole: unknown, sessionRole: unknown): UserRole => {
  if (isUserRole(memberRole)) return memberRole;
  if (isUserRole(sessionRole)) return sessionRole;
  return 'Line 1';
};

/** The two writes a repair of one membership may have to make (#106 backfill). */
export interface RoleRepair {
  /** What `user.role` should hold: the role the request gate grants this row. */
  userRole: UserRole;
  /** What `member.role` should hold: Better Auth's vocabulary. */
  memberRole: MemberRole;
  needsUserWrite: boolean;
  needsMemberWrite: boolean;
}

/**
 * Plan the repair for one `(user.role, member.role)` pair.
 *
 * `user.role` always converges on the role the gate grants the row *today*, so
 * normalising the membership afterwards cannot change anyone's rights: a
 * membership that already holds a real `UserRole` is what the gate honours, and
 * dropping that role into the user column is what keeps it honoured once the
 * membership is normalised.
 *
 * A row with no role anywhere converges on `'Line 1'` — the same floor the gate
 * applies at runtime, so the repair never grants anything a request would not.
 */
export const planRoleRepair = (userRole: unknown, memberRole: unknown): RoleRepair => {
  const effective = resolveUserRole(memberRole, userRole);
  const normalised = toMemberRole(effective);
  return {
    userRole: effective,
    memberRole: normalised,
    needsUserWrite: userRole !== effective,
    needsMemberWrite: memberRole !== normalised,
  };
};
