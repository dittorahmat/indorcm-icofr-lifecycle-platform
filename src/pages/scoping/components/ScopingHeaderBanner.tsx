import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Calendar, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { SOVEREIGN_CARD_CONTAINER, SOVEREIGN_METRIC_CARD } from '@/components/ui/sovereign-banner';

export interface ScopingHeaderBannerProps {
  workingYear: string;
  activeSnapshotFilename?: string;
  hasBenchmark?: boolean;
}

export function ScopingHeaderBanner({
  workingYear,
  activeSnapshotFilename,
  hasBenchmark,
}: ScopingHeaderBannerProps) {
  const { t } = useTranslation('scoping');

  return (
    <div className={SOVEREIGN_CARD_CONTAINER}>
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
        <div className="flex flex-col gap-2 max-w-3xl min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-secondary text-secondary-foreground tracking-wide">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('sovereignBanner.badgeMandat')}
            </span>
            <span className="text-muted-foreground text-xs font-semibold">
              {t('sovereignBanner.regNo')}
            </span>
            <span className="text-muted-foreground/60 text-xs hidden min-[480px]:inline" aria-hidden="true">
              •
            </span>
            <span className="text-foreground text-xs font-semibold">
              {t('sovereignBanner.fiscalYearAudited', { year: workingYear })}
            </span>
          </div>

          <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-foreground tracking-tight leading-snug">
            {t('sovereignBanner.headline')}
          </h1>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            {t('sovereignBanner.subheadline')}
          </p>
        </div>

        <div className={SOVEREIGN_METRIC_CARD}>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
              {t('sovereignBanner.contextYearTitle')}
            </span>
            <span className="font-display text-sm sm:text-base font-bold text-secondary leading-tight">
              FY {workingYear} / Annual
            </span>
            <span className="text-xs text-muted-foreground font-normal mt-0.5">
              {t('sovereignBanner.contextSub')}
            </span>
          </div>

          <div className="w-px bg-border/60 hidden sm:block self-stretch" aria-hidden="true" />

          <div className="flex flex-col justify-center text-left sm:text-right min-w-[130px]">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center sm:justify-end gap-1">
              <FileSpreadsheet className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
              {t('sovereignBanner.activeSourceTitle')}
            </span>
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="font-display text-sm sm:text-base font-bold text-foreground tracking-tight truncate max-w-[160px]" title={activeSnapshotFilename || t('sovereignBanner.noActiveSource')}>
                {activeSnapshotFilename || t('sovereignBanner.noActiveSource')}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:justify-end mt-0.5">
              {hasBenchmark ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  {t('sovereignBanner.benchmarkReady')}
                </span>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {t('sovereignBanner.benchmarkPending')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
