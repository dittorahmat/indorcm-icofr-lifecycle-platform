import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Sparkles, FileSpreadsheet, Layers } from 'lucide-react';

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
    <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-xl p-4 sm:p-6 shadow-md border border-border/20">
      {/* Sovereign ambient aura */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-20 w-64 h-64 rounded-full bg-tertiary-fixed-dim/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Top meta tags */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-2 max-w-3xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-secondary text-on-primary tracking-wide">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('banner.badgeRegulation', { defaultValue: 'Mandat SK-5 / BPKP-2024' })}
              </span>
              <span className="text-primary-fixed text-xs font-semibold">
                {t('banner.regNo', { defaultValue: 'Lampiran 8 (TOD) & Lampiran 9 (TOE)' })}
              </span>
              <span className="text-on-primary-container text-xs hidden min-[480px]:inline" aria-hidden="true">
                •
              </span>
              <span className="inline-flex items-center gap-1 text-primary-fixed text-xs font-semibold">
                <Sparkles className="h-3 w-3 text-secondary-fixed shrink-0" />
                {t('banner.auditCycle', { year: workingYear, defaultValue: `Siklus Audit FY ${workingYear}` })}
              </span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-on-primary tracking-tight leading-snug">
              {t('banner.title', { defaultValue: 'Kertas Kerja Pengujian Efektivitas Desain & Operasi Pengendalian' })}
            </h1>
            <p className="text-xs sm:text-sm text-on-primary-container font-normal leading-relaxed">
              {t('banner.subtitle', {
                defaultValue:
                  'Kertas kerja audit terintegrasi pengujian rancangan 6 pilar TOD (Lampiran 8) dan uji efektivitas operasi transaksi TOE (Lampiran 9) berlandaskan standar SK-5/DKU.MBU/11/2024.',
              })}
            </p>
          </div>

          {/* Quick metric pill */}
          <div className="flex items-center gap-4 bg-tertiary-container/90 px-4 py-3 rounded-xl border border-white/10 shrink-0 self-start xl:self-auto">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-wider">
                {t('banner.testedLabel', { defaultValue: 'Pengendalian Diuji' })}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-display text-2xl font-bold text-on-primary tracking-tight">
                  {testedCount}
                </span>
                <span className="text-xs text-on-primary-container">
                  / {totalControls} {t('banner.controlsUnit', { defaultValue: 'Kontrol' })}
                </span>
              </div>
            </div>
            <div className="w-px h-10 bg-outline/30" aria-hidden="true" />
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-secondary-fixed px-2 py-0.5 rounded bg-secondary/25">
                {coveragePct}% {t('banner.coverage', { defaultValue: 'Cakupan' })}
              </span>
              <span className="text-xs text-on-primary-container mt-1">
                {t('banner.mandateStatus', { defaultValue: 'Audit Scope PIPK' })}
              </span>
            </div>
          </div>
        </div>

        {/* Audit methodology indicator tags */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs text-primary-fixed-dim">
          <div className="flex items-center gap-1.5 font-semibold">
            <Layers className="h-3.5 w-3.5 text-secondary-fixed shrink-0" />
            <span>{t('banner.methodologyLabel', { defaultValue: 'Metodologi Terverifikasi:' })}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest/15 text-primary-fixed text-xs font-medium">
            {t('banner.method1', { defaultValue: '6-Pilar Walkthrough TOD' })}
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest/15 text-primary-fixed text-xs font-medium">
            {t('banner.method2', { defaultValue: 'Attribute Sampling TOE (Lampiran 7)' })}
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest/15 text-primary-fixed text-xs font-medium">
            {t('banner.method3', { defaultValue: 'Three Lines Model Governance' })}
          </span>
        </div>
      </div>
    </div>
  );
}
