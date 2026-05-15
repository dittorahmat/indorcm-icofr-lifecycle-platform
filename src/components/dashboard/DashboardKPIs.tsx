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
        <Card className="bg-slate-900 text-white border-none h-full shadow-sm ring-1 ring-slate-800 overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="h-3 w-3" /> {t('kpis.cycleReadiness')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-extrabold tracking-tighter">{t('kpis.ready')}</div>
            <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-wider">{t('kpis.reportingCycle', { year: '2026' })}</p>
            <div className="mt-5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '92%' }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="h-full bg-white rounded-full" 
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
          <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full border-b-2 hover:border-b-slate-400">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <kpi.icon className={cn("h-3 w-3", kpi.color)} /> {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-display font-extrabold tracking-tight", kpi.valueColor || "text-slate-900")}>{kpi.value}</div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-1">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
