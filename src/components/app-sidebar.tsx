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
import { MaterialitySimulation, BPMProcess, ActionPlan } from "@shared/types";

import { authClient } from "@/lib/auth-client";
import { useFiscalYearStore } from "@/store/useFiscalYearStore";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./layout/NotificationBell";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useAIChatStore } from "@/context/ai-chat-store";
import { registeredExtensions } from "@/extensions";
import * as LucideIcons from "lucide-react";

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) {
    return <LucideIcons.HelpCircle className={className} />;
  }
  return <IconComponent className={className} />;
}


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
    <Sidebar variant="sidebar" collapsible="icon" className="w-64 border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="py-4">
        {/* MASTER */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-xs tracking-wider h-8 px-6 mb-1">
            {t('groups.mainTasks')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-3 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight" title={t('items.dashboard')}>
                <Link to="/dashboard" className="font-semibold text-sm"><LayoutDashboard className="h-4 w-4" /> <span>{t('items.dashboard')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/scoping")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight" title={t('items.scoping')}>
                <Link to="/scoping" className="font-semibold text-sm"><Target className="h-4 w-4" /> <span>{t('items.scoping')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/bpm")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight" title={t('items.bpm')}>
                <Link to="/bpm" className="flex items-center justify-between w-full font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4" /> <span>{t('items.bpm')}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/todo")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight" title={t('items.todo')}>
                <Link to="/todo" className="font-semibold text-sm"><ListTodo className="h-4 w-4" /> <span>{t('items.todo')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(userRole === 'Komisaris' || userRole === 'CFO' || userRole === 'Line 2' || userRole === 'Admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scoping/approval")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                  <Link to="/scoping/approval" className="flex items-center justify-between w-full font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> <span>{t('items.approval')}</span>
                    </div>
                    <PendingApprovalBadge role={userRole} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight" title={t('items.csaReports')}>
                <Link to="/csa" className="font-semibold text-sm"><ClipboardCheck className="h-4 w-4" /> <span>{t('items.csaReports')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/applications")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight" title={t('items.applications')}>
                <Link to="/applications" className="font-semibold text-sm"><Cpu className="h-4 w-4" /> <span>{t('items.applications')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Report */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-xs tracking-wider h-8 px-6 mb-1">
            {t('groups.reportingRcm')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-3 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/elc")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/rcm/elc" className="font-semibold text-sm"><Shield className="h-4 w-4" /> <span>{t('items.rcmElc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/tlc")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/rcm/tlc" className="font-semibold text-sm"><ListChecks className="h-4 w-4" /> <span>{t('items.rcmTlc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/itgc")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/rcm/itgc" className="font-semibold text-sm"><Database className="h-4 w-4" /> <span>{t('items.rcmItgc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm/verification-design")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/rcm/verification-design" className="font-semibold text-sm"><ClipboardCheck className="h-4 w-4" /> <span>{t('items.verificationDesign')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/wbs-recap")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/wbs-recap" className="font-semibold text-sm"><AlertTriangle className="h-4 w-4" /> <span>{t('items.wbs')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/reports")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/reports" className="font-semibold text-sm"><FileBarChart className="h-4 w-4" /> <span>{t('items.app11')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* TOD/TOE */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-xs tracking-wider h-8 px-6 mb-1">
            {t('groups.testing')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-3 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/deficiencies")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/deficiencies" className="flex items-center justify-between w-full font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> <span>{t('items.deficiencies')}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Others */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-xs tracking-wider h-8 px-6 mb-1">
            {t('groups.others')}
          </SidebarGroupLabel>
          <SidebarMenu className="px-3 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/ai-hub" className="font-semibold text-sm"><BrainCircuit className="h-4 w-4" /> <span>{t('items.aiAnalytics')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={toggleChat} 
                className="h-9 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] font-semibold text-sm"
                title={t('items.aiAssistant')}
              >
                <Bot className="h-4 w-4 text-primary" />
                <span>{t('items.aiAssistant')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/documents")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/documents" className="font-semibold text-sm"><FileText className="h-4 w-4" /> <span>{t('items.documents')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/notifications")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/notifications" className="flex items-center justify-between w-full font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <BellIcon className="h-4 w-4" /> <span>{t('items.notifications')}</span>
                  </div>
                  <NotificationBadge />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Extensions */}
        {registeredExtensions.some(ext => ext.navigation.length > 0) && (
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-xs tracking-wider h-8 px-6 mb-1">
              Extensions
            </SidebarGroupLabel>
            <SidebarMenu className="px-3 gap-1">
              {registeredExtensions.flatMap(ext =>
                ext.navigation.map((item, idx) => {
                  if (item.roleRequired && !item.roleRequired.includes(userRole)) {
                    return null;
                  }
                  return (
                    <SidebarMenuItem key={`${ext.id}-${idx}`}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.path)} 
                        className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight"
                        title={item.label}
                      >
                        <Link to={item.path} className="font-semibold text-sm">
                          <DynamicIcon name={item.iconName} className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* User */}
        <SidebarGroup className="mt-auto pt-4 pb-6 border-t border-sidebar-border/30">
          <SidebarMenu className="px-3 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                <Link to="/settings" className="font-semibold text-sm"><Settings2 className="h-4 w-4" /> <span>{t('items.settings')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userRole === 'Admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/users")} className="min-h-9 h-auto py-2 px-3 rounded-md transition-all hover:bg-slate-100 active:scale-[0.98] [&_span]:whitespace-normal [&_span]:leading-tight">
                  <Link to="/admin/users" className="font-semibold text-sm"><UserCog className="h-4 w-4" /> <span>{t('items.adminUsers')}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="h-9 px-3 rounded-md text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all active:scale-[0.98] font-semibold text-sm"
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
