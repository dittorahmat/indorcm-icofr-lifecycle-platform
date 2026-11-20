import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeverityMatrixCardsProps {
  totalDeficiencies: number;
  materialWeaknessCount: number;
  significantDeficiencyCount: number;
  controlDeficiencyCount: number;
  remediationInProgressCount: number;
  activeSeverityFilter?: string;
  onSelectSeverity?: (severity: string) => void;
}

export function SeverityMatrixCards({
  totalDeficiencies,
  materialWeaknessCount,
  significantDeficiencyCount,
  controlDeficiencyCount,
  remediationInProgressCount,
  activeSeverityFilter,
  onSelectSeverity,
}: SeverityMatrixCardsProps) {
  const { t } = useTranslation('deficiency');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {/* 1. Material Weakness (MW) */}
      <div 
        onClick={() => onSelectSeverity?.('Material Weakness')}
        className={cn(
          "bg-surface-container-lowest p-3 sm:p-3.5 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all hover:shadow-md",
          activeSeverityFilter === 'Material Weakness' ? "ring-2 ring-rose-500 bg-rose-50/20" : ""
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
            {t('matrixCards.materialWeakness', { defaultValue: 'Material Weakness' })}
          </span>
          <div className="h-7 w-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
            <ShieldAlert className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-rose-700 tracking-tight">
            {materialWeaknessCount}
          </span>
          <span className="text-xs text-rose-600 font-semibold uppercase">
            MW
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          <span>{t('matrixCards.mwImpact', { defaultValue: 'Berdampak Opini LK' })}</span>
        </div>
      </div>

      {/* 2. Significant Deficiency (SD) */}
      <div 
        onClick={() => onSelectSeverity?.('Significant Deficiency')}
        className={cn(
          "bg-surface-container-lowest p-3 sm:p-3.5 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all hover:shadow-md",
          activeSeverityFilter === 'Significant Deficiency' ? "ring-2 ring-amber-500 bg-amber-50/20" : ""
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            {t('matrixCards.significantDeficiency', { defaultValue: 'Significant Deficiency' })}
          </span>
          <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-amber-800 tracking-tight">
            {significantDeficiencyCount}
          </span>
          <span className="text-xs text-amber-700 font-semibold uppercase">
            SD
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          <span>{t('matrixCards.sdImpact', { defaultValue: 'Lapor Komite Audit' })}</span>
        </div>
      </div>

      {/* 3. Control Deficiency (CD) */}
      <div 
        onClick={() => onSelectSeverity?.('Control Deficiency')}
        className={cn(
          "bg-surface-container-lowest p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all hover:shadow-md",
          activeSeverityFilter === 'Control Deficiency' ? "ring-2 ring-secondary bg-secondary/5" : ""
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t('matrixCards.controlDeficiency', { defaultValue: 'Control Deficiency' })}
          </span>
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            {controlDeficiencyCount}
          </span>
          <span className="text-xs text-slate-500 font-semibold uppercase">
            CD
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          <span>{t('matrixCards.cdImpact', { defaultValue: 'Tingkat Operasional' })}</span>
        </div>
      </div>

      {/* 4. Active Remediation In Progress (CAP) */}
      <div className="bg-surface-container-lowest p-3 sm:p-3.5 rounded-xl border border-secondary/30 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            {t('matrixCards.capActive', { defaultValue: 'Remediasi Berjalan (CAP)' })}
          </span>
          <div className="h-7 w-7 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
            <Activity className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-secondary tracking-tight">
            {remediationInProgressCount}
          </span>
          <span className="text-xs text-on-surface-variant">
            / {totalDeficiencies} {t('matrixCards.findingsUnit', { defaultValue: 'Temuan' })}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-secondary font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span>{t('matrixCards.capNote', { defaultValue: 'Sedang Dilakukan Perbaikan' })}</span>
        </div>
      </div>
    </div>
  );
}
