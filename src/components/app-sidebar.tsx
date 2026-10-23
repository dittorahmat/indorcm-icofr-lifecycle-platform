import React, { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { useFiscalYearStore } from "@/store/useFiscalYearStore";
import { useTranslation } from "react-i18next";
import { useAIChatStore } from "@/context/ai-chat-store";
import { registeredExtensions } from "@/extensions";
import { useCurrentRole } from "@/hooks/use-current-role";
import { ExtensionIcon } from "./layout/ExtensionIcon";
import { SidebarNavItemRow, SIDEBAR_ITEM_CLASS } from "@/components/layout/SidebarNavItem";
import { visibleNavGroups, visibleUserNavItems } from "@/components/layout/sidebar-nav";

export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { t, i18n } = useTranslation("sidebar");
  const { data: session } = authClient.useSession();
  const userRole = useCurrentRole();
  const { isMobile, setOpenMobile } = useSidebar();
  const { workingYear } = useFiscalYearStore();
  const { toggleChat } = useAIChatStore();

  const withYear = (path: string) => {
    if (!workingYear) return path;
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}year=${workingYear}`;
  };

  useEffect(() => {
    const userLanguage = (session?.user as { language?: string } | undefined)?.language;
    if (userLanguage && i18n.language !== userLanguage) {
      i18n.changeLanguage(userLanguage);
    }
  }, [session?.user, i18n]);

  // Close mobile sidebar automatically upon route transition
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const isActive = (path: string) => {
    if (path === "/reports") return pathname === "/reports";
    return pathname === path || pathname.startsWith(path);
  };

  const handleAction = (action: "ai-assistant" | "logout") => {
    if (action === "ai-assistant") {
      toggleChat();
      return;
    }
    void authClient.signOut().then(() => navigate("/"));
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="w-64 border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="py-4">
        {visibleNavGroups(userRole).map((group) => (
          <SidebarGroup key={group.labelKey} className="py-2">
            <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-xs tracking-wider h-8 px-6 mb-1">
              {t(group.labelKey)}
            </SidebarGroupLabel>
            <SidebarMenu className="px-3 gap-1">
              {group.items.map((item) => (
                <SidebarNavItemRow
                  key={item.kind === "link" ? item.path : item.action}
                  item={item}
                  role={userRole}
                  isActivePath={isActive}
                  withYear={withYear}
                  onAction={handleAction}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}

        {/* Extensions */}
        {registeredExtensions.some((ext) => ext.navigation.length > 0) && (
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="font-bold text-slate-500 uppercase text-xs tracking-wider h-8 px-6 mb-1">
              Extensions
            </SidebarGroupLabel>
            <SidebarMenu className="px-3 gap-1">
              {registeredExtensions.flatMap((ext) =>
                ext.navigation.map((item, idx) => {
                  if (item.roleRequired && !item.roleRequired.includes(userRole ?? "")) {
                    return null;
                  }
                  return (
                    <SidebarMenuItem key={`${ext.id}-${idx}`}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.path)}
                        className={SIDEBAR_ITEM_CLASS}
                        title={item.label}
                      >
                        <Link to={withYear(item.path)} className="font-semibold text-sm">
                          <ExtensionIcon name={item.iconName} className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }),
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* User */}
        <SidebarGroup className="mt-auto pt-4 pb-6 border-t border-sidebar-border/30">
          <SidebarMenu className="px-3 gap-1">
            {visibleUserNavItems(userRole).map((item) => (
              <SidebarNavItemRow
                key={item.kind === "link" ? item.path : item.action}
                item={item}
                role={userRole}
                isActivePath={isActive}
                withYear={withYear}
                onAction={handleAction}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
