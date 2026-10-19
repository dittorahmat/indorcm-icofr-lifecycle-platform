import { describe, it, expect, vi } from 'vitest';
import { resolveRequestRole } from '../request-role';
import type { DrizzleDb } from '../../db';

/**
 * #106 — the request gate's half of the role rule. The middleware around this
 * call needs a live Better Auth session; the resolution itself needs a database,
 * so it is locked here.
 */
const stubDb = (rows: { role: string | null }[]): DrizzleDb => {
  const db: DrizzleDb = Object.create(null);
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve(rows)) })),
    })),
  }));
  return Object.assign(db, { select });
};

const failingDb = (): DrizzleDb => {
  const db: DrizzleDb = Object.create(null);
  return Object.assign(db, {
    select: () => {
      throw new Error('read failed');
    },
  });
};

describe('resolveRequestRole (#106)', () => {
  it('runs a seeded user as their ICOFR role, not as Better Auth "member"', async () => {
    expect(await resolveRequestRole(stubDb([{ role: 'member' }]), 'u-1', 'org-1', 'Line 2')).toBe('Line 2');
  });

  it('still honours a membership row that already carries an ICOFR role', async () => {
    expect(await resolveRequestRole(stubDb([{ role: 'CFO' }]), 'u-1', 'org-1', 'Line 1')).toBe('CFO');
  });

  it('falls back to the session role when the membership row is absent', async () => {
    expect(await resolveRequestRole(stubDb([]), 'u-1', 'org-1', 'Line 3')).toBe('Line 3');
  });

  it('does not read the membership for a global Admin', async () => {
    const db = stubDb([{ role: 'Line 1' }]);

    expect(await resolveRequestRole(db, 'u-1', 'org-1', 'Admin')).toBe('Admin');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('does not read the membership without an active organization', async () => {
    const db = stubDb([{ role: 'Line 1' }]);

    expect(await resolveRequestRole(db, 'u-1', '', 'Commissioner')).toBe('Commissioner');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('treats an unreadable membership as the session role instead of failing the request', async () => {
    expect(await resolveRequestRole(failingDb(), 'u-1', 'org-1', 'Line 1')).toBe('Line 1');
  });

  it('floors an unrecognised pair at Line 1', async () => {
    expect(await resolveRequestRole(stubDb([{ role: 'owner' }]), 'u-1', 'org-1', null)).toBe('Line 1');
  });
});
