import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const itemVariants: Variants = {
  hidden: { y: 8, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as any
    }
  }
};

interface DashboardKPIsProps {
  controlsCount: number;
  openDeficienciesCount: number;
  cosoPercentage: string;
  workingYear?: string;
}

export function DashboardKPIs({ controlsCount, openDeficienciesCount, cosoPercentage, workingYear = '2026' }: DashboardKPIsProps) {
  const { t } = useTranslation('dashboard');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
      {/* Executive Cycle Readiness Card */}
      <motion.div variants={itemVariants} className="min-w-0 w-full sm:col-span-2 lg:col-span-1">
        <Card className="bg-mancity-pattern text-primary-foreground border border-primary/20 shadow-md overflow-hidden relative group rounded-xl">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary-foreground/90 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {t('kpis.cycleReadiness')}
              </CardTitle>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                FY {workingYear}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-1 sm:pt-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">{t('kpis.ready')}</div>
              <p className="text-xs text-primary-foreground/80 font-medium uppercase tracking-wider">{t('kpis.reportingCycle', { year: workingYear })}</p>
            </div>
            <div className="mt-2.5 sm:mt-4 h-1.5 w-full bg-primary-foreground/20 rounded-full overflow-hidden relative">
               <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 0.92 }}
                transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                style={{ originX: 0 }}
                className="absolute inset-0 bg-primary-foreground rounded-full" 
               />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-3 sm:contents gap-2 sm:gap-4 col-span-1 sm:col-span-2 lg:col-span-3">
        {[
          { 
            title: t('kpis.controlCoverage'), 
            value: controlsCount, 
            subtitle: t('kpis.activeControls'),
            icon: CheckCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
          },
          { 
            title: t('kpis.openDeficiencies'), 
            value: openDeficienciesCount, 
            subtitle: t('kpis.needRemediation'),
            icon: ShieldAlert,
            color: 'text-destructive',
            bg: 'bg-destructive/10',
            valueColor: openDeficienciesCount > 0 ? 'text-destructive' : 'text-slate-900'
          },
          { 
            title: t('kpis.cosoCoverage'), 
            value: `${cosoPercentage}%`, 
            subtitle: t('kpis.principlesCoverage'),
            icon: ShieldCheck,
            color: 'text-primary',
            bg: 'bg-slate-50'
          }
        ].map((kpi, i) => (
          <motion.div key={i} variants={itemVariants} className="min-w-0 w-full">
            <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 h-full border-b-2 hover:border-b-primary rounded-xl overflow-hidden flex flex-col justify-between p-2.5 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                <kpi.icon className={cn("h-3.5 w-3.5 shrink-0", kpi.color)} aria-hidden="true" />
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider truncate" title={kpi.title}>
                  {kpi.title}
                </span>
              </div>
              <div>
                <div className={cn("text-lg sm:text-2xl md:text-3xl font-bold tracking-tight", kpi.valueColor || "text-slate-900")}>
                  {kpi.value}
                </div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5 line-clamp-1" title={kpi.subtitle}>
                  {kpi.subtitle}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
