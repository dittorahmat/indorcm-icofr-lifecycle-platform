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
  Network
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
            <SidebarGroupLabel className="text-blue-600 font-bold">External Assurance</SidebarGroupLabel>
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
          <SidebarGroupLabel>Planning & Risk</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                <Link to="/dashboard"><LayoutDashboard /> <span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/scoping")}>
                <Link to="/scoping"><Target /> <span>Scoping & Materiality</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/wbs-recap")}>
                <Link to="/wbs-recap"><Megaphone className="text-amber-600" /> <span>Whistleblowing Recap</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/rcm")}>
                <Link to="/rcm"><ShieldCheck /> <span>RCM & BPM (Lampiran 4)</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/change-log")}>
                <Link to="/change-log"><History /> <span>Change Log (Lampiran 6)</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/soc-monitoring")}>
                <Link to="/soc-monitoring"><Network /> <span>SOC Monitoring (SO)</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Implementation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/csa")}>
                <Link to="/csa"><CheckSquare /> <span>CSA Workspace</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Evaluation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/testing")}>
                <Link to="/testing"><Microscope /> <span>Testing Workbench</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Remediation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/deficiencies")}>
                <Link to="/deficiencies"><AlertTriangle /> <span>Deficiency Board</span></Link>
              </SidebarMenuButton>
              <SidebarMenuBadge className="bg-red-100 text-red-700 hover:bg-red-100">3</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Reporting</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/reports")}>
                <Link to="/reports"><BarChart3 /> <span>Reports & Exports</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        <SidebarGroup>
           <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/settings")}>
                <Link to="/settings"><Settings /> <span>Settings</span></Link>
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
