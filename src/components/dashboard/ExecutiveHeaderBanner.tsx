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
    <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-xl p-4 sm:p-6 shadow-md border border-border/20">
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-20 w-64 h-64 rounded-full bg-tertiary-fixed-dim/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
        <div className="flex flex-col gap-2 max-w-3xl min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-secondary text-on-primary tracking-wide">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('executiveBanner.badgeMandat')}
            </span>
            <span className="text-primary-fixed text-xs font-semibold">
              {t('executiveBanner.regNo')}
            </span>
            <span className="text-on-primary-container text-xs hidden min-[480px]:inline" aria-hidden="true">
              •
            </span>
            <span className="text-primary-fixed text-xs font-semibold">
              {t('executiveBanner.fiscalYearAudited', { year: workingYear })}
            </span>
          </div>

          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-on-primary tracking-tight leading-snug">
            {t('executiveBanner.headline')}
          </h1>
          <p className="text-xs sm:text-sm text-on-primary-container font-normal leading-relaxed">
            {t('executiveBanner.subheadline')}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-4 bg-tertiary-container/90 p-3.5 sm:p-4 rounded-xl border border-white/10 shrink-0">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-wider mb-1">
              {t('executiveBanner.kesimpulanOpiniTitle')}
            </span>
            <span className="font-display text-sm sm:text-base font-bold text-secondary-container leading-tight">
              {resolvedOpini}
            </span>
            <span className="text-xs text-on-primary-container font-normal mt-0.5">
              {t('executiveBanner.opiniSub')}
            </span>
          </div>

          <div className="w-px bg-outline/30 hidden sm:block self-stretch" aria-hidden="true" />

          <div className="flex flex-col justify-center text-left sm:text-right min-w-[120px]">
            <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-wider mb-1 flex items-center sm:justify-end gap-1">
              <Award className="h-3 w-3 text-secondary-fixed shrink-0" aria-hidden="true" />
              {t('executiveBanner.maturityScoreTitle')}
            </span>
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="font-display text-2xl sm:text-3xl font-bold text-on-primary tracking-tight">
                {maturityScore}%
              </span>
              <span className="text-xs font-bold text-secondary-fixed px-1.5 py-0.5 rounded bg-secondary/20">
                {t('executiveBanner.maturityLevel', { level: maturityLevel })}
              </span>
            </div>
            <span className="text-xs text-on-primary-container font-normal mt-0.5">
              {t('executiveBanner.cutoffDate', { year: workingYear })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
