import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Calendar, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import type { SimulationStatus } from '@shared/types';

export interface ScopingHeaderBannerProps {
  workingYear: string;
  simulationName?: string;
  simulationStatus?: SimulationStatus | string;
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
    <div className="relative overflow-hidden bg-white dark:bg-card text-foreground rounded-xl p-4 sm:p-6 shadow-xs border border-border/80 border-l-4 border-l-secondary">
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

          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight leading-snug">
            {t('sovereignBanner.headline')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed">
            {t('sovereignBanner.subheadline')}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-4 bg-slate-50 dark:bg-slate-900/40 p-3.5 sm:p-4 rounded-xl border border-border/60 shrink-0">
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
