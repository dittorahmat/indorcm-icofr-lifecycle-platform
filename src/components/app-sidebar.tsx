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
  Shield
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
} from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { MaterialitySimulation } from "@shared/types";

import { authClient } from "@/lib/auth-client";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

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
    <div className="h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse shadow-sm shadow-red-200">
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
    <Sidebar variant="sidebar" collapsible="none" className="w-64 border-r border-slate-300">
      <SidebarContent className="bg-[#87CEEB] pb-20 pt-4">
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-black uppercase text-[9px] tracking-widest h-6 px-4">
            {t('sections.main')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5" /> <span>{t('items.dashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-black uppercase text-[9px] tracking-widest h-6 px-4">
            {t('sections.icofrm')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/scoping")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/scoping" className="flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" /> <span>{t('items.scoping')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userRole === 'Line 2' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/import")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                  <Link to="/import" className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5" /> <span>{t('items.sync')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/bpm")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/bpm" className="flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5" /> <span>{t('items.bpm')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/todo")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/todo" className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" /> <span>{t('items.todo')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/csa" className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5" /> <span>{t('items.csaReports')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/notifications")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/notifications" className="flex items-center gap-2">
                  <Megaphone className="h-3.5 w-3.5" /> <span>{t('items.notifications')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/applications")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/applications" className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5" /> <span>{t('items.applications')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(userRole === 'Komisaris' || userRole === 'CFO' || userRole === 'Line 2' || userRole === 'Admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scoping/approval")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                  <Link to="/scoping/approval" className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" /> <span>{t('items.approval')}</span>
                    </div>
                    <PendingApprovalBadge role={userRole} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-black uppercase text-[9px] tracking-widest h-6 px-4">
            {t('sections.rcmMatrix')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/tlc")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/rcm/tlc" className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> <span>{t('items.rcmTlc')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/elc")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/rcm/elc" className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> <span>{t('items.rcmElc')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/itgc")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/rcm/itgc" className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> <span>{t('items.rcmItgc')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/change-log")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/change-log" className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5" /> <span>{t('items.changelog')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-black uppercase text-[9px] tracking-widest h-6 px-4">
            {t('groups.deficiency')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/deficiencies")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/deficiencies" className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5" /> <span>{t('items.deficiencies')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-black uppercase text-[9px] tracking-widest h-6 px-4">
            {t('groups.testing')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing?type=TOD")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/testing?type=TOD" className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> <span>{t('items.tod')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing?type=TOE")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/testing?type=TOE" className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5" /> <span>{t('items.toe')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-black text-black uppercase text-[9px] tracking-widest h-6 px-4">
            {t('groups.report')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/wbs-recap")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/wbs-recap" className="flex items-center gap-2">
                  <FileBarChart className="h-3.5 w-3.5" /> <span>{t('items.wbs')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/reports")} className="h-9 text-[11px] font-bold text-black hover:bg-white/20">
                <Link to="/reports" className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> <span>{t('items.app11')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-black/10 bg-[#87CEEB] py-4">
        <div className="px-4 text-[10px] font-bold text-black uppercase tracking-tighter leading-relaxed">
          {t('sections.copyright')}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
