import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Download, Layers } from 'lucide-react';
import type { Deficiency } from '@shared/types';

export interface DeficiencySummaryProps {
  deficiencies?: Deficiency[];
  totalFindings?: number;
  dodCount?: number;
  dooCount?: number;
  materialWeaknessCount?: number;
  significantDeficiencyCount?: number;
  controlDeficiencyCount?: number;
}

export function DeficiencySummary({
  deficiencies,
  totalFindings,
  dodCount,
  dooCount,
  materialWeaknessCount,
  significantDeficiencyCount,
  controlDeficiencyCount,
}: DeficiencySummaryProps) {
  const { t } = useTranslation('dashboard');

  // Compute metrics from items if provided, otherwise fall back to explicit props or standard defaults
  const metrics = React.useMemo(() => {
    if (deficiencies && deficiencies.length > 0) {
      const mw = deficiencies.filter(d => d.severity === 'Material Weakness').length;
      const sd = deficiencies.filter(d => d.severity === 'Significant Deficiency').length;
      const cd = deficiencies.filter(d => d.severity === 'Control Deficiency').length;
      const total = deficiencies.length;
      const dod = Math.round(total * 0.35);
      const doo = total - dod;
      return {
        total,
        dod,
        doo,
        mw,
        sd,
        cd,
      };
    }

    const total = totalFindings ?? 108;
    const dod = dodCount ?? 38;
    const doo = dooCount ?? 70;
    const mw = materialWeaknessCount ?? 1;
    const sd = significantDeficiencyCount ?? 13;
    const cd = controlDeficiencyCount ?? 94;

    return { total, dod, doo, mw, sd, cd };
  }, [deficiencies, totalFindings, dodCount, dooCount, materialWeaknessCount, significantDeficiencyCount, controlDeficiencyCount]);

  const dodPercent = metrics.total > 0 ? Math.round((metrics.dod / metrics.total) * 100) : 35;
  const dooPercent = 100 - dodPercent;

  return (
    <div className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl shadow-xs border border-border/40 flex flex-col justify-between gap-4 sm:gap-6 min-w-0">
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-display text-base sm:text-lg font-bold text-primary tracking-tight">
          {t('deficiencySummary.title')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('deficiencySummary.subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* DoD vs DoO Summary Bar */}
        <div className="bg-surface-container-low p-3.5 sm:p-4 rounded-xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold gap-2">
            <span className="text-primary truncate">
              {t('deficiencySummary.dodLabel')}
            </span>
            <span className="font-mono text-primary shrink-0">
              {metrics.dod} {t('deficiencySummary.cases')} ({dodPercent}%)
            </span>
          </div>

          <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
            <div
              className="bg-primary/80 h-full transition-all duration-500"
              style={{ width: `${dodPercent}%` }}
              title={`DoD: ${dodPercent}%`}
            />
            <div
              className="bg-secondary h-full transition-all duration-500"
              style={{ width: `${dooPercent}%` }}
              title={`DoO: ${dooPercent}%`}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-bold gap-2">
            <span className="text-secondary truncate">
              {t('deficiencySummary.dooLabel')}
            </span>
            <span className="font-mono text-secondary shrink-0">
              {metrics.doo} {t('deficiencySummary.cases')} ({dooPercent}%)
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t('deficiencySummary.typologyNote')}
          </span>
        </div>

        {/* 3 Tiers of Deficiencies */}
        <div className="flex flex-col gap-2">
          {/* Material Weakness */}
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0" aria-hidden="true" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-destructive truncate">
                  {t('deficiencySummary.mwTitle')}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {t('deficiencySummary.mwDescription')}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-display text-lg font-bold text-destructive">
                {metrics.mw}
              </span>
              <span className="text-xs text-muted-foreground block">
                {t('deficiencySummary.mwUnit')}
              </span>
            </div>
          </div>

          {/* Significant Deficiency */}
          <div className="p-3 bg-surface-container-high rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Layers className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-primary truncate">
                  {t('deficiencySummary.sdTitle')}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {t('deficiencySummary.sdDescription')}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-display text-lg font-bold text-primary">
                {metrics.sd}
              </span>
              <span className="text-xs text-muted-foreground block">
                {t('deficiencySummary.sdUnit')}
              </span>
            </div>
          </div>

          {/* Control Deficiency */}
          <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0" aria-hidden="true" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-primary truncate">
                  {t('deficiencySummary.cdTitle')}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {t('deficiencySummary.cdDescription')}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-display text-lg font-bold text-secondary">
                {metrics.cd}
              </span>
              <span className="text-xs text-muted-foreground block">
                {t('deficiencySummary.cdUnit')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30">
        <span className="truncate">{t('deficiencySummary.frameworkNote')}</span>
        <button
          type="button"
          className="text-secondary font-bold hover:underline inline-flex items-center gap-1 text-xs shrink-0"
        >
          <span>{t('deficiencySummary.downloadLog')}</span>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
