import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import type { RCM, Deficiency, Control, ActionPlan } from '@shared/types';
import { 
  ShieldCheck, TrendingUp, Target, ClipboardCheck, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, Variants, useReducedMotion } from 'framer-motion';

import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { COSOCoverageGrid } from '@/components/dashboard/COSOCoverageGrid';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { LifecycleProgress } from '@/components/dashboard/LifecycleProgress';
import { CSARealizationTable } from '@/components/dashboard/CSARealizationTable';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

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
  const { workingYear } = useFiscalYearStore();

  const { data: rcmData, isLoading: rcmLoading } = useQuery({
    queryKey: ['rcm', workingYear],
    queryFn: () => api<{ items: RCM[] }>(`/api/rcm?year=${workingYear}`),
  });

  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls', workingYear],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?year=${workingYear}`),
  });

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies', workingYear],
    queryFn: () => api<{ items: Deficiency[] }>(`/api/deficiencies?year=${workingYear}`),
  });

  const { data: actionPlansData, isLoading: actionPlansLoading } = useQuery({
    queryKey: ['actionplans'],
    queryFn: () => api<{ items: ActionPlan[] }>('/api/actionplans'),
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

  const isLoading = rcmLoading || deficienciesLoading || controlsLoading || actionPlansLoading;

  const openDeficiencies = deficienciesData?.items.filter(d => d.status === 'Open') || [];

  const csaCompletion = React.useMemo(() => {
    if (!controlsData?.items || controlsData.items.length === 0) return 0;
    const completed = controlsData.items.filter(c => 
      c.lastCsaDate !== null || 
      c.line2Validation?.status === 'Validated' || 
      c.line2Validation?.status === 'Pending'
    ).length;
    return Number(((completed / controlsData.items.length) * 100).toFixed(1));
  }, [controlsData]);

  const line2Percent = React.useMemo(() => {
    if (!controlsData?.items || controlsData.items.length === 0) return 0;
    const completedControls = controlsData.items.filter(c => 
      c.lastCsaDate !== null || 
      c.line2Validation?.status === 'Validated' || 
      c.line2Validation?.status === 'Pending'
    );
    if (completedControls.length === 0) return 0;
    const validated = completedControls.filter(c => c.line2Validation?.status === 'Validated').length;
    return Number(((validated / completedControls.length) * 100).toFixed(1));
  }, [controlsData]);

  const remediationVelocity = React.useMemo(() => {
    if (!deficienciesData?.items || !actionPlansData?.items) return 12;
    
    // Find resolved deficiencies (Remediated, Verified, Closed)
    const resolvedDefs = deficienciesData.items.filter(d => 
      (d.status === 'Remediated' || d.status === 'Verified' || d.status === 'Closed') &&
      d.identifiedDate
    );
    
    if (resolvedDefs.length === 0) return 12; // default fallback if no resolved deficiencies
    
    let totalDays = 0;
    let count = 0;
    
    resolvedDefs.forEach(d => {
      const plan = actionPlansData.items.find(p => p.deficiencyId === d.id);
      if (plan && plan.actualCompletionDate && d.identifiedDate) {
        const diffTime = Math.abs(new Date(plan.actualCompletionDate).getTime() - new Date(d.identifiedDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalDays / count) : 12;
  }, [deficienciesData, actionPlansData]);

  const cosoPercentage = ((cosoCoverage.filter(c => c.count > 0).length / 17) * 100).toFixed(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <AppLayout container>
      <motion.div 
        className="w-full max-w-full min-w-0 overflow-x-hidden space-y-6 pb-12"
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
        variants={shouldReduceMotion ? undefined : containerVariants}
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
          <LifecycleProgress currentStage="evaluasi" workingYear={workingYear} />
        </motion.div>

        <DashboardKPIs 
          controlsCount={controlsData?.items.length || 0}
          openDeficienciesCount={openDeficiencies.length}
          cosoPercentage={cosoPercentage}
          workingYear={workingYear}
        />

        {/* MAIN DASHBOARD CONTENT */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* ACTION CENTER & OPERATIONAL METRICS (Priority 1 on mobile, Right column on desktop) */}
          <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            <motion.div variants={itemVariants}>
              <ActionCenter 
                csaCompletion={csaCompletion}
                openDeficienciesCount={openDeficiencies.length}
              />
            </motion.div>

            {/* SECONDARY METRICS (Optimized grid) */}
             <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {[
                  { label: t('kpis.remediationVelocity'), value: t('kpis.remediationAvgDays', { days: remediationVelocity }), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: t('kpis.line2Validation'), value: t('kpis.line2Percent', { percent: line2Percent }), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((metric, i) => (
                 <div key={i} className="group p-4 md:p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors group-hover:bg-slate-900 group-hover:text-white shrink-0 shadow-sm border border-slate-100", metric.bg)}>
                        <metric.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">{metric.label}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg md:text-xl font-bold text-slate-900 leading-tight">{metric.value}</p>
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all shrink-0" />
                        </div>
                    </div>
                 </div>
               ))}
            </motion.div>

            <motion.div variants={itemVariants} className="p-3 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider text-center">
                Compliance Engine v2.4.0 — BUMN Standard
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CSARealizationTable 
                controls={controlsData?.items || []} 
                isLoading={isLoading} 
              />
            </motion.div>
          </div>

          {/* ANALYTICAL CHARTS & COSO MATRICES (Priority 2 on mobile, Left column on desktop) */}
          <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
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
        </div>
      </motion.div>
    </AppLayout>
  );
}
