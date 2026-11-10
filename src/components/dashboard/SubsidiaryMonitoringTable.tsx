import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronRight, Filter, RefreshCw, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface SubsidiaryMonitoringItem {
  id: string;
  code: string;
  name: string;
  cluster: string;
  testingProgress: number; // e.g. 96
  phase: string; // e.g. 'Fase 4'
  effectiveControls: number;
  totalControls: number;
  effectivePercentage: number;
  mwCount?: number;
  sdCount: number;
  cdCount: number;
  interimOpinion: 'Effective' | 'Substantially Effective' | 'Needs Improvement';
  targetSignOff: string;
}

const DEFAULT_SUBSIDIARIES: SubsidiaryMonitoringItem[] = [
  {
    id: 'sub-1',
    code: 'SI',
    name: 'PT Semen Indonesia (Persero) Tbk',
    cluster: 'Klaster Manufaktur & Infrastruktur',
    testingProgress: 96,
    phase: 'Fase 4',
    effectiveControls: 312,
    totalControls: 324,
    effectivePercentage: 96.3,
    sdCount: 2,
    cdCount: 10,
    interimOpinion: 'Effective',
    targetSignOff: '15 Jan 2025',
  },
  {
    id: 'sub-2',
    code: 'PN',
    name: 'PT Pupuk Nusantara Holding',
    cluster: 'Klaster Pangan & Pupuk',
    testingProgress: 91,
    phase: 'Fase 4',
    effectiveControls: 285,
    totalControls: 310,
    effectivePercentage: 91.9,
    sdCount: 4,
    cdCount: 21,
    interimOpinion: 'Substantially Effective',
    targetSignOff: '18 Jan 2025',
  },
  {
    id: 'sub-3',
    code: 'PM',
    name: 'PT Perkebunan Madani Persero',
    cluster: 'Klaster Perkebunan & Kehutanan',
    testingProgress: 78,
    phase: 'Delayed',
    effectiveControls: 198,
    totalControls: 248,
    effectivePercentage: 79.8,
    mwCount: 1,
    sdCount: 5,
    cdCount: 44,
    interimOpinion: 'Needs Improvement',
    targetSignOff: '10 Jan 2025',
  },
  {
    id: 'sub-4',
    code: 'LE',
    name: 'PT Logistik Energi Nusantara',
    cluster: 'Klaster Minyak, Gas & Energi',
    testingProgress: 94,
    phase: 'Fase 4',
    effectiveControls: 245,
    totalControls: 262,
    effectivePercentage: 93.5,
    sdCount: 2,
    cdCount: 8,
    interimOpinion: 'Effective',
    targetSignOff: '22 Jan 2025',
  },
];

export interface SubsidiaryMonitoringTableProps {
  subsidiaries?: SubsidiaryMonitoringItem[];
  onRefresh?: () => void;
  onViewDetails?: (item: SubsidiaryMonitoringItem) => void;
}

export function SubsidiaryMonitoringTable({
  subsidiaries = DEFAULT_SUBSIDIARIES,
  onRefresh,
  onViewDetails,
}: SubsidiaryMonitoringTableProps) {
  const { t } = useTranslation('dashboard');

  return (
    <div className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl shadow-xs border border-border/40 flex flex-col gap-4 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <h3 className="font-display text-base sm:text-lg font-bold text-primary tracking-tight">
            {t('subsidiaryTable.title')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('subsidiaryTable.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground">{t('subsidiaryTable.filterCluster')}:</span>
            <span className="font-bold text-primary">{t('subsidiaryTable.allSectors')}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('subsidiaryTable.refreshSync')}</span>
          </Button>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0 border border-border/30 rounded-lg">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead className="bg-surface-container-low text-muted-foreground text-xs font-semibold">
            <tr>
              <th className="py-2.5 px-4 rounded-l-lg">{t('subsidiaryTable.colSubsidiary')}</th>
              <th className="py-2.5 px-3">{t('subsidiaryTable.colProgress')}</th>
              <th className="py-2.5 px-3">{t('subsidiaryTable.colControls')}</th>
              <th className="py-2.5 px-3">{t('subsidiaryTable.colDeficiencies')}</th>
              <th className="py-2.5 px-3">{t('subsidiaryTable.colOpinion')}</th>
              <th className="py-2.5 px-3">{t('subsidiaryTable.colSignOff')}</th>
              <th className="py-2.5 px-4 text-right rounded-r-lg">{t('subsidiaryTable.colAction')}</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-border/30 bg-card">
            {subsidiaries.map(sub => {
              const isAlert = Boolean(sub.mwCount && sub.mwCount > 0);

              return (
                <tr
                  key={sub.id}
                  className={cn(
                    'transition-colors',
                    isAlert ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-surface-container-low/60'
                  )}
                >
                  <td className="py-3 px-4 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0',
                          isAlert
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-surface-container-high text-primary'
                        )}
                      >
                        {sub.code}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-primary truncate max-w-[240px]">
                            {sub.name}
                          </span>
                          {isAlert && (
                            <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0" aria-hidden="true" />
                          )}
                        </div>
                        <span className="text-muted-foreground truncate">{sub.cluster}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 w-28">
                      <div className="flex justify-between font-semibold">
                        <span className={cn(isAlert ? 'text-destructive' : 'text-primary')}>
                          {sub.testingProgress}%
                        </span>
                        <span className={cn(isAlert ? 'text-destructive' : 'text-secondary font-medium')}>
                          {sub.phase}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', isAlert ? 'bg-destructive' : 'bg-secondary')}
                          style={{ width: `${sub.testingProgress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span className="font-bold text-primary">{sub.effectiveControls}</span>
                    <span className="text-muted-foreground"> / {sub.totalControls} </span>
                    <span
                      className={cn(
                        'font-sans font-semibold',
                        isAlert ? 'text-destructive' : 'text-secondary'
                      )}
                    >
                      ({sub.effectivePercentage}%)
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sub.mwCount && sub.mwCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-destructive text-destructive-foreground font-bold">
                          {sub.mwCount} MW
                        </span>
                      ) : null}
                      <span className="px-2 py-0.5 rounded text-xs bg-surface-container-high text-primary font-bold">
                        {sub.sdCount} SD
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-surface-container-low text-muted-foreground font-semibold">
                        {sub.cdCount} CD
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {sub.interimOpinion === 'Effective' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-secondary-container text-on-secondary-container font-bold uppercase">
                        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {t('subsidiaryTable.opEffective')}
                      </span>
                    )}
                    {sub.interimOpinion === 'Substantially Effective' && (
                      <span className="px-2 py-0.5 rounded text-xs bg-secondary-container text-on-secondary-container font-bold uppercase">
                        {t('subsidiaryTable.opSubstantiallyEffective')}
                      </span>
                    )}
                    {sub.interimOpinion === 'Needs Improvement' && (
                      <span className="px-2 py-0.5 rounded text-xs bg-destructive/15 text-destructive font-bold uppercase">
                        {t('subsidiaryTable.opNeedsImprovement')}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-muted-foreground">
                    {sub.targetSignOff}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails?.(sub)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-lg"
                      aria-label={`${t('subsidiaryTable.viewAria')} ${sub.name}`}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
