import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import type { RCM, Deficiency, Control } from '@shared/types';
import { 
  ShieldCheck, TrendingUp, Target, ClipboardCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { COSOCoverageGrid } from '@/components/dashboard/COSOCoverageGrid';
import { ActionCenter } from '@/components/dashboard/ActionCenter';

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

        <DashboardKPIs 
          controlsCount={controlsData?.items.length || 0}
          openDeficienciesCount={openDeficiencies.length}
          cosoPercentage={cosoPercentage}
        />

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
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
               {[
                 { label: t('kpis.remediationVelocity'), value: t('kpis.remediationAvgDays'), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { label: t('kpis.line2Validation'), value: t('kpis.line2Percent'), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' }
               ].map((metric, i) => (
                 <div key={i} className="group p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer flex flex-col gap-3 ring-1 ring-slate-100/50">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white shrink-0 shadow-sm", metric.bg)}>
                        <metric.icon className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 line-clamp-1">{metric.label}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-display font-black text-slate-900 leading-none tracking-tight">{metric.value}</p>
                          <Target className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900 transition-all duration-300 translate-x-0 group-hover:translate-x-1" />
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
