import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, CheckCheck, Award, AlertTriangle } from 'lucide-react';
import type { AnalyticsSummary } from './types';

interface ExecutiveKpiCardsProps {
  data: AnalyticsSummary;
}

export function ExecutiveKpiCards({ data }: ExecutiveKpiCardsProps) {
  const { t } = useTranslation('analytics');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Total Risk Universe */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('kpi.totalRisk')}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {data.totalRisks} <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('kpi.riskUnit')}</span>
            </h3>
          </div>
          <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-rose-600 font-semibold">{t('kpi.highSeverity')}</span>
          <span className="text-slate-600 dark:text-slate-400 font-medium">{t('kpi.mediumSeverity')}</span>
        </div>
      </div>

      {/* TOE Pass Ratio */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('kpi.toePassRate')}
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5">
              {data.toePassRate}%
            </h3>
          </div>
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <CheckCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-emerald-700 font-semibold">
            {t('kpi.passedControls', { count: Math.max(1, data.totalControls - data.openDeficiencies) })}
          </span>
          <span className="text-rose-600 font-semibold">
            {t('kpi.deficientFound', { count: data.openDeficiencies })}
          </span>
        </div>
      </div>

      {/* Avg CSA Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('kpi.csaHealthScore')}
            </p>
            <h3 className="text-2xl font-extrabold text-purple-600 mt-0.5">
              {data.csaHealthScore} <span className="text-xs font-medium text-slate-600 dark:text-slate-400">/ 5.0</span>
            </h3>
          </div>
          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-purple-700 font-semibold">{t('kpi.complianceRate')}</span>
          <span className="text-slate-700 dark:text-slate-300 font-bold">{data.complianceRate}%</span>
        </div>
      </div>

      {/* Open Deficiencies & Material Weakness */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('kpi.openDeficiencies')}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {data.openDeficiencies}
            </h3>
          </div>
          <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-medium">{t('kpi.materialWeakness')}:</span>
          <span className="font-bold text-emerald-600">
            {data.materialWeaknesses > 0 ? `${data.materialWeaknesses}` : t('kpi.noMw')}
          </span>
        </div>
      </div>
    </div>
  );
}
