import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { RiskBubbleItem } from './types';

export function RiskExposureTab() {
  const { t } = useTranslation('analytics');
  const { workingYear } = useFiscalYearStore();

  const { data: bubbleItems, isLoading } = useQuery<RiskBubbleItem[]>({
    queryKey: ['analytics-risk-exposure', workingYear],
    queryFn: () => api<RiskBubbleItem[]>(`/api/analytics/risk-exposure?year=${workingYear}`),
  });

  const bubbles = bubbleItems || [];

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-slate-800">{t('bubble.title')}</h3>
        <p className="text-xs text-slate-500">{t('bubble.subtitle')}</p>
      </div>

      {/* Chart Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="w-full h-80 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={480}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="x"
                name={t('bubble.likelihoodAxis')}
                domain={[0, 5]}
                tickCount={6}
                unit=" L"
                fontSize={11}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={t('bubble.impactAxis')}
                domain={[0, 5]}
                tickCount={6}
                unit=" I"
                fontSize={11}
              />
              <ZAxis type="number" dataKey="z" range={[80, 450]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={bubbles}>
                {bubbles.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={
                      entry.rating === 'High'
                        ? '#e11d48'
                        : entry.rating === 'Medium'
                        ? '#f59e0b'
                        : '#10b981'
                    }
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span className="text-slate-600">{t('bubble.quadrantExtreme')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-600">{t('bubble.quadrantModerate')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">{t('bubble.quadrantLow')}</span>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h4 className="text-sm font-bold text-slate-800 mb-3">
          {t('bubble.summaryTable')}
        </h4>
        <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="py-2 px-3">{t('bubble.colProcess')}</th>
                <th className="py-2 px-3">{t('bubble.colRisk')}</th>
                <th className="py-2 px-3">{t('bubble.colRating')}</th>
                <th className="py-2 px-3 text-center">{t('bubble.colLikelihood')}</th>
                <th className="py-2 px-3 text-center">{t('bubble.colImpact')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bubbles.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{b.process}</td>
                  <td className="py-2.5 px-3 text-slate-600">{b.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                        b.rating === 'High'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : b.rating === 'Medium'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {b.rating}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">L{b.x}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">I{b.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
