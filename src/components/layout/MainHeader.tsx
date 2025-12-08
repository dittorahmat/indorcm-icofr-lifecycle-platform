import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, ListChecks, FlaskConical, ClipboardX, BarChart, Menu, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserRole } from '@shared/types';
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Line 1', 'Line 2', 'Line 3', 'Admin'] },
  { href: '/rcm', label: 'RCM', icon: ListChecks, roles: ['Line 1', 'Line 2', 'Line 3', 'Admin'] },
  { href: '/csa', label: 'CSA', icon: ClipboardX, roles: ['Line 1'] },
  { href: '/testing', label: 'Testing', icon: FlaskConical, roles: ['Line 3'] },
  { href: '/deficiencies', label: 'Deficiencies', icon: ClipboardX, roles: ['Line 1', 'Line 2', 'Line 3', 'Admin'] },
  { href: '/reports', label: 'Reports', icon: BarChart, roles: ['Line 2', 'Line 3', 'Admin'] },
  { href: '/import', label: 'Import', icon: UploadCloud, roles: ['Line 2'] },
];
const roles: UserRole[] = ["Line 1", "Line 2", "Line 3", "Admin"];
export function MainHeader() {
  const [currentRole, setCurrentRole] = React.useState<UserRole>(() => (localStorage.getItem('mockRole') as UserRole) || 'Line 1');
  const location = useLocation();
  const handleRoleChange = React.useCallback((role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('mockRole', role);
    window.location.reload(); // Easiest way to refresh app state for demo
  }, []);
  const visibleNavItems = navItems.filter(item => item.roles.includes(currentRole));
  const roleBadgeVariant = {
    'Line 1': 'default',
    'Line 2': 'secondary',
    'Line 3': 'destructive',
    'Admin': 'outline',
  } as const;
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <Shield className="h-7 w-7 text-primary" />
              <span className="font-display">AstraICOFR</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Role: {currentRole}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Switch Mock Role</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {roles.map(role => (
                        <DropdownMenuItem key={role} onClick={() => handleRoleChange(role)}>
                          {role}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Simulate user role for access control</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ThemeToggle className="relative top-0 right-0" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative cursor-pointer">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Badge variant={roleBadgeVariant[currentRole]} className="absolute -bottom-1 -right-2 text-xs px-1">{currentRole.split(' ')[1] || 'A'}</Badge>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon"><Menu /></Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <nav className="grid gap-6 text-lg font-medium mt-8">
                    {visibleNavItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center gap-4 text-muted-foreground hover:text-foreground"
                      >
                        <item.icon className="h-6 w-6" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}