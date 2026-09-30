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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      <motion.div variants={itemVariants} className="col-span-2 sm:col-span-1">
        <Card className="bg-mancity-pattern text-primary-foreground border-none h-full shadow-lg ring-1 ring-primary/20 overflow-hidden relative group rounded-xl p-1">
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary-foreground/80 flex items-center gap-1.5 md:gap-2">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {t('kpis.cycleReadiness')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t('kpis.ready')}</div>
            <p className="text-xs text-primary-foreground/70 mt-1 font-semibold uppercase tracking-wider">{t('kpis.reportingCycle', { year: workingYear })}</p>
            <div className="mt-3 md:mt-6 h-1.5 w-full bg-primary-foreground/10 rounded-full overflow-hidden relative">
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

      {[
        { 
          title: t('kpis.controlCoverage'), 
          value: controlsCount, 
          subtitle: t('kpis.activeControls'),
          icon: CheckCircle,
          color: 'text-slate-900',
          bg: 'bg-slate-50'
        },
        { 
          title: t('kpis.openDeficiencies'), 
          value: openDeficienciesCount, 
          subtitle: t('kpis.needRemediation'),
          icon: ShieldAlert,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          valueColor: 'text-destructive'
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
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full border-b-2 hover:border-b-slate-900 rounded-xl">
            <CardHeader className="p-3 md:p-4 pb-1">
              <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 md:gap-2 truncate">
                <kpi.icon className={cn("h-3.5 w-3.5 shrink-0", kpi.color)} aria-hidden="true" /> 
                <span className="truncate">{kpi.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className={cn("text-2xl sm:text-3xl font-bold tracking-tight", kpi.valueColor || "text-slate-900")}>{kpi.value}</div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5 md:mt-1 truncate">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
