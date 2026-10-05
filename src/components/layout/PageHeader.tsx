import React from 'react';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export function PageHeader({ title, description, children, className, badge }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 min-w-0 max-w-full", className)}>
      <div className="space-y-1 min-w-0 max-w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full flex-wrap">
          <SidebarTrigger className="h-11 w-11 min-h-[44px] min-w-[44px] text-slate-700 flex shrink-0 rounded-md" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight sm:leading-none min-w-0 max-w-full break-words">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-muted-foreground text-xs sm:text-sm font-medium line-clamp-1 sm:line-clamp-none">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 min-w-0 max-w-full flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-visible touch-pan-x overscroll-x-contain pb-1 sm:pb-0 [&>*]:shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
