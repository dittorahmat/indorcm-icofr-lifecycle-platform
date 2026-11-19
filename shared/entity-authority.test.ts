import { describe, expect, it } from 'vitest';
import { CAPABILITY_ROLES, can, rolesFor, type Capability } from './entity-authority';
import { USER_ROLE_OPTIONS } from './role-options';
import { allowedRolesAt } from './workflow-transitions';
import { simulationApprovalStages } from './scoping-simulation-status';
import type { UserRole } from './types';

const ALL_ROLES: readonly UserRole[] = USER_ROLE_OPTIONS.map((option) => option.value);

/**
 * Vetted expectations — deliberately not recomputed from `CAPABILITY_ROLES`.
 * A capability added without a row here fails the exhaustiveness assertion.
 */
const EXPECTED: Record<Capability, readonly UserRole[]> = {
  'scoping:view-approvals': ['Admin', 'CFO', 'Commissioner'],
  'scoping:allocate-departments': ['Admin', 'Line 2'],
  'scoping:accept-ownership': ['Admin', 'Line 1'],
  'scoping:accept-ownership-any-department': ['Admin'],
  'scoping:view-all-departments': [
    'Admin',
    'CFO',
    'Commissioner',
    'External Auditor',
    'Line 2',
    'Line 3',
  ],
  'csa:execute-assessment': ['Admin', 'Line 1'],
  'knowledge:manage-documents': ['Admin', 'Line 2'],
  'rcm:edit-verification-design': ['Admin', 'Line 2'],
  'rcm:manage-controls': ['Admin', 'Line 2'],
  'workflow:bypass-sod': ['Admin'],
  'deficiency:edit-any-plan': ['Admin'],
  'deficiency:create-plan': ['Admin', 'Line 1'],
  'admin:manage-users': ['Admin'],
};

const sorted = <T extends string>(values: readonly T[]) => [...values].sort();

describe('entity-authority', () => {
  it('covers every capability exactly once', () => {
    expect(sorted(Object.keys(CAPABILITY_ROLES))).toEqual(sorted(Object.keys(EXPECTED)));
  });

  it.each(Object.entries(EXPECTED) as Array<[Capability, readonly UserRole[]]>)(
    'grants %s to exactly the declared roles',
    (capability, expected) => {
      const granted = ALL_ROLES.filter((role) => can(role, capability));
      expect(sorted(granted)).toEqual(sorted(expected));
      expect(sorted(rolesFor(capability))).toEqual(sorted(expected));
    },
  );

  it('fails closed for an unresolved or unknown role', () => {
    for (const capability of Object.keys(EXPECTED) as Capability[]) {
      expect(can(undefined, capability)).toBe(false);
      expect(can(null, capability)).toBe(false);
    }
  });

  it('derives the approval capability from the SCOPING table, not a second list', () => {
    const fromTable = new Set(simulationApprovalStages().flatMap((status) => allowedRolesAt('SCOPING', status)));

    expect(sorted(rolesFor('scoping:view-approvals'))).toEqual(sorted([...fromTable] as UserRole[]));
    // The pre-fix sidebar admitted Line 2 to a queue the table refuses.
    expect(can('Line 2', 'scoping:view-approvals')).toBe(false);
    expect(can('Line 1', 'scoping:view-approvals')).toBe(false);
  });

  it('gives the oversight roles no write capability', () => {
    const writeCapabilities = (Object.keys(EXPECTED) as Capability[]).filter(
      (capability) => capability !== 'scoping:view-all-departments',
    );
    for (const oversight of ['Line 3', 'External Auditor'] as const) {
      for (const capability of writeCapabilities) {
        expect(can(oversight, capability), `${oversight} must not hold ${capability}`).toBe(false);
      }
    }
  });
});
