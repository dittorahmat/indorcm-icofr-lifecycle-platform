import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, AlertTriangle, Sparkles, Layers, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeficiencyHeaderBannerProps {
  totalDeficiencies?: number;
  materialWeaknessCount?: number;
  significantDeficiencyCount?: number;
  controlDeficiencyCount?: number;
  isAggregateMode?: boolean;
}

export function DeficiencyHeaderBanner({
  totalDeficiencies = 0,
  materialWeaknessCount = 0,
  significantDeficiencyCount = 0,
  controlDeficiencyCount = 0,
  isAggregateMode = false,
}: DeficiencyHeaderBannerProps) {
  const { t } = useTranslation('deficiency');

  return (
    <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-xl p-4 sm:p-6 shadow-md border border-border/20">
      {/* Sovereign ambient aura */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-error/15 blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-20 w-64 h-64 rounded-full bg-secondary/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Top meta tags */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-2 max-w-3xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-error text-on-primary tracking-wide">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('banner.badgeRegulation', { defaultValue: 'Mandat Lampiran 10 SK-5' })}
              </span>
              <span className="text-primary-fixed text-xs font-semibold">
                {t('banner.regNo', { defaultValue: 'SK-5/DKU.MBU/11/2024 Bab VII' })}
              </span>
              <span className="text-on-primary-container text-xs hidden min-[480px]:inline" aria-hidden="true">
                •
              </span>
              <span className="inline-flex items-center gap-1 text-primary-fixed text-xs font-semibold">
                <Sparkles className="h-3 w-3 text-secondary-fixed shrink-0" />
                {t('banner.auditOversight', { defaultValue: 'Pengawasan Komite Audit & BPKP' })}
              </span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-on-primary tracking-tight leading-snug">
              {t('banner.title', { defaultValue: 'Manajemen Temuan & Remediasi Defisiensi Pengendalian' })}
            </h1>
            <p className="text-xs sm:text-sm text-on-primary-container font-normal leading-relaxed">
              {t('banner.subtitle', {
                defaultValue:
                  'Kompilasi defisiensi pengendalian internal laporan keuangan terverifikasi Tiga Lini, model Degree of Deficiency (DoD Lampiran 10), pelacakan Corrective Action Plan (CAP), dan re-testing oleh SPI.',
              })}
            </p>
          </div>

          {/* Quick metric pill */}
          <div className="flex items-center gap-4 bg-tertiary-container/90 px-4 py-3 rounded-xl border border-white/10 shrink-0 self-start xl:self-auto">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-wider">
                {t('banner.totalFindings', { defaultValue: 'Total Temuan' })}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-display text-2xl font-bold text-on-primary tracking-tight">
                  {totalDeficiencies}
                </span>
                <span className="text-xs text-on-primary-container">
                  {t('banner.findingsUnit', { defaultValue: 'Kasus' })}
                </span>
              </div>
            </div>
            <div className="w-px h-10 bg-outline/30" aria-hidden="true" />
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-error-container bg-error px-2 py-0.5 rounded text-white">
                {materialWeaknessCount} MW
              </span>
              <span className="text-xs text-on-primary-container mt-1">
                {significantDeficiencyCount} SD • {controlDeficiencyCount} CD
              </span>
            </div>
          </div>
        </div>

        {/* Protocol notes */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs text-primary-fixed-dim">
          <div className="flex items-center gap-1.5 font-semibold">
            <Layers className="h-3.5 w-3.5 text-secondary-fixed shrink-0" />
            <span>{t('banner.protocolLabel', { defaultValue: 'Protokol Pelaporan:' })}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest/15 text-primary-fixed text-xs font-medium">
            {t('banner.protocolMW', { defaultValue: 'Material Weakness -> Dewan Komisaris & Komite Audit' })}
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest/15 text-primary-fixed text-xs font-medium">
            {t('banner.protocolCAP', { defaultValue: 'CAP Remediasi Mandatori 30 Hari' })}
          </span>
        </div>
      </div>
    </div>
  );
}
