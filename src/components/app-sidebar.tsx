import React, { useEffect } from "react";
import { 
  LayoutDashboard, 
  Target, 
  ShieldCheck, 
  BookOpen,
  CheckSquare, 
  Microscope, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  FileText,
  Briefcase,
  History,
  Megaphone,
  Network,
  UploadCloud,
  Cpu,
  Bot,
  UserCog,
  Workflow,
  Database,
  ShieldAlert,
  ClipboardCheck,
  Search,
  ListChecks,
  Settings2,
  RefreshCw,
  FileBarChart,
  Calendar as CalendarIcon,
  ListTodo,
  LogOut,
  Shield,
  Pin,
  PinOff,
  PanelLeft
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { MaterialitySimulation } from "@shared/types";

import { authClient } from "@/lib/auth-client";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

function PendingApprovalBadge({ role }: { role: string | null | undefined }) {
  const { data: simulations } = useQuery({
    queryKey: ['simulations-pending-badge'],
    queryFn: () => api<{ items: MaterialitySimulation[] }>('/api/simulations'),
    enabled: role === 'CFO' || role === 'Komisaris' || role === 'Admin',
    refetchInterval: 30000, // Poll every 30s
  });

  const count = simulations?.items.filter(s => {
    if (role === 'CFO') return s.status === 'Pending CFO';
    if (role === 'Komisaris') return s.status === 'Pending Komut';
    if (role === 'Admin') return s.status === 'Pending CFO' || s.status === 'Pending Komut';
    return false;
  }).length || 0;

  if (count === 0) return null;

  return (
    <div className="h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse shadow-sm shadow-red-200">
      {count}
    </div>
  );
}

export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { t, i18n } = useTranslation('sidebar');
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role;
  const { isPinned, setIsPinned, state, toggleSidebar, setOpen } = useSidebar();

  useEffect(() => {
    const userLang = (session?.user as any)?.language;
    if (userLang && i18n.language !== userLang) {
      i18n.changeLanguage(userLang);
    }
  }, [session?.user, i18n]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/");
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="w-64 border-r">
      <SidebarContent className="pt-2">
        {userRole === 'External Auditor' && (
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="font-black text-slate-400 uppercase text-[14px] tracking-widest h-10 px-4">
              {t('groups.master')}
            </SidebarGroupLabel>
            <SidebarMenu className="px-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/audit-portal")} className="h-12 text-[16px]">
                  <Link to="/audit-portal"><Briefcase className="h-5 w-5 text-blue-600" /> <span className="font-bold text-blue-700">{t('sections.auditPortal')}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-slate-400 uppercase text-[14px] tracking-widest h-10 px-4">
            {t('groups.master')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")} className="h-12 text-[16px]">
                <Link to="/dashboard" className="font-bold"><LayoutDashboard className="h-5 w-5" /> <span>{t('items.dashboard')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/scoping")} className="h-12 text-[16px]">
                <Link to="/scoping" className="font-bold"><Settings2 className="h-5 w-5" /> <span>{t('items.scoping')}</span></Link>    
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userRole === 'Line 2' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/import")} className="h-12 text-[16px]">
                  <Link to="/import" className="font-bold"><RefreshCw className="h-5 w-5" /> <span>{t('items.sync')}</span></Link>      
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/bpm")} className="h-12 text-[16px]">
                <Link to="/bpm" className="font-bold"><ListChecks className="h-5 w-5" /> <span>{t('items.bpm')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/todo")} className="h-12 text-[16px]">
                <Link to="/todo" className="font-bold"><CalendarIcon className="h-5 w-5" /> <span>{t('items.todo')}</span></Link>       
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")} className="h-12 text-[16px]">
                <Link to="/csa" className="font-bold"><History className="h-5 w-5" /> <span>{t('items.csaReports')}</span></Link>       
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/notifications")} className="h-12 text-[16px]">
                <Link to="/notifications" className="font-bold"><Megaphone className="h-5 w-5" /> <span>{t('items.notifications')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/applications")} className="h-12 text-[16px]">
                <Link to="/applications" className="font-bold"><Cpu className="h-5 w-5 text-indigo-500" /> <span>{t('items.applications')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(userRole === 'Komisaris' || userRole === 'CFO' || userRole === 'Line 2' || userRole === 'Admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scoping/approval")} className="h-12 text-[16px]">
                  <Link to="/scoping/approval" className="flex items-center justify-between w-full font-bold">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" /> <span>{t('items.approval')}</span>
                    </div>
                    <PendingApprovalBadge role={userRole} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-slate-400 uppercase text-[14px] tracking-widest h-10 px-4">
            {t('sections.rcmMatrix')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/tlc")} className="h-12 text-[16px]">
                <Link to="/rcm/tlc" className="font-bold"><ShieldCheck className="h-5 w-5 text-emerald-500" /> <span>{t('items.rcmTlc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/elc")} className="h-12 text-[16px]">
                <Link to="/rcm/elc" className="font-bold"><ShieldCheck className="h-5 w-5 text-indigo-500" /> <span>{t('items.rcmElc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/itgc")} className="h-12 text-[16px]">
                <Link to="/rcm/itgc" className="font-bold"><ShieldCheck className="h-5 w-5 text-blue-500" /> <span>{t('items.rcmItgc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/change-log")} className="h-12 text-[16px]">
                <Link to="/change-log" className="font-bold"><History className="h-5 w-5" /> <span>{t('items.changelog')}</span></Link> 
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-slate-400 uppercase text-[14px] tracking-widest h-10 px-4">
            {t('groups.deficiency')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/deficiencies")} className="h-12 text-[16px]">
                <Link to="/deficiencies" className="font-bold"><ShieldAlert className="h-5 w-5" /> <span>{t('items.deficiencies')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-slate-400 uppercase text-[14px] tracking-widest h-10 px-4">
            {t('groups.testing')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing?type=TOD")} className="h-12 text-[16px]">
                <Link to="/testing?type=TOD" className="font-bold"><ShieldCheck className="h-5 w-5" /> <span>{t('items.tod')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing?type=TOE")} className="h-12 text-[16px]">
                <Link to="/testing?type=TOE" className="font-bold"><ShieldAlert className="h-5 w-5" /> <span>{t('items.toe')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-slate-400 uppercase text-[14px] tracking-widest h-10 px-4">
            {t('groups.report')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/wbs-recap")} className="h-12 text-[16px]">
                <Link to="/wbs-recap" className="font-bold"><FileBarChart className="h-5 w-5" /> <span>{t('items.wbs')}</span></Link>   
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/reports")} className="h-12 text-[16px]">
                <Link to="/reports" className="font-bold"><FileText className="h-5 w-5 opacity-70" /> <span>{t('items.app11')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t pt-2">
          <SidebarGroupLabel className="font-black text-slate-400 uppercase text-[14px] tracking-widest h-10 px-4">
            {t('groups.user')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <div className="px-2 pb-1 pt-1">
                 <LanguageSwitcher />
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings")} className="h-12 text-[16px]">
                <Link to="/settings" className="font-bold"><UserCog className="h-5 w-5" /> <span>{t('items.settings')}</span></Link>    
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userRole === 'Admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/users")} className="h-12 text-[16px]">
                  <Link to="/admin/users" className="font-bold text-amber-600"><UserCog className="h-5 w-5" /> <span>{t('items.adminUsers')}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
             <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="h-12 text-[16px] text-destructive hover:bg-destructive/10 hover:text-destructive font-bold"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>{t('items.logout')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
          {t('sections.copyright')}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
