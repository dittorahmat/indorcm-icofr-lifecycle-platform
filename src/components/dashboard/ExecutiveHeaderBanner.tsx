import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, ShieldCheck } from 'lucide-react';
import { SOVEREIGN_CARD_CONTAINER, SOVEREIGN_METRIC_CARD } from '@/components/ui/sovereign-banner';

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
    <div className={SOVEREIGN_CARD_CONTAINER}>
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
        <div className="flex flex-col gap-2 max-w-3xl min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-secondary text-secondary-foreground tracking-wide">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('executiveBanner.badgeMandat')}
            </span>
            <span className="text-muted-foreground text-xs font-semibold">
              {t('executiveBanner.regNo')}
            </span>
            <span className="text-muted-foreground/60 text-xs hidden min-[480px]:inline" aria-hidden="true">
              •
            </span>
            <span className="text-foreground text-xs font-semibold">
              {t('executiveBanner.fiscalYearAudited', { year: workingYear })}
            </span>
          </div>

          <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-foreground tracking-tight leading-snug">
            {t('executiveBanner.headline')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed">
            {t('executiveBanner.subheadline')}
          </p>
        </div>

        <div className={SOVEREIGN_METRIC_CARD}>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {t('executiveBanner.kesimpulanOpiniTitle')}
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-secondary leading-tight">
              {resolvedOpini}
            </span>
            <span className="text-xs text-muted-foreground font-normal mt-0.5">
              {t('executiveBanner.opiniSub')}
            </span>
          </div>

          <div className="w-px bg-border/60 hidden sm:block self-stretch" aria-hidden="true" />

          <div className="flex flex-col justify-center text-left sm:text-right min-w-[120px]">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center sm:justify-end gap-1">
              <Award className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
              {t('executiveBanner.maturityScoreTitle')}
            </span>
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {maturityScore}%
              </span>
              <span className="text-xs font-bold text-secondary px-1.5 py-0.5 rounded bg-secondary-container/50">
                {t('executiveBanner.maturityLevel', { level: maturityLevel })}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-normal mt-0.5">
              {t('executiveBanner.cutoffDate', { year: workingYear })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
