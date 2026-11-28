import { Link } from 'react-router-dom';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { UserRole } from '@shared/types';
import { useTranslation } from 'react-i18next';
import type { SidebarNavItem } from './sidebar-nav';
import { NotificationBadge, PendingApprovalBadge } from './SidebarBadges';

export const SIDEBAR_ITEM_CLASS =
  'min-h-[44px] h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight';

const ACTION_CLASS =
  'h-11 sm:h-9 min-h-[44px] sm:min-h-0 px-3 rounded-md transition-all hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 active:scale-[0.98] font-semibold text-sm';

interface SidebarNavItemProps {
  item: SidebarNavItem;
  role: UserRole | undefined;
  isActivePath: (path: string) => boolean;
  withYear: (path: string) => string;
  onAction: (action: 'ai-assistant' | 'logout') => void;
}

/** One sidebar row. The only renderer of a navigation entry. */
export function SidebarNavItemRow({ item, role, isActivePath, withYear, onAction }: SidebarNavItemProps) {
  const { t } = useTranslation('sidebar');
  const label = t(item.labelKey);

  if (item.kind === 'action') {
    const isLogout = item.action === 'logout';
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => onAction(item.action)}
          title={label}
          className={cn(
            ACTION_CLASS,
            isLogout && 'text-rose-600 hover:bg-rose-50 hover:text-rose-700',
          )}
        >
          <item.icon className={cn('h-4 w-4', !isLogout && 'text-primary', isLogout && 'shrink-0')} />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActivePath(item.path)} className={SIDEBAR_ITEM_CLASS} title={label}>
        <Link
          to={withYear(item.path)}
          className="flex w-full flex-wrap items-center justify-between gap-2 font-semibold text-sm"
        >
          <div className="flex min-w-0 items-center gap-2">
            <item.icon className="h-4 w-4" />
            <span>{label}</span>
          </div>
          {item.badge === 'approvals' ? <PendingApprovalBadge role={role} /> : null}
          {item.badge === 'notifications' ? <NotificationBadge /> : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
