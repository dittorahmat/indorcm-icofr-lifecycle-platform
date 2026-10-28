import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Info } from 'lucide-react';
import type { ControlDetail, ResidualRiskStatus } from './types';

interface ControlDetailPanelProps {
  control: ControlDetail | null;
}

const STATUS_CONFIG: Record<ResidualRiskStatus, { label: string; className: string }> = {
  Low: { label: 'Low Residual Risk', className: 'text-emerald-700' },
  Moderate: { label: 'Moderate Residual Risk', className: 'text-amber-700' },
  High: { label: 'High Residual Risk', className: 'text-rose-700' },
};

export function ControlDetailPanel({ control }: ControlDetailPanelProps) {
  const { t } = useTranslation('analytics');

  if (!control) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <Info className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">{t('heatmap.drawerTitle')}</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          {t('heatmap.selectControl')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
      <div className="border-b border-slate-100 pb-3">
        <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
          {control.code}
        </span>
        <h4 className="text-base font-bold text-slate-800 mt-0.5">
          {control.cycle}
        </h4>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <span className="text-slate-400 font-medium block mb-0.5">
            {t('heatmap.financialImpact')}
          </span>
          <p className="font-semibold text-slate-800">{control.impact}</p>
          <p className="text-slate-500 mt-0.5">{control.impactDesc}</p>
        </div>

        <div>
          <span className="text-slate-400 font-medium block mb-0.5">
            {t('heatmap.csaEvaluation')}
          </span>
          <p className="font-semibold text-slate-800">{control.csa}</p>
          <p className="text-slate-500 mt-0.5">{control.csaDesc}</p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <span className="text-slate-400 font-medium block mb-1">
            {t('heatmap.residualStatus')}
          </span>
          <div className="flex items-center space-x-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className={STATUS_CONFIG[control.residualStatus]?.className || 'text-slate-700'}>
              {STATUS_CONFIG[control.residualStatus]?.label || control.residualStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
