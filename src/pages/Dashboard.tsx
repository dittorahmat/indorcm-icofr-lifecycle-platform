import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import type { RCM, Deficiency, Control } from '@shared/types';
import { 
  CheckCircle, AlertTriangle, Clock, ShieldCheck, 
  Activity, ClipboardCheck, FileText, LayoutDashboard, ChevronRight,
  TrendingUp, ShieldAlert, Target, ArrowUpRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

const ComplianceCharts = React.lazy(() => import('@/components/dashboard/ComplianceCharts').then(m => ({ default: m.ComplianceCharts })));

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const COSO_COMPONENTS = [
  { name: 'Control Environment', principles: [1, 2, 3, 4, 5], color: 'bg-blue-600' },
  { name: 'Risk Assessment', principles: [6, 7, 8, 9], color: 'bg-indigo-600' },
  { name: 'Control Activities', principles: [10, 11, 12], color: 'bg-slate-900' },
  { name: 'Information & Comm', principles: [13, 14, 15], color: 'bg-emerald-600' },
  { name: 'Monitoring Activities', principles: [16, 17], color: 'bg-amber-600' },
];

export function Dashboard() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

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
    return Array.from({ length: 17 }, (_, i) => ({
      principle: i + 1,
      count: controlsData.items.filter(c => c.cosoPrinciples?.includes((i + 1) as any)).length
    }));
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

  const openDeficiencies = deficienciesData?.items.filter(d => d.status === 'Open') || [];
  const csaCompletion = 88.5; 
  const cosoPercentage = ((cosoCoverage.filter(c => c.count > 0).length / 17) * 100).toFixed(0);

  return (
    <AppLayout container>
      <motion.div 
        className="space-y-8 pb-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <PageHeader 
          title={<span className="font-display font-extrabold tracking-tight text-slate-900">{t('title')}</span>} 
          description={t('description')} 
        >
          <div className="flex gap-3">
             <Button variant="outline" className="h-10 gap-2 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all rounded-md px-4" onClick={() => navigate('/rcm')}>
                <Target className="h-4 w-4 text-slate-500" /> {t('actions.manageRcm')}
             </Button>
             <Button className="h-10 gap-2 bg-slate-900 hover:bg-slate-800 transition-all rounded-md px-4 shadow-sm" onClick={() => navigate('/csa')}>
                <ClipboardCheck className="h-4 w-4" /> {t('actions.startAssessment')}
             </Button>
          </div>
        </PageHeader>

        {/* SECTION 1: TIERED KPIs */}
        <div className="grid gap-6 md:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900 text-white border-none h-full shadow-lg ring-1 ring-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {t('kpis.cycleReadiness')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-display font-extrabold tracking-tighter">{t('kpis.ready')}</div>
                <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{t('kpis.reportingCycle', { year: '2026' })}</p>
                <div className="mt-5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="h-full bg-white rounded-full" 
                   />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {[
            { 
              title: t('kpis.controlCoverage'), 
              value: controlsData?.items.length || '0', 
              subtitle: t('kpis.activeControls'),
              icon: CheckCircle,
              color: 'text-slate-900',
              bg: 'bg-slate-50'
            },
            { 
              title: t('kpis.openDeficiencies'), 
              value: openDeficiencies.length, 
              subtitle: t('kpis.needRemediation'),
              icon: ShieldAlert,
              color: 'text-rose-600',
              bg: 'bg-rose-50',
              valueColor: 'text-rose-600'
            },
            { 
              title: t('kpis.cosoCoverage'), 
              value: `${cosoPercentage}%`, 
              subtitle: t('kpis.principlesCoverage'),
              icon: ShieldCheck,
              color: 'text-slate-900',
              bg: 'bg-slate-50'
            }
          ].map((kpi, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-1">
                  <CardTitle className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
                    <kpi.icon className={cn("h-3 w-3", kpi.color)} /> {kpi.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-display font-extrabold tracking-tight", kpi.valueColor || "text-slate-900")}>{kpi.value}</div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">{kpi.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <motion.div variants={itemVariants}>
              <React.Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
                <ComplianceCharts 
                  rcmData={rcmData} 
                  deficiencyBySeverity={deficiencyBySeverity} 
                  isLoading={isLoading} 
                />
              </React.Suspense>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
                <CardHeader className="bg-slate-50/50 border-b py-5 px-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-slate-900">
                        <LayoutDashboard className="h-4 w-4 text-slate-900" /> {t('coso.title')}
                      </CardTitle>
                      <CardDescription className="text-[11px] font-medium text-slate-500 mt-1">{t('coso.description')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />) : (
                      COSO_COMPONENTS.map((comp) => (
                        <div key={comp.name} className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <div className={cn("h-1.5 w-1.5 rounded-full", comp.color)} />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate leading-none">{comp.name}</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {comp.principles.map(pNum => {
                              const c = cosoCoverage.find(cov => cov.principle === pNum);
                              return (
                                <div 
                                  key={pNum} 
                                  className={cn(
                                    "h-10 flex flex-col items-center justify-center rounded border transition-all duration-200 cursor-default",
                                    (c?.count ?? 0) > 0 
                                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                                      : 'bg-white border-slate-100 text-slate-300'
                                  )}
                                  title={`${c?.count || 0} controls mapped to Principle ${pNum}`}
                                >
                                  <span className={cn("text-[8px] font-bold tracking-tighter uppercase", (c?.count ?? 0) > 0 ? "text-slate-400" : "text-slate-200")}>P{pNum}</span>
                                  <span className="text-xs font-display font-extrabold leading-none mt-0.5">{c?.count || 0}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-8 flex gap-6 text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 border-t pt-5">
                    <div className="flex items-center gap-2"><div className="h-2 w-2 bg-slate-900 rounded-full" /> {t('coso.covered')}</div>
                    <div className="flex items-center gap-2"><div className="h-2 w-2 bg-white border border-slate-200 rounded-full" /> {t('coso.zeroCoverage')}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <motion.div variants={itemVariants} className="h-full">
              <Card className="border-slate-200 shadow-sm overflow-hidden h-full flex flex-col bg-white">
                <CardHeader className="bg-slate-50/50 border-b py-5 px-6">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                     <Activity className="h-4 w-4 text-slate-900" /> {t('actionCenter.title')}
                  </CardTitle>
                  <CardDescription className="text-[11px] font-medium text-slate-500 mt-1">{t('actionCenter.description')}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 flex-1">
                  <div 
                    className="group flex flex-col p-5 rounded-lg border border-slate-100 bg-white hover:border-slate-900 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden" 
                    onClick={() => navigate('/todo')}
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded bg-slate-50 text-slate-900 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-colors">
                           <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div className="text-right">
                          <Badge className="bg-slate-100 text-slate-900 hover:bg-slate-100 border-none font-bold text-[10px] px-2 py-0.5 rounded-sm">{csaCompletion}%</Badge>
                        </div>
                     </div>
                     <h4 className="font-display font-extrabold text-slate-900 text-base flex items-center justify-between">
                       {t('actionCenter.csa.title')}
                       <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                     </h4>
                     <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">{t('actionCenter.csa.description')}</p>
                  </div>

                  {openDeficiencies.length > 0 && (
                    <div 
                      className="group flex flex-col p-5 rounded-lg border border-slate-100 bg-white hover:border-rose-600 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden" 
                      onClick={() => navigate('/deficiencies')}
                    >
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-2 rounded bg-rose-50 text-rose-600 border border-rose-100 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-colors">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <Badge className="bg-rose-600 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded-sm">{openDeficiencies.length} {t('badges.new')}</Badge>
                      </div>
                      <h4 className="font-display font-extrabold text-slate-900 text-base flex items-center justify-between">
                        {t('actionCenter.deficiency.title')}
                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">{t('actionCenter.deficiency.description')}</p>
                    </div>
                  )}

                  <div 
                    className="group flex flex-col p-5 rounded-lg border border-slate-100 bg-white hover:border-emerald-600 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden" 
                    onClick={() => navigate('/reports')}
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                           <FileText className="h-5 w-5" />
                        </div>
                        <Badge className="bg-emerald-600 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-tighter">{t('badges.report')}</Badge>
                     </div>
                     <h4 className="font-display font-extrabold text-slate-900 text-base flex items-center justify-between">
                       {t('actionCenter.reports.title')}
                       <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                     </h4>
                     <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">{t('actionCenter.reports.description')}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
               {[
                 { label: t('kpis.remediationVelocity'), value: t('kpis.remediationAvgDays'), icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-50' },
                 { label: t('kpis.line2Validation'), value: t('kpis.line2Percent'), icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50' }
               ].map((metric, i) => (
                 <div key={i} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className={cn("h-10 w-10 rounded flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white", metric.bg)}>
                          <metric.icon className="h-5 w-5 transition-colors" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</p>
                          <p className="text-sm font-display font-extrabold text-slate-900 mt-0.5">{metric.value}</p>
                       </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                 </div>
               ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
