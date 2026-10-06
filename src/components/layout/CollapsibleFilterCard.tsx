import React from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CollapsibleFilterCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultOpenMobile?: boolean;
  defaultOpenDesktop?: boolean;
  testId?: string;
  /**
   * 'card' renders its own card chrome (for bare filter content).
   * 'section' renders children directly with only a slim toggle row
   * (for content that already ships its own Card, e.g. BPMScopingFilters).
   */
  layout?: 'card' | 'section';
}

/**
 * Shared responsive wrapper for filter / parameter panels.
 * Collapsed by default on mobile viewports so primary content stays
 * visible; expanded by default on desktop. An explicit user toggle is
 * preserved across viewport resizes.
 */
export function CollapsibleFilterCard({
  title,
  children,
  className,
  defaultOpenMobile = false,
  defaultOpenDesktop = true,
  testId = 'collapsible-filter-card',
  layout = 'card',
}: CollapsibleFilterCardProps) {
  const { t } = useTranslation('common');
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(
    // Single viewport source: useIsMobile() (MOBILE_BREAKPOINT).
    // Corrected post-mount by the sync effect below once the hook resolves.
    isMobile ? defaultOpenMobile : defaultOpenDesktop
  );
  const hasUserToggledRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasUserToggledRef.current) {
      setIsOpen(isMobile ? defaultOpenMobile : defaultOpenDesktop);
    }
  }, [isMobile, defaultOpenMobile, defaultOpenDesktop]);

  const handleToggle = React.useCallback(() => {
    hasUserToggledRef.current = true;
    setIsOpen((prev) => !prev);
  }, []);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={false}
        data-testid={`${testId}-expand`}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3',
          'text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm',
          'hover:bg-slate-50 min-h-[44px]',
          className
        )}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        <span className="shrink-0 text-slate-500">{t('mobile.showFilters')}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      </button>
    );
  }

  if (layout === 'section') {
    return (
      <div data-testid={testId} className={cn('min-w-0 max-w-full space-y-3', className)}>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={true}
            data-testid={`${testId}-collapse`}
            className="flex min-h-[44px] items-center gap-1 rounded-md px-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            {t('mobile.hideFilters')}
            <ChevronDown className="h-4 w-4 rotate-180" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider text-slate-700">
          {title}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={true}
          data-testid={`${testId}-collapse`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-md px-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <span className="hidden min-[420px]:inline">{t('mobile.hideFilters')}</span>
          <ChevronDown className="h-4 w-4 rotate-180" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[42vh] overflow-y-auto p-4 sm:max-h-none sm:overflow-visible sm:p-6">
        {children}
      </div>
    </div>
  );
}
