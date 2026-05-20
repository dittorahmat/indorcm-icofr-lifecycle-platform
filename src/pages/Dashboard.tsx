import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import type { RCM, Deficiency, Control } from '@shared/types';
import { 
  ShieldCheck, TrendingUp, Target, ClipboardCheck, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { COSOCoverageGrid } from '@/components/dashboard/COSOCoverageGrid';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { LifecycleProgress } from '@/components/dashboard/LifecycleProgress';

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
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] // professional cubic-bezier
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
    return Array.from({ length: 17 }, (_, i) => ({
      principle: i + 1,
      count: controlsData.items.filter(c => c.cosoPrinciples?.includes((i + 1) as any)).length
    }));
  }, [controlsData]);

  const deficiencyBySeverity = React.useMemo(() => {
    if (!deficienciesData) return [];
    // ONLY count Open deficiencies to match KPI card and regulatory description
    const openItems = deficienciesData.items.filter(d => d.status === 'Open');
    const counts = openItems.reduce((acc, def) => {
      acc[def.severity] = (acc[def.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [deficienciesData]);

  const barData = React.useMemo(() => {
    if (!controlsData || !rcmData) return [];
    
    // Create a stable map of process names from RCM to ensure all processes appear
    const processCounts = (rcmData.items || []).reduce((acc, rcm) => {
      acc[rcm.process] = 0;
      return acc;
    }, {} as Record<string, number>);

    // Group controls by their associated business process
    (controlsData.items || []).forEach(control => {
      if (control.businessProcess && control.businessProcess in processCounts) {
        processCounts[control.businessProcess]++;
      }
    });

    return Object.entries(processCounts).map(([name, controls]) => ({ 
      name, 
      controls 
    }));
  }, [controlsData, rcmData]);

  const isLoading = rcmLoading || deficienciesLoading || controlsLoading;

  const openDeficiencies = deficienciesData?.items.filter(d => d.status === 'Open') || [];
  const csaCompletion = 88.5; 
  const cosoPercentage = ((cosoCoverage.filter(c => c.count > 0).length / 17) * 100).toFixed(0);

  return (
    <AppLayout container>
      <motion.div 
        className="space-y-6 pb-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <PageHeader 
          title={<span className="font-semibold text-slate-900 tracking-normal">{t('title')}</span>} 
          description={t('description')} 
        >
          <div className="flex gap-2">
             <Button variant="outline" className="h-9 gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors px-3 text-sm" onClick={() => navigate('/rcm')}>
                <Target className="h-3.5 w-3.5" /> {t('actions.manageRcm')}
             </Button>
             <Button className="h-9 gap-2 bg-mancity-pattern text-primary-foreground hover:opacity-90 transition-all px-3 text-sm shadow-sm border-none font-bold" onClick={() => navigate('/csa')}>
                <ClipboardCheck className="h-3.5 w-3.5" /> {t('actions.startAssessment')}
             </Button>
          </div>
        </PageHeader>

        <motion.div variants={itemVariants}>
          <LifecycleProgress currentStage="evaluasi" />
        </motion.div>

        <DashboardKPIs 
          controlsCount={controlsData?.items.length || 0}
          openDeficienciesCount={openDeficiencies.length}
          cosoPercentage={cosoPercentage}
        />

        {/* MAIN DASHBOARD GRID */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* LEFT CONTENT AREA (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div variants={itemVariants}>
              <React.Suspense fallback={<Skeleton className="h-[380px] w-full rounded-xl" />}>
                <ComplianceCharts 
                  barData={barData} 
                  deficiencyBySeverity={deficiencyBySeverity} 
                  isLoading={isLoading} 
                />
              </React.Suspense>
            </motion.div>

            <motion.div variants={itemVariants}>
              <COSOCoverageGrid 
                cosoCoverage={cosoCoverage}
                isLoading={isLoading}
              />
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div variants={itemVariants}>
              <ActionCenter 
                csaCompletion={csaCompletion}
                openDeficienciesCount={openDeficiencies.length}
              />
            </motion.div>

            {/* SECONDARY METRICS (Optimized grid) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
               {[
                 { label: t('kpis.remediationVelocity'), value: t('kpis.remediationAvgDays'), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { label: t('kpis.line2Validation'), value: t('kpis.line2Percent'), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' }
               ].map((metric, i) => (
                 <div key={i} className="group p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors group-hover:bg-slate-900 group-hover:text-white shrink-0 shadow-sm border border-slate-100", metric.bg)}>
                        <metric.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{metric.label}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-slate-900 leading-tight">{metric.value}</p>
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                 </div>
               ))}
            </motion.div>

            <motion.div variants={itemVariants} className="p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center">
                Compliance Engine v2.4.0 — BUMN Standard
              </p>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
