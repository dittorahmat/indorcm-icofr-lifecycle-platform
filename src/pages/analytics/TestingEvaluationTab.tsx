import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import type { TestingEvaluationResponse } from './types';

const STATUS_COLORS = ['#059669', '#f59e0b', '#e11d48'];

export function TestingEvaluationTab() {
  const { t } = useTranslation('analytics');
  const { workingYear } = useFiscalYearStore();

  const { data: testData, isLoading } = useQuery<TestingEvaluationResponse>({
    queryKey: ['analytics-testing-evaluation', workingYear],
    queryFn: () => api<TestingEvaluationResponse>(`/api/analytics/testing-evaluation?year=${workingYear}`),
  });

  const radarScores = (testData?.radarScores && testData.radarScores.length > 0) ? testData.radarScores : [
    { pillar: 'Objective', score: 85, fullMark: 100 },
    { pillar: 'Timing & Frequency', score: 80, fullMark: 100 },
    { pillar: 'Authority & Segregation', score: 90, fullMark: 100 },
    { pillar: 'Reliability & Evidence', score: 75, fullMark: 100 },
    { pillar: 'Coverage & Sampling', score: 85, fullMark: 100 },
    { pillar: 'Continuous Monitoring', score: 80, fullMark: 100 },
  ];
  const statusBreakdown = (testData?.statusBreakdown && testData.statusBreakdown.length > 0) ? testData.statusBreakdown : [
    { name: 'Effective (Pass)', value: 18 },
    { name: 'Design Deficiency', value: 1 },
    { name: 'Operating Deficiency', value: 2 },
  ];

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-slate-800">{t('testing.title')}</h3>
        <p className="text-xs text-slate-500">{t('testing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart 6-Pilar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            {t('testing.radarCardTitle')}
          </h4>
          <p className="text-xs text-slate-400 mb-4">SK-5 Lampiran 8 Benchmark</p>
          <div className="w-full h-72 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarScores}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="pillar" tick={{ fill: '#475569', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  name="TOD Compliance"
                  dataKey="score"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.45}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Klasifikasi Status Pengujian */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {t('testing.statusCardTitle')}
            </h4>
            <p className="text-xs text-slate-400 mb-4">Efektivitas Rancangan & Operasi</p>
            <div className="w-full h-64 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={260}>
                <BarChart data={statusBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusBreakdown.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <span className="text-emerald-700 font-bold block text-sm">
                {statusBreakdown[0]?.value || 0}
              </span>
              <span className="text-slate-500 text-xs">{t('testing.effectiveControls')}</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <span className="text-amber-700 font-bold block text-sm">
                {statusBreakdown[1]?.value || 0}
              </span>
              <span className="text-slate-500 text-xs">{t('testing.designDeficiency')}</span>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg">
              <span className="text-rose-700 font-bold block text-sm">
                {statusBreakdown[2]?.value || 0}
              </span>
              <span className="text-slate-500 text-xs">{t('testing.operatingDeficiency')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
