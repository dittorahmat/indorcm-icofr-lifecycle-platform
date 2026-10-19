import { describe, it, expect } from 'vitest';
import { ROLLOVER_ROLES, canRunRollover } from './rollover-roles';
import type { UserRole } from './types/common';

const ALL_ROLES: UserRole[] = [
  'Line 1',
  'Line 2',
  'Line 3',
  'Admin',
  'External Auditor',
  'Commissioner',
  'CFO',
];

/**
 * #103: the rollover is internal audit's and the super admin's operation. The
 * list is asserted against the whole union so a role added later is a visible
 * decision here, not an implicit grant.
 */
describe('rollover role policy (#103)', () => {
  it('admits internal audit and the super admin, and nobody else', () => {
    expect(ROLLOVER_ROLES).toEqual(['Line 3', 'Admin']);
    expect(ALL_ROLES.filter(canRunRollover)).toEqual(['Line 3', 'Admin']);
  });

  it('refuses the preparers, the approvers and the external auditor', () => {
    const refused: UserRole[] = ['Line 1', 'Line 2', 'CFO', 'Commissioner', 'External Auditor'];
    for (const role of refused) expect(canRunRollover(role), role).toBe(false);
  });

  it('refuses an absent role while the session is still loading', () => {
    expect(canRunRollover(undefined)).toBe(false);
    expect(canRunRollover(null)).toBe(false);
  });
});
