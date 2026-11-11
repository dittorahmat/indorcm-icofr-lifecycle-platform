import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle, ShieldCheck, ClipboardList } from 'lucide-react';

interface TestingSummaryMetricsProps {
  totalControls: number;
  testedCount: number;
  effectiveCount: number;
  deviationCount: number;
  validatedL2Count: number;
}

export function TestingSummaryMetrics({
  totalControls,
  testedCount,
  effectiveCount,
  deviationCount,
  validatedL2Count,
}: TestingSummaryMetricsProps) {
  const { t } = useTranslation('testing');

  const validatedPct = totalControls > 0 ? Math.round((validatedL2Count / totalControls) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Controls Tested */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {t('summary.totalTested', { defaultValue: 'Total Kontrol Diuji' })}
          </span>
          <div className="h-8 w-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-primary tracking-tight">
            {testedCount}
          </span>
          <span className="text-xs text-on-surface-variant">
            / {totalControls} {t('summary.controlsUnit', { defaultValue: 'Kontrol' })}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>{t('summary.testedNote', { defaultValue: 'Cakupan Uji Petik' })}</span>
        </div>
      </div>

      {/* 2. Effective Controls */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {t('summary.effective', { defaultValue: 'Efektif (Lolos Uji)' })}
          </span>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-emerald-700 tracking-tight">
            {effectiveCount}
          </span>
          <span className="text-xs text-on-surface-variant">
            {testedCount > 0 ? `${Math.round((effectiveCount / testedCount) * 100)}%` : '0%'}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span>{t('summary.effectiveNote', { defaultValue: 'TOD & TOE Efektif' })}</span>
        </div>
      </div>

      {/* 3. Deviation / Ineffective */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {t('summary.deviations', { defaultValue: 'Deviasi / Defisiensi' })}
          </span>
          <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-rose-700 tracking-tight">
            {deviationCount}
          </span>
          <span className="text-xs text-on-surface-variant">
            {t('summary.casesUnit', { defaultValue: 'Temuan' })}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          <span>{t('summary.deviationNote', { defaultValue: 'Wajib Masuk DoD Remediasi' })}</span>
        </div>
      </div>

      {/* 4. Line 2 Verification Status */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {t('summary.line2Status', { defaultValue: 'Verifikasi Lini 2' })}
          </span>
          <div className="h-8 w-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-primary tracking-tight">
            {validatedL2Count}
          </span>
          <span className="text-xs text-on-surface-variant">
            ({validatedPct}% {t('summary.validated', { defaultValue: 'Tervalidasi' })})
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-secondary font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span>{t('summary.line2Note', { defaultValue: 'Three Lines Model Ready' })}</span>
        </div>
      </div>
    </div>
  );
}
