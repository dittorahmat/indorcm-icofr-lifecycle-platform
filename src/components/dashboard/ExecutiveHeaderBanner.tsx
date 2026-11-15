import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, ShieldCheck } from 'lucide-react';

interface ExecutiveHeaderBannerProps {
  workingYear?: string;
  opiniManagement?: string;
  maturityScore?: number;
  maturityLevel?: number;
}

export function ExecutiveHeaderBanner({
  workingYear = '2024',
  opiniManagement,
  maturityScore = 88.4,
  maturityLevel = 4,
}: ExecutiveHeaderBannerProps) {
  const { t } = useTranslation('dashboard');

  const resolvedOpini = opiniManagement || t('executiveBanner.opiniDefault');

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-sky-50 via-blue-50/50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800 text-foreground rounded-xl p-4 sm:p-6 shadow-xs border border-sky-200/80 dark:border-sky-800/60 border-l-4 border-l-sky-600">
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
        <div className="flex flex-col gap-2 max-w-3xl min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-sky-700 text-white tracking-wide">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('executiveBanner.badgeMandat')}
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {t('executiveBanner.regNo')}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs hidden min-[480px]:inline" aria-hidden="true">
              •
            </span>
            <span className="text-slate-900 dark:text-slate-100 text-xs font-semibold">
              {t('executiveBanner.fiscalYearAudited', { year: workingYear })}
            </span>
          </div>

          <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {t('executiveBanner.headline')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
            {t('executiveBanner.subheadline')}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-4 bg-white/80 dark:bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-sky-200/60 dark:border-sky-800/40 shrink-0 shadow-2xs">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              {t('executiveBanner.kesimpulanOpiniTitle')}
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-300 leading-tight">
              {resolvedOpini}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-normal mt-0.5">
              {t('executiveBanner.opiniSub')}
            </span>
          </div>

          <div className="w-px bg-sky-200/80 dark:bg-sky-800/60 hidden sm:block self-stretch" aria-hidden="true" />

          <div className="flex flex-col justify-center text-left sm:text-right min-w-[120px]">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center sm:justify-end gap-1">
              <Award className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400 shrink-0" aria-hidden="true" />
              {t('executiveBanner.maturityScoreTitle')}
            </span>
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {maturityScore}%
              </span>
              <span className="text-xs font-bold text-sky-800 dark:text-sky-300 px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80">
                {t('executiveBanner.maturityLevel', { level: maturityLevel })}
              </span>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-normal mt-0.5">
              {t('executiveBanner.cutoffDate', { year: workingYear })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
