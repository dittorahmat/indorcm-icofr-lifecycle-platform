import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Activity, Search, ArrowLeft, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_PERURI_DRILLDOWN_DATA } from '@shared/ai-peruri-data';
import { useTranslation } from 'react-i18next';
import type { PeruriUseCase } from './types';

interface AIDrilldownViewProps {
  useCase?: PeruriUseCase;
  onBack: () => void;
}

const COLOR_MAP: Record<string, string> = {
  'text-red-700': '#b91c1c',
  'text-amber-700': '#b45309',
  'text-sky-700': '#0369a1',
  'text-blue-700': '#1d4ed8',
  'text-purple-700': '#7e22ce',
  'text-emerald-700': '#047857',
};

function renderFindingBadgeOrText(raw: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  const v = String(raw ?? '');
  const isDanger = ['High', 'Critical', 'Inspection Required', 'Held for Inspection', 'Quarantined'].includes(v);
  const isSuccess = ['Low', 'Within Contract Pricing', 'Within SLA', 'Verified Reconciled', 'Zero Anomaly (All Pass)'].includes(v);
  const isWarning = ['Medium', 'Under Review', 'Under Audit', 'Audit Flag', 'HSM Peak Load Warning'].includes(v);

  if (isDanger || isSuccess || isWarning) {
    const localizedText = t(`aiHub.findings.${v}`, { defaultValue: v });
    if (isDanger) {
      return <Badge className="bg-red-600 text-white text-xs h-5 uppercase font-semibold">{localizedText}</Badge>;
    }
    if (isSuccess) {
      return <Badge className="bg-emerald-600 text-white text-xs h-5 uppercase font-semibold">{localizedText}</Badge>;
    }
    return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50 text-xs h-5 uppercase font-semibold">{localizedText}</Badge>;
  }
  return <span className="text-slate-800">{v}</span>;
}

export function AIDrilldownView({ useCase, onBack }: AIDrilldownViewProps) {
  const { t } = useTranslation('reports');

  if (!useCase) {
    return (
      <div className="p-20 text-center">
        <Button variant="ghost" onClick={onBack} className="mt-4 min-h-[44px]">{t('aiHub.backToCases')}</Button>
      </div>
    );
  }

  const data = AI_PERURI_DRILLDOWN_DATA[useCase.id];
  if (!data) {
    return (
      <div className="p-20 text-center">
        <CardTitle className="text-slate-400">{t('aiHub.dataUnavailable', { title: useCase.title })}</CardTitle>
        <Button variant="ghost" onClick={onBack} className="mt-4 min-h-[44px]">{t('aiHub.backToCases')}</Button>
      </div>
    );
  }

  const mainColorClass = useCase.color.split(' ')[0] ?? 'text-sky-700';
  const activeColor = COLOR_MAP[mainColorClass] ?? '#0369a1';
  const firstDataRow = (data.chart.data[0] as Record<string, unknown> | undefined) ?? {};
  const chartKeys = Object.keys(firstDataRow);
  const findingsRows = data.findings as Array<Record<string, unknown>>;
  const findingHeaders = findingsRows.length > 0 ? Object.keys(findingsRows[0]) : [];

  return (
    <div className="min-w-0 max-w-full">
      <Card className="border-border shadow-md overflow-hidden rounded-lg min-w-0 max-w-full">
        <CardHeader className={cn('pb-6 transition-colors', useCase.color)}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onBack}
                  className="p-2 hover:bg-white/40 rounded-lg transition-colors text-current group min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                  aria-label={t('aiHub.backToCases')}
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="p-2 bg-white rounded-lg shadow-sm border border-border shrink-0">{useCase.icon}</div>
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight break-words">{useCase.title}</CardTitle>
                <CardDescription className="text-current opacity-80 text-xs font-medium">{t('aiHub.workbench')}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge className="bg-white text-slate-900 font-bold uppercase tracking-wider text-xs px-2 py-0.5">{useCase.status}</Badge>
              <Badge variant="outline" className="border-current/30 text-current bg-white/20 uppercase tracking-wider text-xs">{t('aiHub.clusterBadge')}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-8">
          {/* Metric Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.metrics.map((m, i) => (
              <div key={i} className="p-4 rounded-lg border bg-slate-50 border-slate-200 shadow-sm space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xl font-bold tracking-tight text-slate-900">{m.value}</span>
                  {m.trend && (
                    <TrendingUp className={cn(
                      'h-4 w-4',
                      m.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'
                    )} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-600 shrink-0" /> {data.chart.title}
              </h3>
              <span className="text-xs font-mono text-slate-500">{t('aiHub.visualization')}: {data.chart.type.toUpperCase()}</span>
            </div>

            <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
              <div className="min-w-[300px] h-[300px] w-full bg-slate-50/50 rounded-lg border border-slate-200 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  {data.chart.type === 'bar' ? (
                    <BarChart data={data.chart.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey={chartKeys[0]} fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                      <Bar dataKey={chartKeys[1]} fill={activeColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : data.chart.type === 'line' ? (
                    <LineChart data={data.chart.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey={chartKeys[0]} fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))' }} />
                      <Line type="monotone" dataKey={chartKeys[1]} stroke={activeColor} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : data.chart.type === 'scatter' ? (
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis type="number" dataKey="speed" name={t('aiHub.chartPressSpeed')} fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="number" dataKey="consumption" name={t('aiHub.chartDefectArea')} fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))' }} />
                      <Scatter name={t('aiHub.chartBatchInspection')} data={data.chart.data} fill={activeColor} />
                    </ScatterChart>
                  ) : data.chart.type === 'radar' ? (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.chart.data}>
                      <PolarGrid stroke="hsl(var(--muted))" />
                      <PolarAngleAxis dataKey="subject" fontSize={12} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={12} />
                      <Radar name={t('aiHub.chartScore')} dataKey="A" stroke={activeColor} fill={activeColor} fillOpacity={0.4} />
                    </RadarChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">{t('aiHub.chartUnsupported')}</div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Findings Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-2 flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 min-w-0">
                <Search className="h-4 w-4 text-sky-600 shrink-0" /> {t('aiHub.discoveryLog')}
              </h3>
              <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider self-start sm:self-auto shrink-0">{t('aiHub.liveAnalysis')}</Badge>
            </div>
            <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint min-w-0">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="text-slate-500 font-semibold uppercase tracking-wider border-b">
                    {findingHeaders.map((k) => (
                      <th key={k} className="pb-2 px-2 whitespace-nowrap">
                        {t(`aiHub.headers.${k}`, { defaultValue: k.replace(/_/g, ' ').toUpperCase() })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {findingsRows.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      {Object.values(f).map((v, j) => (
                        <td key={j} className="py-3 px-2 font-medium">
                          {renderFindingBadgeOrText(v, t)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
