import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Layers, Award, Sparkles } from 'lucide-react';
import { BUMN_CLUSTER_LIST } from './rcm-explorer-types';
import type { BUMNCluster } from '@shared/types';

interface RCMExplorerHeaderBannerProps {
  workingYear?: string;
  activeCluster?: BUMNCluster | 'ALL';
  onSelectCluster?: (cluster: BUMNCluster | 'ALL') => void;
  totalKeyControls?: number;
  totalControls?: number;
}

export function RCMExplorerHeaderBanner({
  workingYear = '2024',
  activeCluster = 'ALL',
  onSelectCluster,
  totalKeyControls = 0,
  totalControls = 0,
}: RCMExplorerHeaderBannerProps) {
  const { t } = useTranslation('rcm');

  const keyRatio = totalControls > 0 ? Math.round((totalKeyControls / totalControls) * 100) : 0;

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
                {t('explorer.banner.badgeMandat', { defaultValue: 'Mandat SK-5 / BPKP-2024' })}
              </span>
              <span className="text-primary-fixed text-xs font-semibold">
                {t('explorer.banner.regNo', { defaultValue: 'SK-5/DKU.MBU/11/2024 Lampiran 2 & 5' })}
              </span>
              <span className="text-on-primary-container text-xs hidden min-[480px]:inline" aria-hidden="true">
                •
              </span>
              <span className="inline-flex items-center gap-1 text-primary-fixed text-xs font-semibold">
                <Sparkles className="h-3 w-3 text-secondary-fixed shrink-0" />
                {t('explorer.banner.fiscalYear', { year: workingYear, defaultValue: `Tahun Buku ${workingYear}` })}
              </span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-on-primary tracking-tight leading-snug">
              {t('explorer.banner.title', { defaultValue: 'Risk & Control Matrix (RCM) Key Control Explorer' })}
            </h1>
            <p className="text-xs sm:text-sm text-on-primary-container font-normal leading-relaxed">
              {t('explorer.banner.subtitle', {
                defaultValue:
                  'Repositori pengendalian kunci BUMN berlandaskan standar 11 klaster industri Lampiran 2, mitigasi 6 pilar TOD, dan ketertelusuran simpul alir proses BPM.',
              })}
            </p>
          </div>

          {/* Quick metric pill */}
          <div className="flex items-center gap-4 bg-tertiary-container/90 px-4 py-3 rounded-xl border border-white/10 shrink-0 self-start xl:self-auto">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-wider">
                {t('explorer.banner.keyRatioLabel', { defaultValue: 'Rasio Key Control' })}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-display text-2xl font-bold text-on-primary tracking-tight">
                  {totalKeyControls}
                </span>
                <span className="text-xs text-on-primary-container">
                  / {totalControls} {t('explorer.banner.controlsUnit', { defaultValue: 'Kontrol' })}
                </span>
              </div>
            </div>
            <div className="w-px h-10 bg-outline/30" aria-hidden="true" />
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-secondary-fixed px-2 py-0.5 rounded bg-secondary/25">
                {keyRatio}% {t('explorer.banner.priority', { defaultValue: 'Prioritas' })}
              </span>
              <span className="text-[11px] text-on-primary-container mt-1">
                {t('explorer.banner.targetDesc', { defaultValue: 'Mandatori Pengujian' })}
              </span>
            </div>
          </div>
        </div>

        {/* 11 BUMN Cluster horizontal scroll tags */}
        <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-fixed-dim uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-secondary-fixed shrink-0" />
            <span>{t('explorer.banner.clustersLabel', { defaultValue: '11 Klaster BUMN (Lampiran 2 SK-5):' })}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain py-1 no-scrollbar">
            <button
              type="button"
              onClick={() => onSelectCluster?.('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                activeCluster === 'ALL'
                  ? 'bg-secondary text-on-primary shadow-sm ring-1 ring-white/20'
                  : 'bg-surface-container-lowest/15 text-primary-fixed hover:bg-surface-container-lowest/25'
              }`}
            >
              {t('explorer.clusters.all', { defaultValue: 'Semua Klaster' })}
            </button>
            {BUMN_CLUSTER_LIST.map((cl) => {
              const isSelected = activeCluster === cl.id;
              return (
                <button
                  key={cl.id}
                  type="button"
                  onClick={() => onSelectCluster?.(cl.id)}
                  title={t(cl.nameKey, { defaultValue: cl.defaultName })}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-secondary text-on-primary font-bold shadow-sm ring-1 ring-white/20'
                      : 'bg-surface-container-lowest/15 text-primary-fixed hover:bg-surface-container-lowest/25'
                  }`}
                >
                  <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-black/20 text-white/90">
                    {cl.code}
                  </span>
                  <span>{t(cl.nameKey, { defaultValue: cl.defaultName })}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
