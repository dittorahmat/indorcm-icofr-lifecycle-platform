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
}

export function DashboardKPIs({ controlsCount, openDeficienciesCount, cosoPercentage }: DashboardKPIsProps) {
  const { t } = useTranslation('dashboard');

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <motion.div variants={itemVariants}>
        <Card className="bg-mancity-pattern text-primary-foreground border-none h-full shadow-lg ring-1 ring-primary/20 overflow-hidden relative group rounded-xl p-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground/70 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> {t('kpis.cycleReadiness')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">{t('kpis.ready')}</div>
            <p className="text-[11px] text-primary-foreground/60 mt-1.5 font-bold uppercase tracking-wide">{t('kpis.reportingCycle', { year: '2026' })}</p>
            <div className="mt-6 h-1.5 w-full bg-primary-foreground/10 rounded-full overflow-hidden relative">
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
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full border-b-2 hover:border-b-slate-900 rounded-xl">
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] font-bold uppercase text-slate-500 tracking-wide flex items-center gap-2">
                <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} /> {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold tracking-tight", kpi.valueColor || "text-slate-900")}>{kpi.value}</div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-tight mt-1">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
