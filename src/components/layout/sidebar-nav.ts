import {
  AlertTriangle,
  Bell,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  Cpu,
  Database,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  LogOut,
  Settings2,
  Shield,
  ShieldCheck,
  Target,
  UserCog,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { can, type Capability } from '@shared/entity-authority';
import type { UserRole } from '@shared/types';

/**
 * The sidebar's navigation is data, not twenty hand-copied JSX blocks.
 *
 * Adding a page is one entry here; visibility is a capability from
 * `shared/entity-authority.ts` (never a role literal in the view), and a badge
 * is a named slot instead of bespoke markup per row.
 */
export type SidebarBadge = 'approvals' | 'notifications';

export interface SidebarLinkItem {
  kind: 'link';
  path: string;
  labelKey: string;
  icon: LucideIcon;
  capability?: Capability;
  badge?: SidebarBadge;
}

export interface SidebarActionItem {
  kind: 'action';
  action: 'ai-assistant' | 'logout';
  labelKey: string;
  icon: LucideIcon;
}

export type SidebarNavItem = SidebarLinkItem | SidebarActionItem;

export interface SidebarNavGroup {
  labelKey: string;
  items: readonly SidebarNavItem[];
}

export const NAV_GROUPS: readonly SidebarNavGroup[] = [
  {
    labelKey: 'groups.mainTasks',
    items: [
      { kind: 'link', path: '/dashboard', labelKey: 'items.dashboard', icon: LayoutDashboard },
      { kind: 'link', path: '/scoping', labelKey: 'items.scoping', icon: Target },
      { kind: 'link', path: '/bpm', labelKey: 'items.bpm', icon: Workflow },
      { kind: 'link', path: '/todo', labelKey: 'items.todo', icon: ListTodo },
      {
        kind: 'link',
        path: '/scoping/approval',
        labelKey: 'items.approval',
        icon: ShieldCheck,
        capability: 'scoping:view-approvals',
        badge: 'approvals',
      },
      { kind: 'link', path: '/csa', labelKey: 'items.csaReports', icon: ClipboardCheck },
      {
        kind: 'link',
        path: '/rcm/verification-design',
        labelKey: 'items.verificationDesign',
        icon: ClipboardCheck,
      },
      { kind: 'link', path: '/applications', labelKey: 'items.applications', icon: Cpu },
    ],
  },
  {
    labelKey: 'groups.reportingRcm',
    items: [
      { kind: 'link', path: '/rcm/elc', labelKey: 'items.rcmElc', icon: Shield },
      { kind: 'link', path: '/rcm/tlc', labelKey: 'items.rcmTlc', icon: ListChecks },
      { kind: 'link', path: '/rcm/itgc', labelKey: 'items.rcmItgc', icon: Database },
      { kind: 'link', path: '/wbs-recap', labelKey: 'items.wbs', icon: AlertTriangle },
      { kind: 'link', path: '/reports/appendix-10', labelKey: 'items.app10', icon: FileSpreadsheet },
      { kind: 'link', path: '/reports', labelKey: 'items.app11', icon: FileBarChart },
    ],
  },
  {
    labelKey: 'groups.testing',
    items: [
      { kind: 'link', path: '/deficiencies', labelKey: 'items.deficiencies', icon: AlertTriangle },
    ],
  },
  {
    labelKey: 'groups.others',
    items: [
      { kind: 'link', path: '/ai-hub', labelKey: 'items.aiAnalytics', icon: BrainCircuit },
      { kind: 'action', action: 'ai-assistant', labelKey: 'items.aiAssistant', icon: Bot },
      { kind: 'link', path: '/documents', labelKey: 'items.documents', icon: FileText },
      {
        kind: 'link',
        path: '/notifications',
        labelKey: 'items.notifications',
        icon: Bell,
        badge: 'notifications',
      },
    ],
  },
];

export const USER_NAV_ITEMS: readonly SidebarNavItem[] = [
  { kind: 'link', path: '/settings', labelKey: 'items.settings', icon: Settings2 },
  {
    kind: 'link',
    path: '/admin/users',
    labelKey: 'items.adminUsers',
    icon: UserCog,
    capability: 'admin:manage-users',
  },
  { kind: 'action', action: 'logout', labelKey: 'items.logout', icon: LogOut },
];

function isVisible(item: SidebarNavItem, role: UserRole | undefined): boolean {
  if (item.kind === 'action') return true;
  return !item.capability || can(role, item.capability);
}

export function visibleNavGroups(role: UserRole | undefined): SidebarNavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isVisible(item, role)),
  })).filter((group) => group.items.length > 0);
}

export function visibleUserNavItems(role: UserRole | undefined): SidebarNavItem[] {
  return USER_NAV_ITEMS.filter((item) => isVisible(item, role));
}
