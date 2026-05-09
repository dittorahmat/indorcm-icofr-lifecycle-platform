import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LogOut , Pin, PinOff, Languages } from 'lucide-react';
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
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';


export function MainHeader() {
  const currentRole = (localStorage.getItem('mockRole') as UserRole) || 'Line 1';
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isPinned, setIsPinned } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('mockRole');
    localStorage.removeItem('userId');
    toast.success('Logout successful');
    navigate('/');
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b transition-colors duration-300",
      isDark
        ? "bg-[#022c22] border-emerald-900/50 text-emerald-50"
        : "bg-[#417dc1] border-blue-700 text-white shadow-md"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className={cn(
                "h-9 w-9",
                !isDark && "text-white hover:bg-white/10"
              )} />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-9 w-9",
                  !isDark && "text-white/70 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4 opacity-50" />}
              </Button>

              <Link to="/dashboard" className="flex items-center gap-2 group ml-2">
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
                  <Avatar className="h-9 w-9 border-2 border-white/20">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback className="bg-blue-800 text-white">CN</AvatarFallback>
                  </Avatar>
                  <Badge
                    variant={isDark ? "outline" : "secondary"}
                    className={cn(
                      "absolute -bottom-1 -right-2 text-[10px] px-1 h-4 min-w-[16px] justify-center border-blue-900",
                      !isDark && "bg-white text-blue-700 hover:bg-white font-bold"
                    )}
                  >
                    {currentRole.split(' ').pop()?.substring(0, 1)}
                  </Badge>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-bold">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer font-medium">Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-medium">Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer font-bold">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
