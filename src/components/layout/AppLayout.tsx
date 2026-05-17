/*
Wraps children in a sidebar layout. Don't use this if you don't need a sidebar
*/
import React, { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Lazy load the sidebar to split the bundle
const AppSidebar = React.lazy(() => import("@/components/app-sidebar").then(module => ({ default: module.AppSidebar })));

type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
  noScroll?: boolean;
};

export function AppLayout({ 
  children, 
  container = false, 
  className, 
  contentClassName,
  noScroll = false
}: AppLayoutProps): JSX.Element {
  return (
    <div className="flex flex-1 min-h-0 relative min-w-0">
      {/* Fixed Sidebar Background Strip */}
      <div 
        className="fixed inset-y-0 left-0 bg-sidebar pointer-events-none -z-10 transition-[width] duration-200 ease-linear md:block hidden" 
        style={{ width: "var(--sidebar-width)" }}
      />
      <Suspense fallback={
        <div className="h-screen w-64 border-r bg-sidebar p-4 space-y-4 hidden md:block">
           <Skeleton className="h-8 w-full" />
           <div className="space-y-2 pt-4">
             <Skeleton className="h-4 w-12" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
           </div>
        </div>
      }>
        <AppSidebar />
      </Suspense>
      <SidebarInset className={cn("flex flex-col min-h-0 min-w-0 bg-background overflow-hidden", className)}>
        <div className={cn(
          "flex-1 flex flex-col min-h-0 min-w-0",
          !noScroll && "scrollbar-hover",
          container && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8",
          contentClassName
        )}>          {children}
        </div>
      </SidebarInset>
    </div>
  );
}
