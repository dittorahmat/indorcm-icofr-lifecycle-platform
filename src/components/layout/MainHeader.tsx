import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserRole } from '@shared/types';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/use-theme';
import { NotificationBell } from './NotificationBell';
import { LanguageSwitcher } from './LanguageSwitcher';
import { FiscalYearSelector } from './FiscalYearSelector';
import { useTranslation } from 'react-i18next';


export function MainHeader() {
  const currentRole = (localStorage.getItem('mockRole') as UserRole) || 'Line 1';
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const { t } = useTranslation('common');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('mockRole');
    localStorage.removeItem('userId');
    toast.success(t('notifications.logoutSuccess'));
    navigate('/');
  };

  return (
    <header className={cn(
      "sticky top-0 z-[100] w-full border-b transition-colors duration-300 shadow-md print:hidden",
      isDark
        ? "bg-slate-950 border-slate-800 text-slate-50"
        : "bg-mancity-pattern border-primary/20 text-primary-foreground"
    )}>
      <div className="flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 min-w-0">
          {/* Mobile Global Sidebar Trigger */}
          <SidebarTrigger 
            aria-label={t('navigation.toggleSidebar', { defaultValue: 'Toggle navigation menu' })}
            className={cn(
              "md:hidden h-9 w-9 min-h-[40px] min-w-[40px] shrink-0 rounded-lg text-white hover:bg-white/20 active:bg-white/30 border border-white/20 shadow-sm flex items-center justify-center",
              isDark && "text-slate-100 hover:bg-slate-800 border-slate-700"
            )} 
          />
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-1.5 md:gap-2 group shrink-0 min-h-[40px] py-1">
              <Shield className={cn(
                "h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-transform group-hover:scale-105 shrink-0",
                isDark ? "text-emerald-400" : "text-primary-foreground"
              )} />
              <span className={cn(
                "font-display tracking-tight text-xs xs:text-sm sm:text-base md:text-lg font-bold truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none",
                isDark ? "text-white" : "text-primary-foreground"
              )}>{t('appName')}</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          <FiscalYearSelector />
          <div className="hidden sm:flex items-center">
            <LanguageSwitcher />
          </div>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                aria-label={t('actions.openAccountMenu', { defaultValue: 'User account menu' })}
                className="relative cursor-pointer hover:opacity-90 transition-opacity p-0.5 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-white/20 shadow-sm ring-1 ring-black/5">
                  <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">
                    {currentRole.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-1 text-xs px-1 py-0.2 min-w-[18px] h-4.5 rounded-full flex items-center justify-center border font-bold shadow-sm select-none",
                    isDark
                      ? "bg-slate-900 border-slate-700 text-slate-200"
                      : "bg-white border-slate-300 text-slate-900"
                  )}
                  title={`Role: ${currentRole}`}
                >
                  {currentRole.toLowerCase().includes('lini 2') || currentRole.toLowerCase().includes('line 2')
                    ? 'L2'
                    : currentRole.toLowerCase().includes('lini 1') || currentRole.toLowerCase().includes('line 1')
                    ? 'L1'
                    : currentRole.toLowerCase().includes('lini 3') || currentRole.toLowerCase().includes('line 3')
                    ? 'L3'
                    : currentRole.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-bold">{t('account.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="sm:hidden px-2 py-1.5 flex items-center justify-between border-b pb-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">{t('settings.language', { defaultValue: 'Bahasa' })}</span>
                <LanguageSwitcher />
              </div>
              <DropdownMenuItem className="cursor-pointer font-medium">{t('account.profile')}</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-medium">{t('account.settings')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer font-bold">
                <LogOut className="mr-2 h-4 w-4" />
                {t('actions.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
