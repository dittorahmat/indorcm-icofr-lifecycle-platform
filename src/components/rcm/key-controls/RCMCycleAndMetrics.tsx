import React from 'react';
import { useTranslation } from 'react-i18next';
import { BUSINESS_CYCLES, type BusinessCycleCode } from './rcm-explorer-types';
import { CheckCircle2, Shield, AlertTriangle, Cpu, Layers } from 'lucide-react';

interface RCMCycleAndMetricsProps {
  selectedCycle: BusinessCycleCode;
  onSelectCycle: (cycle: BusinessCycleCode) => void;
  totalRisks: number;
  totalControls: number;
  keyControlsCount: number;
  preventiveCount: number;
  detectiveCount: number;
  automatedCount: number;
  manualCount: number;
}

export function RCMCycleAndMetrics({
  selectedCycle,
  onSelectCycle,
  totalRisks,
  totalControls,
  keyControlsCount,
  preventiveCount,
  detectiveCount,
  automatedCount,
  manualCount,
}: RCMCycleAndMetricsProps) {
  const { t } = useTranslation('rcm');

  const nonKeyCount = Math.max(0, totalControls - keyControlsCount);
  const keyPercent = totalControls > 0 ? Math.round((keyControlsCount / totalControls) * 100) : 0;
  const prevPercent = totalControls > 0 ? Math.round((preventiveCount / totalControls) * 100) : 0;
  const detPercent = totalControls > 0 ? 100 - prevPercent : 0;
  const autoPercent = totalControls > 0 ? Math.round((automatedCount / totalControls) * 100) : 0;
  const manualPercent = totalControls > 0 ? 100 - autoPercent : 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* 8 Cols: Business Cycle Selector & KPI summary */}
      <div className="xl:col-span-8 bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-surface-container text-secondary">
              <Layers className="h-4 w-4" />
            </span>
            <h2 className="font-display text-sm sm:text-base font-bold text-primary">
              {t('explorer.cycles.title', { defaultValue: 'Siklus Proses Bisnis Terpilih' })}
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            {t('explorer.cycles.frameworkTag', { defaultValue: 'Pedoman COSO 2013 & SPI BPKP' })}
          </span>
        </div>

        {/* Horizontal Cycle Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {BUSINESS_CYCLES.map((cycle) => {
            const isSelected = selectedCycle === cycle.code;
            return (
              <button
                key={cycle.code}
                type="button"
                onClick={() => onSelectCycle(cycle.code)}
                className={`flex flex-col p-2.5 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'bg-primary-container text-on-primary border-secondary shadow-sm ring-2 ring-secondary/40'
                    : 'bg-surface-container-low hover:bg-surface-container border-transparent text-on-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold uppercase tracking-wider ${
                      isSelected ? 'text-primary-fixed' : 'text-on-surface-variant'
                    }`}
                  >
                    {cycle.num === '00' ? 'ALL' : `SIKLUS ${cycle.num}`}
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />}
                </div>
                <span
                  className={`font-display text-sm font-bold mt-1 leading-tight ${
                    isSelected ? 'text-on-primary' : 'text-primary'
                  }`}
                >
                  {cycle.name}
                </span>
                <span
                  className={`text-xs truncate mt-0.5 ${
                    isSelected ? 'text-surface-container-high' : 'text-on-surface-variant'
                  }`}
                >
                  {cycle.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-surface-container-low p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-semibold">{t('explorer.stats.financialRisk', { defaultValue: 'Risiko Finansial' })}</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-display text-xl sm:text-2xl font-bold text-primary">{totalRisks}</span>
              <span className="text-xs text-on-surface-variant">{t('explorer.stats.riskPoints', { defaultValue: 'Titik' })}</span>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full w-full" />
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-semibold">{t('explorer.stats.totalControls', { defaultValue: 'Total Kontrol' })}</span>
              <Shield className="h-3.5 w-3.5 text-secondary" />
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-display text-xl sm:text-2xl font-bold text-primary">{totalControls}</span>
              <span className="text-xs text-on-surface-variant">{t('explorer.stats.activities', { defaultValue: 'Aktivitas' })}</span>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-secondary h-full w-full" />
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-semibold">{t('explorer.stats.keyControls', { defaultValue: 'Key Controls (KC)' })}</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">KC</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display text-xl sm:text-2xl font-bold text-primary">{keyControlsCount}</span>
              <span className="text-xs font-bold text-secondary">{keyPercent}% Prioritas</span>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, keyPercent)}%` }} />
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-semibold">{t('explorer.stats.nonKeyControls', { defaultValue: 'Non-Key' })}</span>
              <span className="text-xs font-medium text-slate-500">Penyokong</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display text-xl sm:text-2xl font-bold text-primary">{nonKeyCount}</span>
              <span className="text-xs text-on-surface-variant">{100 - keyPercent}%</span>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-slate-400 h-full" style={{ width: `${Math.max(0, 100 - keyPercent)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cols: Composition & Automation Breakdown */}
      <div className="xl:col-span-4 bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="font-display text-sm sm:text-base font-bold text-primary">
            {t('explorer.composition.title', { defaultValue: 'Komposisi & Automasi' })}
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
            {selectedCycle}
          </span>
        </div>

        <div className="flex items-center gap-4 py-2">
          {/* Donut Chart representation with SVG */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                className="text-surface-container stroke-current"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                className="text-secondary stroke-current"
                strokeWidth="4"
                strokeDasharray={`${prevPercent}, 100`}
                strokeLinecap="round"
                fill="none"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                className="text-primary-container stroke-current"
                strokeWidth="4"
                strokeDasharray={`${detPercent}, 100`}
                strokeDashoffset={`-${prevPercent}`}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-sm font-bold text-primary">{prevPercent}%</span>
              <span className="text-xs text-on-surface-variant font-medium">Prev.</span>
            </div>
          </div>

          {/* Breakdown legend */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-on-surface">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                <span className="font-medium truncate">Preventive</span>
              </div>
              <span className="font-mono font-bold shrink-0">{prevPercent}% ({preventiveCount})</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-primary-container shrink-0" />
                <span className="font-medium truncate">Detective</span>
              </div>
              <span className="font-mono font-bold shrink-0">{detPercent}% ({detectiveCount})</span>
            </div>
            <div className="w-full h-px bg-slate-100 my-0.5" />
            <div className="flex items-center justify-between text-xs text-on-surface">
              <div className="flex items-center gap-1.5 truncate">
                <Cpu className="h-3 w-3 text-secondary shrink-0" />
                <span className="font-medium truncate">Automated / ITDM</span>
              </div>
              <span className="font-mono font-bold shrink-0">{autoPercent}% ({automatedCount})</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span className="font-medium truncate">Manual</span>
              </div>
              <span className="font-mono font-bold shrink-0">{manualPercent}% ({manualCount})</span>
            </div>
          </div>
        </div>

        <div className="p-2 bg-surface-container rounded-lg flex items-center justify-between text-xs text-on-surface">
          <span className="font-semibold">{t('explorer.composition.mandatTesting', { defaultValue: 'Mandatori Testing BUMN' })}</span>
          <span className="font-bold text-secondary flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('explorer.composition.mappedStatus', { defaultValue: '100% Terpetakan' })}
          </span>
        </div>
      </div>
    </div>
  );
}
