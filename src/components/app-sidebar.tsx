import React, { useEffect } from "react";
import { 
  LayoutDashboard, 
  Target, 
  ShieldCheck, 
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
  LogOut
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

  // Sync i18n with user profile language on load
  useEffect(() => {
    const userLang = (session?.user as any)?.language;
    if (userLang && i18n.language !== userLang) {
      i18n.changeLanguage(userLang);
    }
    // We only want to sync when the user ID changes (e.g. login)
    // to avoid overriding manual language switches before the session refreshes
  }, [session?.user?.id]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/");
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 font-bold">
            IS
          </div>
          <div className="flex flex-col gap-0.5 leading-none transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            <span className="font-bold text-sm">ISB Risk Pro</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ICOFR Digital</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {userRole === 'External Auditor' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-600 font-bold uppercase text-[10px]">{t('groups.master')}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/audit-portal")}>
                  <Link to="/audit-portal"><Briefcase className="text-blue-600" /> <span className="font-semibold text-blue-700">Audit Portal (KAP)</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">{t('groups.master')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                <Link to="/dashboard" className="font-bold"><LayoutDashboard /> <span>{t('items.dashboard')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userRole === 'Line 2' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/import")}>
                  <Link to="/import" className="font-bold"><RefreshCw /> <span>{t('items.sync')}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/bpm")}>
                <Link to="/bpm" className="font-bold"><ListChecks /> <span>{t('items.bpm')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/scoping")}>
                <Link to="/scoping" className="font-bold"><Settings2 /> <span>{t('items.scoping')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(userRole === 'Komisaris' || userRole === 'CFO' || userRole === 'Line 2' || userRole === 'Admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scoping/approval")}>
                  <Link to="/scoping/approval" className="flex items-center justify-between w-full font-bold">
                    <div className="flex items-center gap-2">
                      <ShieldCheck /> <span>{t('items.approval')}</span>
                    </div>
                    <PendingApprovalBadge role={userRole} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">{t('groups.rcsa')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/change-log")}>
                <Link to="/change-log" className="font-bold"><History /> <span>{t('items.changelog')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/soc-monitoring")}>
                <Link to="/soc-monitoring" className="font-bold"><ShieldCheck /> <span>{t('items.soc')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">{t('groups.deficiency')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/deficiencies")}>
                <Link to="/deficiencies" className="font-bold"><ShieldAlert /> <span>{t('items.deficiencies')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">{t('groups.testing')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing?type=TOD")}>
                <Link to="/testing?type=TOD" className="font-bold"><ShieldCheck /> <span>{t('items.tod')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing?type=TOE")}>
                <Link to="/testing?type=TOE" className="font-bold"><ShieldAlert /> <span>{t('items.toe')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">{t('groups.report')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/wbs-recap")}>
                <Link to="/wbs-recap" className="font-bold"><FileBarChart /> <span>{t('items.wbs')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/reports")}>
                <Link to="/reports" className="font-bold"><FileText className="h-3 w-3 opacity-50" /> <span>{t('items.app11')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">{t('groups.ai')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub?tool=anomaly")}>
                <Link to="/ai-hub?tool=anomaly" className="font-bold"><Search className="h-4 w-4" /> <span>{t('items.anomaly')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub?tool=journal")}>
                <Link to="/ai-hub?tool=journal" className="font-bold"><FileBarChart className="h-4 w-4" /> <span>{t('items.journal')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub?tool=predictive")}>
                <Link to="/ai-hub?tool=predictive" className="font-bold"><Bot className="h-4 w-4" /> <span>{t('items.predictive')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/documents")}>
                <Link to="/documents" className="font-bold"><FileText className="h-4 w-4" /> <span>{t('items.documents') || 'Dokumen Terkait'}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub?tool=improvement")}>
                <Link to="/ai-hub?tool=improvement" className="font-bold"><Cpu className="h-4 w-4" /> <span>{t('items.improvement')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto border-t pt-4">
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">{t('groups.user')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="px-2 pb-2">
                 <LanguageSwitcher />
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings")}>
                <Link to="/settings" className="font-bold"><UserCog /> <span>{t('items.settings')}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userRole === 'Admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/users")}>
                  <Link to="/admin/users" className="font-bold text-amber-600"><UserCog /> <span>{t('items.adminUsers')}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
             <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive font-bold"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">© 2026 ISB Risk Pro</div>
      </SidebarFooter>
    </Sidebar>
  );
}
