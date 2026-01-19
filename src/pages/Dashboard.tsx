import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { RCM, Deficiency, Control } from '@shared/types';
import { CheckCircle, AlertTriangle, Clock, ShieldCheck, UserCheck, Zap } from 'lucide-react';

const ComplianceCharts = React.lazy(() => import('@/components/dashboard/ComplianceCharts').then(m => ({ default: m.ComplianceCharts })));

export function Dashboard() {
  const { data: rcmData, isLoading: rcmLoading } = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: RCM[] }>('/api/rcm'),
  });

  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const cosoCoverage = React.useMemo(() => {
    if (!controlsData) return [];
    const coverage = Array.from({ length: 17 }, (_, i) => ({
      principle: i + 1,
      count: controlsData.items.filter(c => c.cosoPrinciples?.includes((i + 1) as any)).length
    }));
    return coverage;
  }, [controlsData]);

  const deficiencyBySeverity = React.useMemo(() => {
    if (!deficienciesData) return [];
    const counts = deficienciesData.items.reduce((acc, def) => {
      acc[def.severity] = (acc[def.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [deficienciesData]);

  const isLoading = rcmLoading || deficienciesLoading || controlsLoading;

  const kpiData = [
    { title: 'Control Coverage', value: controlsData?.items.length || '0', icon: <CheckCircle className="h-6 w-6 text-green-500" /> },
    { title: 'Open Deficiencies', value: deficienciesData?.items.filter(d => d.status === 'Open').length || '0', icon: <AlertTriangle className="h-6 w-6 text-orange-500" /> },
    { title: 'COSO Coverage', value: `${((cosoCoverage.filter(c => c.count > 0).length / 17) * 100).toFixed(0)}%`, icon: <ShieldCheck className="h-6 w-6 text-blue-500" /> },
  ];

  return (
    <AppLayout container>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of ICOFR compliance and status.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {kpiData.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-3xl font-bold">{kpi.value}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase text-blue-800 flex items-center gap-2">
                <UserCheck className="h-3 w-3" /> CSA Completion (KPI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">88.5%</div>
              <p className="text-[10px] text-blue-700 italic">Target: 100% per Quarter</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase text-orange-800 flex items-center gap-2">
                <Zap className="h-3 w-3" /> Remediation Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">12 Days</div>
              <p className="text-[10px] text-orange-700 italic">Avg time to resolve CD</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase text-green-800 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> Line 2 Validation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">94.2%</div>
              <p className="text-[10px] text-green-700 italic">Test of One completion</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase text-slate-800 flex items-center gap-2">
                <Clock className="h-3 w-3" /> Reporting Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Ready</div>
              <p className="text-[10px] text-slate-700 italic">Current cycle status</p>
            </CardContent>
          </Card>
        </div>

        <React.Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
          <ComplianceCharts 
            rcmData={rcmData} 
            deficiencyBySeverity={deficiencyBySeverity} 
            isLoading={isLoading} 
          />
        </React.Suspense>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>17 COSO Principles Coverage</CardTitle>
            <CardDescription>Ensuring all mandatory COSO principles are mapped to controls (Appendix 1).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-2">
              {isLoading ? Array.from({ length: 17 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />) : (
                cosoCoverage.map((c) => (
                  <div 
                    key={c.principle} 
                    className={`h-12 flex flex-col items-center justify-center rounded-md border text-[10px] font-bold transition-all
                      ${c.count > 0 ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-50 border-red-100 text-red-400'}`}
                    title={`${c.count} controls mapped to Principle ${c.principle}`}
                  >
                    <span>P{c.principle}</span>
                    <span className="text-[8px] opacity-70">{c.count}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex gap-4 text-[10px] uppercase font-bold tracking-tight">
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 bg-green-100 border border-green-200 rounded" /> Covered</div>
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 bg-red-50 border border-red-100 rounded" /> Zero Coverage (Action Required)</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
