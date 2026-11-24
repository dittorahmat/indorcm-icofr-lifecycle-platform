import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatIDR } from '@/components/reports/dod/dod-format';

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

export interface MaterialityKpiCardsProps {
  omValue: number;
  omPercentage?: number;
  pmValue: number;
  haircutPercentage?: number;
  clearlyTrivialThreshold?: number; // e.g. 5% of OM
  basisName?: string;
  benchmarkValue?: number;
}

export function MaterialityKpiCards({
  omValue,
  omPercentage = 1.0,
  pmValue,
  haircutPercentage = 25,
  clearlyTrivialThreshold,
  basisName = 'PBT / Total Assets',
  benchmarkValue,
}: MaterialityKpiCardsProps) {
  const { t } = useTranslation('scoping');

  // Tolerable Error / Clearly Trivial / SUD default is 5% of OM per BPKP & BUMN standard
  const resolvedClearlyTrivial = clearlyTrivialThreshold !== undefined && clearlyTrivialThreshold > 0
    ? clearlyTrivialThreshold
    : omValue * 0.05;

  const pmRatio = omValue > 0 ? Math.round((pmValue / omValue) * 100) : (100 - haircutPercentage);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0 w-full max-w-full">
      {/* KPI 1: Overall Materiality (OM) */}
      <motion.div
        variants={itemVariants}
        className="bg-card text-card-foreground p-4 sm:p-5 rounded-xl shadow-xs border border-border/40 flex flex-col justify-between min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold truncate">
              {t('materialityKpi.omTitle')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-xl sm:text-2xl font-bold text-primary tracking-tight break-all">
                {formatIDR(omValue)}
              </span>
              <span className="text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary-container/20">
                {omPercentage}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {t('materialityKpi.omSub', { basis: basisName })}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-high text-primary shrink-0">
            <Target className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 pt-2 bg-surface-container-low px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium truncate">
            {t('materialityKpi.omBaselineLabel')}
          </span>
          <span className="font-mono font-bold text-primary shrink-0 ml-1">
            100.0% OM
          </span>
        </div>
      </motion.div>

      {/* KPI 2: Performance Materiality (PM) */}
      <motion.div
        variants={itemVariants}
        className="bg-card text-card-foreground p-4 sm:p-5 rounded-xl shadow-xs border border-border/40 flex flex-col justify-between min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold truncate">
              {t('materialityKpi.pmTitle')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-xl sm:text-2xl font-bold text-secondary tracking-tight break-all">
                {formatIDR(pmValue)}
              </span>
              <span className="text-xs font-bold text-secondary px-1.5 py-0.5 rounded bg-secondary-container/50">
                {pmRatio}% OM
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {t('materialityKpi.pmSub', { ratio: pmRatio })}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-secondary-container text-on-secondary-container shrink-0">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 pt-2 bg-surface-container-low px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium truncate">
            {t('materialityKpi.pmRatioLabel')}
          </span>
          <span className="font-mono font-bold text-secondary shrink-0 ml-1">
            {pmRatio}% {t('materialityKpi.standardized')}
          </span>
        </div>
      </motion.div>

      {/* KPI 3: Clearly Trivial Threshold (Tolerable Error / SUD) */}
      <motion.div
        variants={itemVariants}
        className="bg-card text-card-foreground p-4 sm:p-5 rounded-xl shadow-xs border border-border/40 flex flex-col justify-between min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold truncate">
              {t('materialityKpi.trivialTitle')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-xl sm:text-2xl font-bold text-destructive tracking-tight break-all">
                {formatIDR(resolvedClearlyTrivial)}
              </span>
              <span className="text-xs font-bold text-destructive px-1.5 py-0.5 rounded bg-destructive/10">
                5% OM
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {t('materialityKpi.trivialSub')}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 pt-2 bg-surface-container-low px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium truncate">
            {t('materialityKpi.trivialPostingLimit')}
          </span>
          <span className="font-mono font-bold text-destructive shrink-0 ml-1">
            ≥ {formatIDR(resolvedClearlyTrivial)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
