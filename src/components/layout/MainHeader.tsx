import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';

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
      "sticky top-0 z-[100] w-full border-b transition-colors duration-300 shadow-sm print:hidden",
      isDark
        ? "bg-slate-950 border-slate-800 text-slate-50"
        : "bg-surface-container-low border-border/60 text-foreground"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 gap-2 py-2 sm:py-1 min-w-0 max-w-full flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 min-w-0 max-w-full w-full sm:w-auto">
          {/* Mobile Global Sidebar Trigger */}
          <SidebarTrigger 
            aria-label={t('navigation.toggleSidebar', { defaultValue: 'Toggle navigation menu' })}
            className={cn(
              "md:hidden h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-md text-foreground hover:bg-surface-container active:bg-surface-container-high border border-border/80 shadow-sm flex items-center justify-center",
              isDark && "text-slate-100 hover:bg-slate-800 border-slate-700"
            )} 
          />
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full flex-wrap">
            <Link to="/dashboard" className="flex items-center gap-1.5 md:gap-2 group shrink-0 min-h-[44px] min-w-[44px] py-1">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Shield className="h-4 w-4 transition-transform group-hover:scale-105" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={cn(
                  "font-display tracking-tight text-xs sm:text-base font-bold truncate max-w-[110px] min-[420px]:max-w-[150px] sm:max-w-none text-primary",
                  isDark && "text-white"
                )}>{t('appName')}</span>
                <span className="hidden lg:inline text-xs text-muted-foreground font-medium leading-none">
                  {t('header.subTitle')}
                </span>
              </div>
            </Link>

            {/* Compliance Status Badge */}
            <div className="hidden min-[480px]:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 border border-secondary/20 text-secondary text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-foreground/80 font-medium">{t('header.complianceStatus')}:</span>
              <span className="font-bold text-secondary">{t('header.statusActive')}</span>
            </div>

            {/* Cycle Indicator Badge */}
            <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-border/60 text-muted-foreground text-xs font-medium">
              <span className="text-foreground/70 font-semibold">{t('header.bumnHolding')}</span>
              <span>•</span>
              <span>{t('header.assessmentCycle')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0 max-w-full flex-wrap w-full sm:w-auto justify-end shrink-0">
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
                className="relative cursor-pointer hover:opacity-90 transition-opacity p-0.5 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-border/60 shadow-sm ring-1 ring-black/5">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {currentRole.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>
                <span
                   className={cn(
                    "absolute -bottom-0.5 -right-1 text-xs px-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center border font-bold shadow-sm select-none",
                    isDark
                      ? "bg-slate-900 border-slate-700 text-slate-200"
                      : "bg-surface border-border text-foreground"
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
              <div className="sm:hidden px-2 py-1.5 flex flex-col min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between border-b pb-2 mb-1 gap-2">
                <span className="text-xs font-medium text-muted-foreground min-w-0 truncate">{t('settings.language', { defaultValue: 'Bahasa' })}</span>
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
