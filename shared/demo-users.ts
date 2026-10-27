import type { User } from './types';

/**
 * getFriendlyEmail — canonical mapping of BUMN persona emails for PT BNS.
 * Shared between seed scripts, demo runners, and authorization assertions.
 */
export function getFriendlyEmail(u: Pick<User, 'role' | 'departmentId' | 'level'>): string {
  if (u.role === 'Line 2') return 'line2@bumn.go.id';
  if (u.role === 'Line 3') return 'line3@bumn.go.id';
  if (u.role === 'CFO') return 'cfo@bumn.go.id';
  if (u.role === 'Commissioner' || (u.role as string) === 'Komisaris') return 'komisaris@bumn.go.id';
  if (u.role === 'Admin') return 'admin@bumn.go.id';
  if (u.role === 'External Auditor') return 'external@bumn.go.id';
  const deptSuffix = u.departmentId?.replace('dept-', '') || 'ops';
  const levelPrefix = u.level?.toLowerCase() || 'staff';
  return `${levelPrefix}.${deptSuffix}@bumn.go.id`.toLowerCase();
}
