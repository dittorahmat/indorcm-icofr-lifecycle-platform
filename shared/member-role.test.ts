import { describe, it, expect } from 'vitest';
import { resolveUserRole, toMemberRole } from './member-role';
import type { UserRole } from './types/common';

describe('toMemberRole (#106)', () => {
  it('maps the super admin to Better Auth admin and everyone else to member', () => {
    expect(toMemberRole('Admin')).toBe('admin');
    for (const role of ['Line 1', 'Line 2', 'Line 3', 'CFO', 'Commissioner', 'External Auditor'] satisfies UserRole[]) {
      expect(toMemberRole(role), role).toBe('member');
    }
  });
});

describe('resolveUserRole (#106)', () => {
  it('prefers a member row that already carries an ICOFR role', () => {
    expect(resolveUserRole('Line 2', 'Line 1')).toBe('Line 2');
    expect(resolveUserRole('Admin', 'Line 1')).toBe('Admin');
  });

  it('falls back to the session role while member.role holds Better Auth vocabulary', () => {
    // The seeded shape: user.role is the ICOFR role, member.role is 'member'.
    expect(resolveUserRole('member', 'Line 2')).toBe('Line 2');
    expect(resolveUserRole('admin', 'CFO')).toBe('CFO');
  });

  it('falls back to the session role when the member row is absent or not read', () => {
    expect(resolveUserRole(null, 'Line 3')).toBe('Line 3');
    expect(resolveUserRole(undefined, 'Commissioner')).toBe('Commissioner');
  });

  it('floors an unrecognised pair at Line 1, never at a privileged role', () => {
    expect(resolveUserRole('member', null)).toBe('Line 1');
    expect(resolveUserRole('owner', '')).toBe('Line 1');
    expect(resolveUserRole(42, {})).toBe('Line 1');
  });
});
