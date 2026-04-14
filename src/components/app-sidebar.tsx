import React from "react";
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
  FileBarChart
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
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { MaterialitySimulation } from "@shared/types";

import { authClient } from "@/lib/auth-client";

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
  const pathname = location.pathname;
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role;

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
            I
          </div>
          <span className="text-sm font-medium">ISB Risk Pro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {userRole === 'External Auditor' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-600 font-bold uppercase text-[10px]">External Assurance</SidebarGroupLabel>
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
          <SidebarGroupLabel className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">MASTER</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                <Link to="/dashboard" className="font-bold"><LayoutDashboard /> <span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {userRole === 'Line 2' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/import")}>
                  <Link to="/import" className="font-bold"><RefreshCw /> <span>Sync Financial Statement</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")}>
                <Link to="/csa" className="font-bold"><Workflow /> <span>Control Self Assessment</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/bpm")}>
                <Link to="/bpm" className="font-bold"><ListChecks /> <span>BPM</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/scoping")}>
                <Link to="/scoping" className="font-bold"><Settings2 /> <span>Significant Account Identification</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(userRole === 'Komisaris' || userRole === 'CFO' || userRole === 'Line 2' || userRole === 'Admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scoping/approval")}>
                  <Link to="/scoping/approval" className="flex items-center justify-between w-full font-bold">
                    <div className="flex items-center gap-2">
                      <ShieldCheck /> <span>Materiality Approval</span>
                    </div>
                    <PendingApprovalBadge role={userRole} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">RCSA</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/change-log")}>
                <Link to="/change-log" className="font-bold"><History /> <span>Change Log</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/soc-monitoring")}>
                <Link to="/soc-monitoring" className="font-bold"><ShieldCheck /> <span>SOC Monitoring</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")}>
                <Link to="/csa" className="font-bold"><Search /> <span>Risk Identification</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")}>
                <Link to="/csa" className="font-bold"><ClipboardCheck /> <span>Self Assessment</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">Deficiency & Remediation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/deficiencies")}>
                <Link to="/deficiencies" className="font-bold"><ShieldAlert /> <span>Deficiency & Remediation</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">TOD/TOE</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing")}>
                <Link to="/testing" className="font-bold"><ShieldCheck /> <span>Test of Design</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing")}>
                <Link to="/testing" className="font-bold"><ShieldAlert /> <span>Test of Operating Effectiveness</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">Report</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/wbs-recap")}>
                <Link to="/wbs-recap" className="font-bold"><FileBarChart /> <span>WBS Recap</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/reports")}>
                <Link to="/reports" className="font-bold"><FileText className="h-3 w-3 opacity-50" /> <span>Appendix 11</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">AI</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")}>
                <Link to="/ai-hub" className="font-bold"><Search className="h-4 w-4" /> <span>Anomaly Check</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")}>
                <Link to="/ai-hub" className="font-bold"><FileBarChart className="h-4 w-4" /> <span>Financial Journal Check</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")}>
                <Link to="/ai-hub" className="font-bold"><Bot className="h-4 w-4" /> <span>Predictive Story Life</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")}>
                <Link to="/ai-hub" className="font-bold"><Cpu className="h-4 w-4" /> <span>Continuous Improvement</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-white uppercase text-[10px] tracking-widest opacity-80">User</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings")}>
                <Link to="/settings" className="font-bold"><UserCog /> <span>User Admin</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {userRole === 'Admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-bold text-amber-500 uppercase text-[10px] tracking-widest">Administration</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/users")}>
                  <Link to="/admin/users" className="font-bold text-amber-600"><UserCog /> <span>User Management</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">© 2026 ISB Risk Pro</div>
      </SidebarFooter>
    </Sidebar>
  );
}
