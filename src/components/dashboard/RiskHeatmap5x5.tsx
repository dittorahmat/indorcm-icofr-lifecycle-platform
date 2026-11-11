import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeatmapCell {
  likelihood: number; // 1 - 5 (Rare to Almost Certain)
  impact: number; // 1 - 5 (Insignificant to Catastrophic)
  count: number;
  badge?: string; // e.g. 'REV', 'FIN', 'ITG', 'EXP'
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const HEATMAP_DATA: HeatmapCell[] = [
  // Likelihood 5 - Almost Certain
  { likelihood: 5, impact: 1, count: 2, severity: 'low' },
  { likelihood: 5, impact: 2, count: 4, severity: 'medium' },
  { likelihood: 5, impact: 3, count: 5, severity: 'medium' },
  { likelihood: 5, impact: 4, count: 3, badge: 'REV', severity: 'high' },
  { likelihood: 5, impact: 5, count: 2, badge: 'FIN', severity: 'critical' },
  // Likelihood 4 - Likely
  { likelihood: 4, impact: 1, count: 1, severity: 'low' },
  { likelihood: 4, impact: 2, count: 3, severity: 'low' },
  { likelihood: 4, impact: 3, count: 8, severity: 'medium' },
  { likelihood: 4, impact: 4, count: 4, badge: 'ITG', severity: 'high' },
  { likelihood: 4, impact: 5, count: 5, badge: 'EXP', severity: 'critical' },
  // Likelihood 3 - Possible
  { likelihood: 3, impact: 1, count: 6, severity: 'low' },
  { likelihood: 3, impact: 2, count: 11, severity: 'low' },
  { likelihood: 3, impact: 3, count: 14, severity: 'medium' },
  { likelihood: 3, impact: 4, count: 6, severity: 'medium' },
  { likelihood: 3, impact: 5, count: 0, severity: 'high' },
  // Likelihood 2 - Unlikely
  { likelihood: 2, impact: 1, count: 18, severity: 'low' },
  { likelihood: 2, impact: 2, count: 22, severity: 'low' },
  { likelihood: 2, impact: 3, count: 12, severity: 'low' },
  { likelihood: 2, impact: 4, count: 4, severity: 'medium' },
  { likelihood: 2, impact: 5, count: 0, severity: 'medium' },
  // Likelihood 1 - Rare
  { likelihood: 1, impact: 1, count: 34, severity: 'low' },
  { likelihood: 1, impact: 2, count: 16, severity: 'low' },
  { likelihood: 1, impact: 3, count: 9, severity: 'low' },
  { likelihood: 1, impact: 4, count: 2, severity: 'low' },
  { likelihood: 1, impact: 5, count: 0, severity: 'medium' },
];

export function RiskHeatmap5x5() {
  const { t } = useTranslation('dashboard');

  const rows = [
    { level: 5, label: t('riskHeatmap.l5') },
    { level: 4, label: t('riskHeatmap.l4') },
    { level: 3, label: t('riskHeatmap.l3') },
    { level: 2, label: t('riskHeatmap.l2') },
    { level: 1, label: t('riskHeatmap.l1') },
  ];

  const columns = [
    { level: 1, label: t('riskHeatmap.i1') },
    { level: 2, label: t('riskHeatmap.i2') },
    { level: 3, label: t('riskHeatmap.i3') },
    { level: 4, label: t('riskHeatmap.i4') },
    { level: 5, label: t('riskHeatmap.i5') },
  ];

  return (
    <div className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl shadow-xs border border-border/40 flex flex-col gap-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
        <div className="flex flex-col min-w-0">
          <h3 className="font-display text-base sm:text-lg font-bold text-primary tracking-tight">
            {t('riskHeatmap.title')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('riskHeatmap.subtitle')}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-xs font-semibold text-primary shrink-0 self-start sm:self-auto">
          <ShieldAlert className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
          <span>{t('riskHeatmap.bpkpStandard')}</span>
        </div>
      </div>

      {/* Heatmap Grid in scrollable container */}
      <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0 pb-1">
        <div className="min-w-[560px] grid grid-cols-6 gap-1.5 text-center text-xs select-none">
          {/* Header Row */}
          <div className="text-muted-foreground p-1 self-center font-bold text-left text-xs">
            {t('riskHeatmap.axisLabel')}
          </div>
          {columns.map(col => (
            <div
              key={col.level}
              className="bg-surface-container-low font-bold text-primary p-2 rounded text-xs truncate"
              title={col.label}
            >
              {col.label}
            </div>
          ))}

          {/* Matrix Body */}
          {rows.map(row => (
            <React.Fragment key={row.level}>
              <div className="bg-surface-container-low font-bold text-primary p-2 rounded text-left flex items-center text-xs truncate">
                {row.label}
              </div>
              {columns.map(col => {
                const cell = HEATMAP_DATA.find(
                  c => c.likelihood === row.level && c.impact === col.level
                );
                const count = cell?.count ?? 0;
                const badge = cell?.badge;
                const sev = cell?.severity ?? 'low';

                let cellColor = 'bg-secondary/10 text-secondary';
                if (sev === 'critical') {
                  cellColor = 'bg-destructive text-destructive-foreground';
                } else if (sev === 'high') {
                  cellColor = 'bg-destructive/15 text-destructive font-bold';
                } else if (sev === 'medium') {
                  cellColor = 'bg-surface-container-highest text-primary font-bold';
                }

                return (
                  <div
                    key={`${row.level}-${col.level}`}
                    className={cn(
                      'p-2.5 rounded font-mono text-xs flex items-center justify-center font-bold transition-transform hover:scale-[1.02]',
                      cellColor
                    )}
                  >
                    <span>{count}</span>
                    {badge ? (
                      <span className="text-xs ml-1 opacity-90">({badge})</span>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend & Priority Cycles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-surface-container-low p-3 rounded-lg text-xs">
        <span className="font-bold text-primary">{t('riskHeatmap.priorityCycleTitle')}:</span>
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0" aria-hidden="true" />
            <span>REV: Revenue (3)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0" aria-hidden="true" />
            <span>EXP: Procurement (5)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
            <span>ITG: IT Controls (4)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0" aria-hidden="true" />
            <span>FIN: Reporting (2)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
