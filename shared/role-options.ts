/**
 * role-options — the ONE runtime source for ICOFR role/level option lists.
 *
 * `UserRole` / `UserLevel` (`shared/types/common.ts`) are canonical. The maps
 * below are `satisfies Record<union, …>`, so adding a union member without a
 * label is a `tsc` error — never a silently missing picker entry and never a
 * drifted spelling that no union member actually satisfies.
 *
 * Consumed by `src/pages/admin/UserManagementPage.tsx` (pickers) and
 * `worker/routes/users.ts` (write validation), hence `shared/` not `src/`.
 */
import type { UserLevel, UserRole } from './types/common';

/**
 * Literal union of every key the option maps may carry. Dynamic i18n keys ride on
 * a literal union, never a free string (`CODING_STANDARDS.md`), so a typo or a
 * reference to a namespace that does not exist is a `tsc` error rather than a
 * silent `missingKey` in production. The matching bundles are `auth` and `admin`.
 */
export type UserLabelKey =
  | 'auth:lines.l1.title'
  | 'auth:lines.l2.title'
  | 'auth:lines.l3.title'
  | 'admin:users.roles.cfo'
  | 'admin:users.roles.commissioner'
  | 'admin:users.roles.admin'
  | 'admin:users.roles.externalAuditor'
  | 'admin:users.levels.staff'
  | 'admin:users.levels.manager'
  | 'admin:users.levels.head'
  | 'admin:users.levels.director';

export interface UserOption<T extends string> {
  value: T;
  /** Namespace-qualified i18n key (`ns:path`); the option carries a key, never inline text. */
  labelKey: UserLabelKey;
  /** Display fallback for keys not yet present in the `en`/`id` bundles (reported, not added here). */
  fallback: string;
}

interface OptionLabel {
  labelKey: UserLabelKey;
  fallback: string;
}

export const USER_ROLE_LABELS = {
  'Line 1': { labelKey: 'auth:lines.l1.title', fallback: 'Line 1' },
  'Line 2': { labelKey: 'auth:lines.l2.title', fallback: 'Line 2' },
  'Line 3': { labelKey: 'auth:lines.l3.title', fallback: 'Line 3' },
  CFO: { labelKey: 'admin:users.roles.cfo', fallback: 'CFO' },
  Commissioner: { labelKey: 'admin:users.roles.commissioner', fallback: 'Commissioner' },
  Admin: { labelKey: 'admin:users.roles.admin', fallback: 'Admin' },
  'External Auditor': { labelKey: 'admin:users.roles.externalAuditor', fallback: 'External Auditor' },
} satisfies Record<UserRole, OptionLabel>;

export const USER_LEVEL_LABELS = {
  Staff: { labelKey: 'admin:users.levels.staff', fallback: 'Staff' },
  Manager: { labelKey: 'admin:users.levels.manager', fallback: 'Manager' },
  Head: { labelKey: 'admin:users.levels.head', fallback: 'Head' },
  Director: { labelKey: 'admin:users.levels.director', fallback: 'Director' },
} satisfies Record<UserLevel, OptionLabel>;

function toOptions<T extends string>(labels: Record<T, OptionLabel>): readonly UserOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, ...labels[value] }));
}

export const USER_ROLE_OPTIONS: readonly UserOption<UserRole>[] = toOptions<UserRole>(USER_ROLE_LABELS);
export const USER_LEVEL_OPTIONS: readonly UserOption<UserLevel>[] = toOptions<UserLevel>(USER_LEVEL_LABELS);

const ROLE_VALUES = new Set<string>(USER_ROLE_OPTIONS.map((option) => option.value));
const LEVEL_VALUES = new Set<string>(USER_LEVEL_OPTIONS.map((option) => option.value));

/** Union guard for the worker write path: anything but a `UserRole` member is rejected. */
export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && ROLE_VALUES.has(value);

/** Union guard for the worker write path: anything but a `UserLevel` member is rejected. */
export const isUserLevel = (value: unknown): value is UserLevel =>
  typeof value === 'string' && LEVEL_VALUES.has(value);
