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
  Zap, ClipboardCheck, FileText, LayoutDashboard, ChevronRight,
  TrendingUp, ShieldAlert, Target
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
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

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

  const openDeficiencies = deficienciesData?.items.filter(d => d.status === 'Open') || [];
  const csaCompletion = 88.5; // Mock/Derived
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
          title={<span className="font-display tracking-tight">{t('title')}</span>} 
          description={t('description')} 
        >
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all" onClick={() => navigate('/rcm')}>
                <Target className="h-4 w-4 text-slate-500" /> Manage RCM
             </Button>
             <Button className="gap-2 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all" onClick={() => navigate('/csa')}>
                <ClipboardCheck className="h-4 w-4" /> Start Assessment
             </Button>
          </div>
        </PageHeader>

        {/* SECTION 1: TIERED KPIs */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* PRIMARY HERO KPI */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900 text-white shadow-xl shadow-slate-200 border-none overflow-hidden relative group h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {t('kpis.cycleReadiness')}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-display font-bold tracking-tight">{t('kpis.ready')}</div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-wider">{t('kpis.reportingCycle', { year: '2026' })}</p>
                <div className="mt-5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)]" 
                   />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SUPPORTING KPIs */}
          {[
            { 
              title: t('kpis.controlCoverage'), 
              value: controlsData?.items.length || '0', 
              subtitle: t('kpis.activeControls'),
              icon: CheckCircle,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              border: 'border-emerald-100'
            },
            { 
              title: t('kpis.openDeficiencies'), 
              value: openDeficiencies.length, 
              subtitle: t('kpis.needRemediation'),
              icon: ShieldAlert,
              color: 'text-rose-600',
              bg: 'bg-rose-50',
              border: 'border-rose-100',
              valueColor: 'text-rose-600'
            },
            { 
              title: t('kpis.cosoCoverage'), 
              value: `${cosoPercentage}%`, 
              subtitle: t('kpis.principlesCoverage'),
              icon: ShieldCheck,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              border: 'border-blue-100'
            }
          ].map((kpi, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 h-full overflow-hidden relative group">
                <div className={cn("absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 opacity-20 transition-transform group-hover:scale-110", kpi.bg)} />
                <CardHeader className="pb-1">
                  <CardTitle className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <kpi.icon className={cn("h-3 w-3", kpi.color)} /> {kpi.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-display font-bold", kpi.valueColor || "text-slate-900")}>{kpi.value}</div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">{kpi.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* LEFT COLUMN: CHARTS & COSO (Span 2) */}
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
              <Card className="border-slate-200 overflow-hidden shadow-sm">
                <CardHeader className="bg-slate-50/80 border-b py-5 px-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-slate-900">
                        <LayoutDashboard className="h-4 w-4 text-indigo-600" /> {t('coso.title')}
                      </CardTitle>
                      <CardDescription className="text-[11px] font-medium text-slate-500 mt-1">{t('coso.description')}</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] bg-white border-slate-200 px-2.5 py-0.5">17 PRINCIPLES</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-3">
                    {isLoading ? Array.from({ length: 17 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />) : (
                      cosoCoverage.map((c) => (
                        <div 
                          key={c.principle} 
                          className={cn(
                            "h-14 flex flex-col items-center justify-center rounded-lg border-2 text-xs transition-all duration-300 group cursor-default",
                            c.count > 0 
                              ? 'bg-white border-indigo-100 text-indigo-700 shadow-sm hover:border-indigo-400 hover:shadow-indigo-100' 
                              : 'bg-slate-50 border-slate-100 text-slate-300'
                          )}
                          title={`${c.count} controls mapped to Principle ${c.principle}`}
                        >
                          <span className="text-[10px] font-bold opacity-60 tracking-tighter">P{c.principle}</span>
                          <span className="text-base font-display font-bold leading-none mt-1">{c.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-8 flex gap-6 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    <div className="flex items-center gap-2"><div className="h-2 w-2 bg-indigo-500 rounded-full ring-4 ring-indigo-50" /> {t('coso.covered')}</div>
                    <div className="flex items-center gap-2"><div className="h-2 w-2 bg-slate-200 rounded-full ring-4 ring-slate-50" /> {t('coso.zeroCoverage')}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: ACTION CENTER (Span 1) */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div variants={itemVariants} className="h-full">
              <Card className="border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                <CardHeader className="bg-slate-50/80 border-b py-5 px-6">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                     <Zap className="h-4 w-4 text-indigo-600 animate-pulse" /> {t('actionCenter.title')}
                  </CardTitle>
                  <CardDescription className="text-[11px] font-medium text-slate-500 mt-1">{t('actionCenter.description')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5 flex-1">
                  
                  {/* ACTION 1: CSA Completion */}
                  <div 
                    className="group relative p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 cursor-pointer overflow-hidden" 
                    onClick={() => navigate('/todo')}
                  >
                     <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-100/50 transition-all duration-500" />
                     <div className="relative z-10">
                       <div className="flex justify-between items-start mb-3">
                          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50 group-hover:ring-indigo-100/50 transition-all">
                             <ClipboardCheck className="h-5 w-5" />
                          </div>
                          <Badge className="bg-indigo-600 text-white border-none font-bold text-[10px] px-2 py-0.5 shadow-sm">{csaCompletion}%</Badge>
                       </div>
                       <h4 className="font-display font-bold text-slate-900 text-base">{t('actionCenter.csa.title')}</h4>
                       <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">{t('actionCenter.csa.description')}</p>
                       <div className="mt-4 flex items-center text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                          CONTINUE <ChevronRight className="h-3 w-3 ml-1" />
                       </div>
                     </div>
                  </div>

                  {/* ACTION 2: Open Deficiencies */}
                  {openDeficiencies.length > 0 && (
                    <div 
                      className="group relative p-5 rounded-xl border border-slate-200 bg-white hover:border-rose-300 hover:shadow-lg hover:shadow-rose-50 transition-all duration-300 cursor-pointer overflow-hidden" 
                      onClick={() => navigate('/deficiencies')}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full -mr-12 -mt-12 group-hover:bg-rose-100/50 transition-all duration-500" />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 ring-4 ring-rose-50/50 group-hover:ring-rose-100/50 transition-all">
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                            <Badge className="bg-rose-600 text-white border-none font-bold text-[10px] px-2 py-0.5 shadow-sm">{openDeficiencies.length} NEW</Badge>
                        </div>
                        <h4 className="font-display font-bold text-slate-900 text-base">{t('actionCenter.deficiency.title')}</h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">{t('actionCenter.deficiency.description')}</p>
                        <div className="mt-4 flex items-center text-[10px] font-bold text-rose-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                           REVIEW ISSUES <ChevronRight className="h-3 w-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTION 3: Final Reporting */}
                  <div 
                    className="group relative p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 cursor-pointer overflow-hidden" 
                    onClick={() => navigate('/reports')}
                  >
                     <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-12 -mt-12 group-hover:bg-emerald-100/50 transition-all duration-500" />
                     <div className="relative z-10">
                       <div className="flex justify-between items-start mb-3">
                          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50 group-hover:ring-emerald-100/50 transition-all">
                             <FileText className="h-5 w-5" />
                          </div>
                          <Badge className="bg-emerald-600 text-white border-none font-bold text-[10px] px-2 py-0.5 shadow-sm">REPORT</Badge>
                       </div>
                       <h4 className="font-display font-bold text-slate-900 text-base">{t('actionCenter.reports.title')}</h4>
                       <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-medium">{t('actionCenter.reports.description')}</p>
                       <div className="mt-4 flex items-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                          GENERATE <ChevronRight className="h-3 w-3 ml-1" />
                       </div>
                     </div>
                  </div>

                </CardContent>
              </Card>
            </motion.div>

            {/* SECONDARY METRICS STACK */}
            <motion.div variants={itemVariants} className="space-y-4">
               {[
                 { label: t('kpis.remediationVelocity'), value: t('kpis.remediationAvgDays'), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
                 { label: t('kpis.line2Validation'), value: t('kpis.line2Percent'), icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' }
               ].map((metric, i) => (
                 <div key={i} className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", metric.bg)}>
                          <metric.icon className={cn("h-5 w-5", metric.color)} />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</p>
                          <p className="text-base font-display font-bold text-slate-900 mt-0.5">{metric.value}</p>
                       </div>
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors">
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
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

