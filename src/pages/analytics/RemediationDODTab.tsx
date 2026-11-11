import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { RemediationDODResponse } from './types';

const REMEDIATION_COLORS = ['#f59e0b', '#10b981', '#e11d48'];
const SEVERITY_COLORS = ['#e11d48', '#f59e0b', '#3b82f6'];

export function RemediationDODTab() {
  const { t } = useTranslation('analytics');
  const { workingYear } = useFiscalYearStore();

  const { data: dodData, isLoading } = useQuery<RemediationDODResponse>({
    queryKey: ['analytics-remediation', workingYear],
    queryFn: () => api<RemediationDODResponse>(`/api/analytics/remediation?year=${workingYear}`),
  });

  const remediationStatus = dodData?.remediationStatus || [];
  const severityBreakdown = dodData?.severityBreakdown || [];
  const slaCompliance = dodData?.slaComplianceRate || 85.0;

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-slate-800">{t('remediation.title')}</h3>
        <p className="text-xs text-slate-500">{t('remediation.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart Status Remediasi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            {t('remediation.remediationCardTitle')}
          </h4>
          <p className="text-xs text-slate-400 mb-4">Pemantauan Rencana Aksi Perbaikan</p>
          <div className="w-full h-64 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={260}>
              <PieChart>
                <Pie
                  data={remediationStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {remediationStatus.map((_, index) => (
                    <Cell key={`cell-rem-${index}`} fill={REMEDIATION_COLORS[index % REMEDIATION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs mt-3 pt-3 border-t border-slate-100">
            {remediationStatus.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: REMEDIATION_COLORS[index % REMEDIATION_COLORS.length] }}
                ></span>
                <span className="text-slate-600 font-medium">{item.name}:</span>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart Severity Breakdown + SLA KPI */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {t('remediation.severityCardTitle')}
            </h4>
            <p className="text-xs text-slate-400 mb-4">Klasifikasi Tingkat Keparahan</p>
            <div className="w-full h-56 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={260}>
                <BarChart data={severityBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityBreakdown.map((_, index) => (
                      <Cell key={`cell-sev-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-slate-700">{t('remediation.slaTitle')}</span>
              <span className="text-emerald-700 font-bold">{slaCompliance}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-1.5">
              <div
                className="bg-emerald-600 h-2.5 rounded-full"
                style={{ width: `${slaCompliance}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">{t('remediation.slaBenchmark')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
