import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { AnalyticsSummary } from './types';

interface ExecutiveChartsProps {
  data: AnalyticsSummary;
}

const COLORS = ['#059669', '#e11d48'];

export function ExecutiveCharts({ data }: ExecutiveChartsProps) {
  const { t } = useTranslation('analytics');

  const chartData = [
    { name: t('overview.effective'), value: data.controlsByEffectiveness[0]?.value || 1 },
    { name: t('overview.deficient'), value: data.controlsByEffectiveness[1]?.value || 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Efektivitas Kontrol */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800">
            {t('overview.controlEffectiveness')}
          </h4>
          <p className="text-xs text-slate-500">
            {t('overview.controlEffectivenessDesc')}
          </p>
        </div>
        <div className="w-full h-64 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={260}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center items-center space-x-6 text-xs mt-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{t('overview.effective')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{t('overview.deficient')}</span>
          </div>
        </div>
      </div>

      {/* Box 2: Ringkasan Progress & Kepatuhan */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            {t('overview.testingRatio')}
          </h4>
          <p className="text-xs text-slate-500 mb-6">
            {t('overview.testingRatioDesc')}
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">{t('kpi.complianceRate')}</span>
                <span className="text-emerald-700">{data.complianceRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full"
                  style={{ width: `${data.complianceRate}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">{t('kpi.mitigationProgress')}</span>
                <span className="text-sky-700">{data.mitigationProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-sky-600 h-2.5 rounded-full"
                  style={{ width: `${data.mitigationProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 mt-6">
          <p className="font-semibold text-slate-800 mb-0.5">IndoGRC Live BI Aggregator</p>
          <p>
            Data terhitung otomatis dari pengujian TOD/TOE dan CSA aktif sesuai mandat regulasi SK-5/DKU.MBU/11/2024.
          </p>
        </div>
      </div>
    </div>
  );
}
