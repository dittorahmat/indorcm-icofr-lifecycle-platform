/**
 * rollover-roles — the ONE owner of the #103 role policy for the year-end
 * baseline rollover (`POST /migration/rollover`).
 *
 * Rollover is the tenant-wide clone of the stable baseline (account assertions,
 * BPM processes/diagrams, risks, controls, open deficiencies) into the working
 * year. #103 assigns it to internal audit and the super admin: the preparers
 * (Line 1 / Line 2) never clone their own year's baseline.
 *
 * That is a deliberate exception to `OVERSIGHT_ROLES` in
 * `worker/routes/__tests__/rbac-coverage.ts` ("Line 3 may not write operational
 * data anywhere"), so the exception is named here instead of hiding in a route
 * literal: one route guard plus the three entry cards read this list, and the
 * policy is flipped in one edit. Consumed by
 * `worker/routes/migration/rollover.ts` and the rollover cards in
 * `ScopingPage`, `RCMELCPage` and `RCMTLCPage` — hence `shared/`, not `src/`.
 */
import type { UserRole } from './types/common';

export const ROLLOVER_ROLES: UserRole[] = ['Line 3', 'Admin'];

/** UI counterpart of the guard: a card that could only collect a 403 is hidden. */
export const canRunRollover = (role: UserRole | null | undefined): boolean =>
  role != null && ROLLOVER_ROLES.includes(role);
