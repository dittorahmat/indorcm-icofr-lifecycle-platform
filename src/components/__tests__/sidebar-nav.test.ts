import { describe, expect, it } from 'vitest';
import { validateI18nKey } from '@/test/mock-i18n';
import {
  NAV_GROUPS,
  USER_NAV_ITEMS,
  visibleNavGroups,
  visibleUserNavItems,
  type SidebarNavItem,
} from '../layout/sidebar-nav';
import type { UserRole } from '@shared/types';

const ALL_ITEMS: SidebarNavItem[] = [
  ...NAV_GROUPS.flatMap((group) => [...group.items]),
  ...USER_NAV_ITEMS,
];

const linkPaths = (items: readonly SidebarNavItem[]): string[] =>
  items.flatMap((item) => (item.kind === 'link' ? [item.path] : []));

describe('sidebar navigation data', () => {
  it('resolves every label through the sidebar bundle', () => {
    for (const item of ALL_ITEMS) validateI18nKey(item.labelKey);
    for (const group of NAV_GROUPS) validateI18nKey(group.labelKey);
  });

  it('keeps link paths absolute and unique (no two rows point at one page)', () => {
    const paths = linkPaths(ALL_ITEMS);
    expect(paths.every((path) => path.startsWith('/'))).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps the Appendix 10 entry between WBS and Appendix 11 inside the reporting group, followed by Visual Analytics', () => {
    const reporting = NAV_GROUPS.find((group) => group.labelKey === 'groups.reportingRcm');
    expect(reporting).toBeDefined();
    expect(linkPaths(reporting?.items ?? [])).toEqual([
      '/rcm/elc',
      '/rcm/tlc',
      '/rcm/itgc',
      '/wbs-recap',
      '/reports/appendix-10',
      '/reports',
      '/analytics',
    ]);
  });

  it('shows the approval queue only to the roles the SCOPING table authorises', () => {
    const approval = (role: UserRole | undefined) =>
      linkPaths(visibleNavGroups(role).flatMap((group) => [...group.items])).includes('/scoping/approval');

    expect(approval('CFO')).toBe(true);
    expect(approval('Commissioner')).toBe(true);
    expect(approval('Admin')).toBe(true);
    expect(approval('Line 1')).toBe(false);
    expect(approval('Line 2')).toBe(false);
    expect(approval('Line 3')).toBe(false);
    expect(approval('External Auditor')).toBe(false);
    expect(approval(undefined)).toBe(false);
  });

  it('shows user management only to Admin and keeps the self-scoped rows for everyone', () => {
    const paths = (role: UserRole | undefined) => linkPaths(visibleUserNavItems(role));

    expect(paths('Admin')).toContain('/admin/users');
    for (const role of ['Line 1', 'Line 2', 'Line 3', 'CFO', 'Commissioner', 'External Auditor'] as const) {
      expect(paths(role), role).not.toContain('/admin/users');
    }
    expect(paths(undefined)).toEqual(['/settings']);
    expect(visibleUserNavItems(undefined).some((item) => item.kind === 'action')).toBe(true);
  });

  it('keeps every group for an unresolved role except capability-gated rows', () => {
    const groups = visibleNavGroups(undefined);
    expect(groups.map((group) => group.labelKey)).toEqual([
      'groups.mainTasks',
      'groups.reportingRcm',
      'groups.testing',
      'groups.others',
    ]);
    expect(linkPaths(groups.flatMap((group) => [...group.items]))).not.toContain('/scoping/approval');
  });
});
