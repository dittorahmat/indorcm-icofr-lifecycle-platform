import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Layers, ServerCog, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

const itemVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export interface ExecutiveStatCardsProps {
  totalControls?: number;
  testedControls?: number;
  effectivePercentage?: number;
  minorDeviations?: number;
  tlcEffective?: number;
  tlcTotal?: number;
  elcCompliance?: number;
  itgcCompliance?: number;
  openDeficienciesCount?: number;
  actionPlansCount?: number;
  overdueDeficienciesCount?: number;
}

export function ExecutiveStatCards({
  totalControls = 1348,
  testedControls = 1240,
  effectivePercentage = 92,
  minorDeviations = 108,
  tlcEffective = 1120,
  tlcTotal = 1210,
  elcCompliance = 96,
  itgcCompliance = 94,
  openDeficienciesCount = 14,
  actionPlansCount = 34,
  overdueDeficienciesCount = 7,
}: ExecutiveStatCardsProps) {
  const { t } = useTranslation('dashboard');

  const tlcPercent = tlcTotal > 0 ? Math.round((tlcEffective / tlcTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0 w-full max-w-full">
      {/* Card 1: Status Keseluruhan ICOFR */}
      <motion.div
        variants={itemVariants}
        className="bg-card text-card-foreground p-4 sm:p-5 rounded-xl shadow-xs border border-border/40 flex flex-col justify-between min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold truncate">
              {t('statCards.card1.title')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                {effectivePercentage}%
              </span>
              <span className="text-xs font-bold text-secondary px-1.5 py-0.5 rounded bg-secondary-container/50">
                {t('statCards.card1.statusEffective')}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary-container text-on-secondary-container shrink-0">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, effectivePercentage))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="truncate">
              {t('statCards.card1.testedRatio', { tested: testedControls, total: totalControls })}
            </span>
            <span className="text-primary font-semibold shrink-0 ml-1">
              {t('statCards.card1.minorDeviations', { count: minorDeviations })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Pengendalian Tingkat Transaksi (TLC) Efektif */}
      <motion.div
        variants={itemVariants}
        className="bg-card text-card-foreground p-4 sm:p-5 rounded-xl shadow-xs border border-border/40 flex flex-col justify-between min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold truncate">
              {t('statCards.card2.title')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                {tlcPercent}%
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {t('statCards.card2.statusOnTrack')}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-high text-primary shrink-0">
            <Layers className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="bg-surface-container-low p-2 rounded-lg flex flex-col">
            <span className="text-xs text-muted-foreground font-medium truncate">
              {t('statCards.card2.tlcTestedLabel')}
            </span>
            <span className="text-sm font-bold text-primary font-mono mt-0.5">
              {tlcEffective} / {tlcTotal}
            </span>
          </div>
          <div className="bg-surface-container-low p-2 rounded-lg flex flex-col">
            <span className="text-xs text-muted-foreground font-medium truncate">
              {t('statCards.card2.csaSyncLabel')}
            </span>
            <span className="text-sm font-bold text-secondary font-mono mt-0.5">
              98.2%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 3: Entity Level (ELC) & ITGC Kepatuhan */}
      <motion.div
        variants={itemVariants}
        className="bg-card text-card-foreground p-4 sm:p-5 rounded-xl shadow-xs border border-border/40 flex flex-col justify-between min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold truncate">
              {t('statCards.card3.title')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                {elcCompliance}%
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {t('statCards.card3.elcHigh')}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-high text-primary shrink-0">
            <ServerCog className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs bg-surface-container-low p-2 rounded-lg gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground truncate">
              {t('statCards.card3.elcLabel', { percent: elcCompliance })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground truncate">
              {t('statCards.card3.itgcLabel', { percent: itgcCompliance })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 4: Status Defisiensi & Rencana Tindak Lanjut Remediasi */}
      <motion.div
        variants={itemVariants}
        className="bg-card text-card-foreground p-4 sm:p-5 rounded-xl shadow-xs border border-border/40 flex flex-col justify-between min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold truncate">
              {t('statCards.card4.title')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={cn(
                  'font-display text-2xl sm:text-3xl font-bold tracking-tight',
                  overdueDeficienciesCount > 0 ? 'text-destructive' : 'text-primary'
                )}
              >
                {overdueDeficienciesCount}
              </span>
              <span className="px-2 py-0.5 rounded text-xs bg-destructive/10 text-destructive font-bold uppercase">
                {t('statCards.card4.statusOverdue')}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive shrink-0">
            <AlertOctagon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1 text-destructive font-semibold min-w-0">
            <span className="truncate">{t('statCards.card4.slaOverdueNote')}</span>
          </div>
          <span className="text-muted-foreground shrink-0 font-medium">
            {t('statCards.card4.totalCap', { total: actionPlansCount, open: openDeficienciesCount })}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
