/*
Wraps children in a sidebar layout. Don't use this if you don't need a sidebar
*/
import React, { Suspense } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationCenter } from "./NotificationCenter";
import { cn } from "@/lib/utils";

// Lazy load the sidebar to split the bundle
const AppSidebar = React.lazy(() => import("@/components/app-sidebar").then(module => ({ default: module.AppSidebar })));

type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};

export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={true} open={true} onOpenChange={() => {}}>
      <Suspense fallback={
        <div className="h-screen w-64 border-r bg-sidebar p-4 space-y-4 hidden md:block">
           <div className="flex items-center gap-2 px-2 py-1 mb-6">
             <Skeleton className="h-6 w-6 rounded-md" />
             <Skeleton className="h-4 w-24" />
           </div>
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
      <SidebarInset className={cn("flex flex-col h-screen overflow-hidden", className)}>
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white shrink-0 h-14">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-tighter text-indigo-900 px-2 py-1 bg-indigo-50 rounded border border-indigo-100">
               IndoGRC Pro
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="h-8 w-[1px] bg-slate-100 mx-1" />
          </div>
        </div>

        <div className={cn(
          "flex-1 overflow-auto bg-slate-50/50",
          container && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8",
          contentClassName
        )}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
