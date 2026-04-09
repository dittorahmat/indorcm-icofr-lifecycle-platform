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
  SidebarInput,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const pathname = location.pathname;
  const mockRole = localStorage.getItem('mockRole');

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
            I
          </div>
          <span className="text-sm font-medium">IndoRCM Pro</span>
        </div>
        <SidebarInput placeholder="Search..." />
      </SidebarHeader>
      <SidebarContent>
        {mockRole === 'External Auditor' && (
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
                <Link to="/dashboard"><LayoutDashboard /> <span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {mockRole === 'Line 2' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/import")}>
                  <Link to="/import"><RefreshCw /> <span>Sync Financial Statement</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")}>
                <Link to="/csa"><Workflow /> <span>Select BPM</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/scoping")}>
                <Link to="/scoping"><Settings2 /> <span>Config OM/PM</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(mockRole === 'Komisaris' || mockRole === 'Line 2' || mockRole === 'Admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scoping/approval")}>
                  <Link to="/scoping/approval"><ShieldCheck /> <span>Materiality Approval</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">RCSA</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm")}>
                <Link to="/rcm"><ListChecks /> <span>RCM List</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/change-log")}>
                <Link to="/change-log"><History /> <span>Change Log</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/soc-monitoring")}>
                <Link to="/soc-monitoring"><ShieldCheck /> <span>SOC Monitoring</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")}>
                <Link to="/csa"><Search /> <span>Identifikasi Risiko</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")}>
                <Link to="/csa"><ClipboardCheck /> <span>Self Assessment</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Deficiency & Remediasi</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/deficiencies")}>
                <Link to="/deficiencies"><ShieldAlert /> <span>Deficiency & Remediasi</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">TOD/TOE</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing")}>
                <Link to="/testing"><ShieldCheck /> <span>Test Operasi Design</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing")}>
                <Link to="/testing"><ShieldAlert /> <span>Test Operasi Efektivitas</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Report</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/wbs-recap")}>
                <Link to="/wbs-recap"><FileBarChart /> <span>WBS Recap</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/reports")}>
                <Link to="/reports"><FileText className="h-3 w-3 opacity-50" /> <span>Lampiran 11</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">AI</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")}>
                <Link to="/ai-hub"><Search className="h-4 w-4" /> <span>Anomaly Check</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")}>
                <Link to="/ai-hub"><FileBarChart className="h-4 w-4" /> <span>Financial Journal Check</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")}>
                <Link to="/ai-hub"><Bot className="h-4 w-4" /> <span>Predictive Story Life</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ai-hub")}>
                <Link to="/ai-hub"><Cpu className="h-4 w-4" /> <span>Continuous Improvement</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">User</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings")}>
                <Link to="/settings"><UserCog /> <span>User Admin</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">© 2026 IndoRCM Pro</div>
      </SidebarFooter>
    </Sidebar>
  );
}
