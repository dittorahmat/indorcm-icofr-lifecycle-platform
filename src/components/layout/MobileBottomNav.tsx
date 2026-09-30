import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, ListTodo, Shield, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSidebar } from '@/components/ui/sidebar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const { t } = useTranslation('common');
  const { toggleSidebar } = useSidebar();

  // Query pending approvals or unread notifications for badge count
  const { data: unreadNotifications } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api<{ count: number }>('/api/notifications/unread-count'),
    refetchInterval: 30000,
  });

  const { data: csaSchedules } = useQuery({
    queryKey: ['csa-schedules'],
    queryFn: () => api<{ items: any[] }>('/api/csa/schedules'),
    refetchInterval: 30000,
  });

  const pendingCount = (csaSchedules?.items?.filter(s => s.status !== 'Completed').length || 0) +
                       (unreadNotifications?.count || 0);

  const navItems = [
    {
      to: '/dashboard',
      label: t('navigation.dashboard', { defaultValue: 'Dashboard' }),
      icon: LayoutDashboard,
    },
    {
      to: '/todo',
      label: t('navigation.todo', { defaultValue: 'Agenda' }),
      icon: ListTodo,
      badge: pendingCount > 0 ? (pendingCount > 9 ? '9+' : pendingCount) : undefined,
    },
    {
      to: '/csa',
      label: t('navigation.csa', { defaultValue: 'CSA' }),
      icon: CheckSquare,
    },
    {
      to: '/rcm',
      label: t('navigation.rcm', { defaultValue: 'RCM' }),
      icon: Shield,
    },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 border-t border-border shadow-lg pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-md transition-colors min-h-[44px]",
              isActive 
                ? "text-primary font-bold" 
                : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "stroke-[2.5]" : "stroke-[1.75]")} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs leading-none tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Menu Drawer Toggle */}
        <button
          type="button"
          onClick={() => toggleSidebar()}
          aria-label={t('navigation.menu', { defaultValue: 'Menu' })}
          className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-md text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <Menu className="h-5 w-5 mb-0.5 stroke-[1.75]" />
          <span className="text-xs font-medium leading-none tracking-tight">
            {t('navigation.menu', { defaultValue: 'Menu' })}
          </span>
        </button>
      </div>
    </nav>
  );
}
