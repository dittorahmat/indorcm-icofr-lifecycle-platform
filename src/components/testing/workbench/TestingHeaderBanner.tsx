import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { SOVEREIGN_CARD_CONTAINER } from '@/components/ui/sovereign-banner';

interface TestingHeaderBannerProps {
  workingYear?: string;
  totalControls?: number;
  testedCount?: number;
}

export function TestingHeaderBanner({
  workingYear = '2024',
  totalControls = 0,
  testedCount = 0,
}: TestingHeaderBannerProps) {
  const { t } = useTranslation('testing');

  const coveragePct = totalControls > 0 ? Math.round((testedCount / totalControls) * 100) : 0;

  return (
    <div className={SOVEREIGN_CARD_CONTAINER}>
      <div className="relative z-10 flex flex-col gap-4">
        {/* Top meta tags */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-2 max-w-3xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-secondary text-secondary-foreground tracking-wide">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('banner.badgeRegulation', { defaultValue: 'Mandat SK-5 / BPKP-2024' })}
              </span>
              <span className="text-muted-foreground text-xs font-semibold">
                {t('banner.regNo', { defaultValue: 'Lampiran 8 (TOD) & Lampiran 9 (TOE)' })}
              </span>
              <span className="text-muted-foreground/60 text-xs hidden min-[480px]:inline" aria-hidden="true">
                •
              </span>
              <span className="inline-flex items-center gap-1 text-foreground text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
                {t('banner.auditCycle', { year: workingYear, defaultValue: `Siklus Audit FY ${workingYear}` })}
              </span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight leading-snug">
              {t('banner.title', { defaultValue: 'Kertas Kerja Pengujian Efektivitas Desain & Operasi Pengendalian' })}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed">
              {t('banner.subtitle', {
                defaultValue:
                  'Kertas kerja audit terintegrasi pengujian rancangan 6 pilar TOD (Lampiran 8) dan uji efektivitas operasi transaksi TOE (Lampiran 9) berlandaskan standar SK-5/DKU.MBU/11/2024.',
              })}
            </p>
          </div>

          {/* Quick metric pill */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 rounded-xl border border-border/60 shrink-0 self-start xl:self-auto">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('banner.testedLabel', { defaultValue: 'Pengendalian Diuji' })}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-display text-2xl font-bold text-foreground tracking-tight">
                  {testedCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {totalControls} {t('banner.controlsUnit', { defaultValue: 'Kontrol' })}
                </span>
              </div>
            </div>
            <div className="w-px h-10 bg-border/60" aria-hidden="true" />
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-secondary px-2 py-0.5 rounded bg-secondary-container/50">
                {coveragePct}% {t('banner.coverage', { defaultValue: 'Cakupan' })}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('banner.mandateStatus', { defaultValue: 'Audit Scope PIPK' })}
              </span>
            </div>
          </div>
        </div>

        {/* Audit methodology indicator tags */}
        <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Layers className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
            <span>{t('banner.methodologyLabel', { defaultValue: 'Metodologi Terverifikasi:' })}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-muted/60 text-foreground text-xs font-medium">
            {t('banner.method1', { defaultValue: '6-Pilar Walkthrough TOD' })}
          </span>
          <span className="px-2 py-0.5 rounded bg-muted/60 text-foreground text-xs font-medium">
            {t('banner.method2', { defaultValue: 'Attribute Sampling TOE (Lampiran 7)' })}
          </span>
          <span className="px-2 py-0.5 rounded bg-muted/60 text-foreground text-xs font-medium">
            {t('banner.method3', { defaultValue: 'Three Lines Model Governance' })}
          </span>
        </div>
      </div>
    </div>
  );
}
