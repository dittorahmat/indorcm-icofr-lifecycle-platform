/**
 * entity-authority — the ONE owner of client-side capability decisions.
 *
 * Before this module, every screen re-declared ICOFR authority as string
 * literals (`role === 'Line 2' || role === 'Admin'`, `readOnly = role === 'Line 2'`).
 * Six surfaces already disagreed: the sidebar admitted Line 2 to the scoping
 * approval queue that `allowedRolesAt` refuses, and the CSA worklist let every
 * role except Line 2 edit while the worker guard admits only Line 1 and Admin.
 *
 * The server remains the enforcement point (`worker/lib/guard.ts`); this module
 * is the *same* answer for the UI, so a screen can no longer out-rank the guard.
 * Approvals are derived from the SCOPING table rather than re-listed here.
 *
 * Fail closed: an unresolved role (`undefined`) holds no capability.
 */
import type { UserRole } from './types';
import { allowedRolesAt } from './workflow-transitions';
import { simulationApprovalStages } from './scoping-simulation-status';

export type Capability =
  | 'scoping:view-approvals'
  | 'scoping:allocate-departments'
  | 'scoping:accept-ownership'
  | 'scoping:accept-ownership-any-department'
  | 'scoping:view-all-departments'
  | 'csa:execute-assessment'
  | 'knowledge:manage-documents'
  | 'rcm:edit-verification-design'
  | 'rcm:manage-controls'
  | 'workflow:bypass-sod'
  | 'deficiency:edit-any-plan'
  | 'deficiency:create-plan'
  | 'admin:manage-users';

/**
 * Who may act at some approval stage of the SCOPING lifecycle. Derived, not
 * typed: adding a stage/authority to `WORKFLOW_TRANSITION_RULES` moves the
 * sidebar entry with it.
 */
const SCOPING_APPROVAL_ROLES: readonly UserRole[] = Array.from(
  new Set(simulationApprovalStages().flatMap((status) => allowedRolesAt('SCOPING', status))),
);

export const CAPABILITY_ROLES: Record<Capability, readonly UserRole[]> = {
  'scoping:view-approvals': SCOPING_APPROVAL_ROLES,
  'scoping:allocate-departments': ['Line 2', 'Admin'],
  /** Line 1 may accept only accounts assigned to their department; the caller checks that. */
  'scoping:accept-ownership': ['Line 1', 'Admin'],
  /** Department scoping does not apply to these roles. */
  'scoping:accept-ownership-any-department': ['Admin'],
  /** Line 1 is scoped to its own department; every other role sees the consolidated view. */
  'scoping:view-all-departments': ['Line 2', 'Line 3', 'Admin', 'External Auditor', 'Commissioner', 'CFO'],
  /** CSA execution is operational work; Line 2 validates rather than executes. */
  'csa:execute-assessment': ['Line 1', 'Admin'],
  'knowledge:manage-documents': ['Line 2', 'Admin'],
  'rcm:edit-verification-design': ['Line 2', 'Admin'],
  'rcm:manage-controls': ['Line 2', 'Admin'],
  /** Super admin test bypass for Segregation of Duties */
  'workflow:bypass-sod': ['Admin'],
  'deficiency:edit-any-plan': ['Admin'],
  'deficiency:create-plan': ['Line 1', 'Admin'],
  'admin:manage-users': ['Admin'],
};

/**
 * Capability → role decision for the UI. `role` is the raw string the session
 * carries (boundary); an unknown value holds no capability, like `undefined`.
 */
export function can(role: string | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return CAPABILITY_ROLES[capability].includes(role as UserRole);
}

/** Exposed for the lock test and for callers that render a capability legend. */
export function rolesFor(capability: Capability): readonly UserRole[] {
  return CAPABILITY_ROLES[capability];
}
