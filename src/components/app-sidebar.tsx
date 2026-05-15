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
  Bell as BellIcon,
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
  PanelLeft,
  BrainCircuit
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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
import { NotificationBell } from "./layout/NotificationBell";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useAIChatStore } from "@/context/ai-chat-store";

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
    <div className="h-5 w-5 rounded-full bg-red-500 text-xs font-bold text-white flex items-center justify-center animate-pulse shadow-sm shadow-red-200">
      {count}
    </div>
  );
}

function NotificationBadge() {
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api<{ count: number }>('/api/notifications/unread-count'),
    refetchInterval: 30000 // Refetch every 30s
  });

  if (!notificationData?.count || notificationData.count <= 0) return null;

  return (
    <div className="h-5 w-5 rounded-full bg-rose-600 text-xs font-black text-white flex items-center justify-center animate-pulse shadow-sm shadow-rose-200">
      {notificationData.count > 9 ? '9+' : notificationData.count}
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

  const { toggleChat } = useAIChatStore();

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="w-64 border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        {/* MASTER */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-[11px] tracking-wider h-8 px-4">
            {t('groups.mainTasks')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")} className="h-10 text-sm" title={t('items.dashboard')}>
                <Link to="/dashboard" className="font-medium"><LayoutDashboard className="h-4 w-4" /> <span>{t('items.dashboard')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/scoping")} className="h-10 text-sm" title={t('items.scoping')}>
                <Link to="/scoping" className="font-medium"><Target className="h-4 w-4" /> <span>{t('items.scoping')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/bpm")} className="h-10 text-sm" title={t('items.bpm')}>
                <Link to="/bpm" className="font-medium"><Workflow className="h-4 w-4" /> <span>{t('items.bpm')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/todo")} className="h-10 text-sm" title={t('items.todo')}>
                <Link to="/todo" className="font-medium"><ListTodo className="h-4 w-4" /> <span>{t('items.todo')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(userRole === 'Komisaris' || userRole === 'CFO' || userRole === 'Line 2' || userRole === 'Admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scoping/approval")} className="h-10 text-sm">
                  <Link to="/scoping/approval" className="flex items-center justify-between w-full font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> <span>{t('items.approval')}</span>
                    </div>
                    <PendingApprovalBadge role={userRole} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/applications")} className="h-10 text-sm" title={t('items.applications')}>
                <Link to="/applications" className="font-medium"><Cpu className="h-4 w-4" /> <span>{t('items.applications')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Report */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-[11px] tracking-wider h-8 px-4">
            {t('groups.reportingRcm')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/elc")} className="h-10 text-sm">
                <Link to="/rcm/elc" className="font-medium"><Shield className="h-4 w-4" /> <span>{t('items.rcmElc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/tlc")} className="h-10 text-sm">
                <Link to="/rcm/tlc" className="font-medium"><ListChecks className="h-4 w-4" /> <span>{t('items.rcmTlc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/itgc")} className="h-10 text-sm">
                <Link to="/rcm/itgc" className="font-medium"><Database className="h-4 w-4" /> <span>{t('items.rcmItgc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")} className="h-10 text-sm" title={t('items.csaReports')}>
                <Link to="/csa" className="font-medium"><ClipboardCheck className="h-4 w-4" /> <span>{t('items.csaReports')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/wbs-recap")} className="h-10 text-sm">
                <Link to="/wbs-recap" className="font-medium"><AlertTriangle className="h-4 w-4" /> <span>{t('items.wbs')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/reports")} className="h-10 text-sm">
                <Link to="/reports" className="font-medium"><FileBarChart className="h-4 w-4" /> <span>{t('items.app11')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* TOD/TOE */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-[11px] tracking-wider h-8 px-4">
            {t('groups.testing')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing?type=TOD")} className="h-10 text-sm">
                <Link to="/testing?type=TOD" className="font-medium"><Search className="h-4 w-4" /> <span>{t('items.tod')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing?type=TOE")} className="h-10 text-sm">
                <Link to="/testing?type=TOE" className="font-medium"><History className="h-4 w-4" /> <span>{t('items.toe')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/deficiencies")} className="h-10 text-sm">
                <Link to="/deficiencies" className="font-medium"><AlertTriangle className="h-4 w-4" /> <span>{t('items.deficiencies')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Others */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-[11px] tracking-wider h-8 px-4">
            {t('groups.others')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")} className="h-10 text-sm">
                <Link to="/ai-hub" className="font-medium"><BrainCircuit className="h-4 w-4" /> <span>{t('items.aiAnalytics')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={toggleChat} 
                className="h-10 text-sm font-medium"
                title={t('items.aiAssistant')}
              >
                <Bot className="h-4 w-4 text-primary" />
                <span>{t('items.aiAssistant')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/documents")} className="h-10 text-sm">
                <Link to="/documents" className="font-medium"><FileText className="h-4 w-4" /> <span>{t('items.documents')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/notifications")} className="h-10 text-sm">
                <Link to="/notifications" className="flex items-center justify-between w-full font-medium">
                  <div className="flex items-center gap-2">
                    <BellIcon className="h-4 w-4" /> <span>{t('items.notifications')}</span>
                  </div>
                  <NotificationBadge />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* User */}
        <SidebarGroup className="mt-auto pt-2 pb-6">
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings")} className="h-10 text-sm">
                <Link to="/settings" className="font-medium"><Settings2 className="h-4 w-4" /> <span>{t('items.settings')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userRole === 'Admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/users")} className="h-10 text-sm">
                  <Link to="/admin/users" className="font-medium"><UserCog className="h-4 w-4" /> <span>{t('items.adminUsers')}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="h-10 text-sm text-destructive hover:bg-destructive/5 hover:text-destructive font-medium"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>{t('items.logout')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
