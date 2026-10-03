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
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 min-w-0 max-w-full", className)}>
      <div className="space-y-1 min-w-0 max-w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full flex-wrap">
          <SidebarTrigger className="h-8 w-8 min-h-[32px] min-w-[32px] text-slate-700 flex shrink-0" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight sm:leading-none">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
