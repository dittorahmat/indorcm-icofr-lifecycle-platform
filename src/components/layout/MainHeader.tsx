import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Languages } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserRole } from '@shared/types';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/use-theme';
import { NotificationBell } from './NotificationBell';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';


export function MainHeader() {
  const currentRole = (localStorage.getItem('mockRole') as UserRole) || 'Line 1';
  const location = useLocation();
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
      "sticky top-0 z-[100] w-full border-b transition-colors duration-300",
      isDark
        ? "bg-slate-950 border-slate-800 text-slate-50"
        : "bg-primary border-primary/10 text-primary-foreground"
    )}>
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <Shield className={cn(
                "h-7 w-7 transition-transform group-hover:scale-110",
                isDark ? "text-emerald-400" : "text-white"
              )} />
              <span className="font-display tracking-tight text-white text-lg font-bold hidden sm:inline-block">IndoGRC Pro</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative cursor-pointer hover:opacity-80 transition-opacity ml-2">
                <Avatar className="h-9 w-9 border-2 border-white/10 shadow-sm">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback className="bg-slate-800 text-white font-bold">CN</AvatarFallback>
                </Avatar>
                <Badge
                  variant={isDark ? "outline" : "secondary"}
                  className={cn(
                    "absolute -bottom-1 -right-2 text-[10px] px-1 h-4 min-w-[16px] justify-center border-slate-900 shadow-sm",
                    !isDark && "bg-white text-slate-900 hover:bg-white font-black"
                  )}
                >
                  {currentRole.split(' ').pop()?.substring(0, 1)}
                </Badge>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-bold">{t('account.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
