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
      staggerChildren: 0.04
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 8, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] // ease-out-expo
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
            <Card className="bg-slate-900 text-white border-none h-full shadow-lg ring-1 ring-slate-800 overflow-hidden relative group">
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
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="h-full bg-white rounded-full" 
                   />
                </div>
              </CardContent>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="h-20 w-20 -mr-4 -mt-4 rotate-12" />
              </div>
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
              <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full border-b-2 hover:border-b-slate-400">
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
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* LEFT CONTENT AREA (Span 8) */}
          <div className="lg:col-span-8 space-y-8">
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
                                    "h-10 flex flex-col items-center justify-center rounded transition-all duration-300 cursor-default",
                                    (c?.count ?? 0) > 0 
                                      ? 'bg-slate-900 border border-slate-900 text-white shadow-sm ring-1 ring-slate-900/5' 
                                      : 'bg-white border border-dashed border-slate-200 text-slate-300 opacity-60'
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
                    <div className="flex items-center gap-2"><div className="h-2 w-2 bg-white border border-dashed border-slate-200 rounded-full" /> {t('coso.zeroCoverage')}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b py-5 px-6">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                     <Activity className="h-4 w-4 text-slate-900" /> {t('actionCenter.title')}
                  </CardTitle>
                  <CardDescription className="text-[11px] font-medium text-slate-500 mt-1">{t('actionCenter.description')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-slate-100">
                  
                  {/* Action 1: CSA */}
                  <button 
                    className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                    onClick={() => navigate('/todo')}
                  >
                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <h4 className="font-display font-extrabold text-slate-900 text-sm">{t('actionCenter.csa.title')}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t('actionCenter.csa.description')}</p>
                    </div>
                    <div className="text-right relative z-10">
                      <Badge variant="outline" className="bg-white border-slate-200 text-slate-900 font-bold text-[10px] group-hover:border-slate-900 transition-colors">{csaCompletion}%</Badge>
                      <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-slate-900 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" />
                    </div>
                  </button>

                  {/* Action 2: Deficiencies (Urgent) */}
                  {openDeficiencies.length > 0 && (
                    <button 
                      className="w-full flex items-center gap-4 p-5 hover:bg-rose-50/50 transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                      onClick={() => navigate('/deficiencies')}
                    >
                      <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/5 transition-colors" />
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                        <h4 className="font-display font-extrabold text-slate-900 text-sm">{t('actionCenter.deficiency.title')}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t('actionCenter.deficiency.description')}</p>
                      </div>
                      <div className="text-right relative z-10">
                        <Badge className="bg-rose-600 text-white border-none font-bold text-[10px] ring-2 ring-white group-hover:ring-rose-100 transition-all">{openDeficiencies.length}</Badge>
                        <ArrowUpRight className="h-3 w-3 text-rose-300 group-hover:text-rose-600 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" />
                      </div>
                    </button>
                  )}

                  {/* Action 3: Reports */}
                  <button 
                    className="w-full flex items-center gap-4 p-5 hover:bg-emerald-50/50 transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                    onClick={() => navigate('/reports')}
                  >
                    <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <h4 className="font-display font-extrabold text-slate-900 text-sm">{t('actionCenter.reports.title')}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t('actionCenter.reports.description')}</p>
                    </div>
                    <div className="text-right relative z-10">
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-emerald-700 font-bold text-[10px] uppercase group-hover:bg-emerald-100 transition-colors">Ready</Badge>
                      <ArrowUpRight className="h-3 w-3 text-emerald-300 group-hover:text-emerald-600 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" />
                    </div>
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* SECONDARY METRICS (Optimized grid) */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
               {[
                 { label: t('kpis.remediationVelocity'), value: t('kpis.remediationAvgDays'), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { label: t('kpis.line2Validation'), value: t('kpis.line2Percent'), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' }
               ].map((metric, i) => (
                 <div key={i} className="group p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer flex flex-col gap-2 ring-1 ring-slate-100/50">
                    <div className={cn("h-7 w-7 rounded flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white shrink-0 shadow-sm", metric.bg)}>
                        <metric.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 line-clamp-1">{metric.label}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-display font-extrabold text-slate-900 leading-none">{metric.value}</p>
                          <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-slate-900 transition-all duration-300 translate-x-0 group-hover:translate-x-1" />
                        </div>
                    </div>
                 </div>
               ))}
            </motion.div>

          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
