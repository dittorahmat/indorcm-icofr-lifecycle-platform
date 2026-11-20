import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertCircle, Building2, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatIDR } from '@/components/reports/dod/dod-format';

export type ScopingAllocationStatus = 'In-Scope' | 'Out-of-Scope' | 'Qualitative Consideration';

export interface SubsidiaryProcessAllocationItem {
  id: string;
  code: string;
  name: string;
  segmentType: string; // e.g. "Holding", "Anak Perusahaan", "Unit Bisnis"
  balanceValue: number;
  percentageContribution: number;
  processCount: number;
  scopingStatus: ScopingAllocationStatus;
  qualitativeReason?: string;
  primarySystems?: string[];
}

const DEFAULT_ALLOCATIONS: SubsidiaryProcessAllocationItem[] = [
  {
    id: 'alloc-1',
    code: 'HLD-01',
    name: 'PT Holding BUMN (Persero) - Kantor Pusat',
    segmentType: 'Holding & Corporate',
    balanceValue: 8450000000000,
    percentageContribution: 33.8,
    processCount: 14,
    scopingStatus: 'In-Scope',
    qualitativeReason: 'Konsolidasi & Treasury Korporasi',
    primarySystems: ['SAP S/4HANA', 'Murex MX.3'],
  },
  {
    id: 'alloc-2',
    code: 'SUB-01',
    name: 'PT Semen Prima Nusantara',
    segmentType: 'Anak Perusahaan Operasional',
    balanceValue: 6200000000000,
    percentageContribution: 24.8,
    processCount: 11,
    scopingStatus: 'In-Scope',
    qualitativeReason: 'Penyumbang EBITDA > 20% & Aset Strategis',
    primarySystems: ['SAP S/4HANA', 'Billing Engine'],
  },
  {
    id: 'alloc-3',
    code: 'SUB-02',
    name: 'PT Pupuk Agro Chemia',
    segmentType: 'Anak Perusahaan Operasional',
    balanceValue: 4750000000000,
    percentageContribution: 19.0,
    processCount: 9,
    scopingStatus: 'In-Scope',
    qualitativeReason: 'Penyaluran Subsidi Pupuk PSO (Tinggi Regulasi)',
    primarySystems: ['SAP S/4HANA', 'E-Procurement'],
  },
  {
    id: 'alloc-4',
    code: 'SUB-03',
    name: 'PT Logistik Energi Distribusi',
    segmentType: 'Anak Perusahaan Operasional',
    balanceValue: 2400000000000,
    percentageContribution: 9.6,
    processCount: 7,
    scopingStatus: 'Qualitative Consideration',
    qualitativeReason: 'Rantai Pasok Kritis Distribusi Energi Nasional',
    primarySystems: ['Enterprise Logistics', 'SAP S/4HANA'],
  },
  {
    id: 'alloc-5',
    code: 'SUB-04',
    name: 'PT Rekayasa Jasa Konsultan',
    segmentType: 'Anak Perusahaan Penunjang',
    balanceValue: 450000000000,
    percentageContribution: 1.8,
    processCount: 3,
    scopingStatus: 'Out-of-Scope',
    qualitativeReason: 'Di bawah PM & Tidak Memiliki Risiko Signifikan',
    primarySystems: ['Local Accounting'],
  },
];

export interface SubsidiaryAllocationGridProps {
  items?: SubsidiaryProcessAllocationItem[];
  pmValue?: number;
  omValue?: number;
}

export function SubsidiaryAllocationGrid({
  items = DEFAULT_ALLOCATIONS,
  pmValue = 87500000000,
  omValue = 125000000000,
}: SubsidiaryAllocationGridProps) {
  const { t } = useTranslation('scoping');

  const inScopeCount = items.filter(i => i.scopingStatus === 'In-Scope').length;
  const qualCount = items.filter(i => i.scopingStatus === 'Qualitative Consideration').length;
  const outCount = items.filter(i => i.scopingStatus === 'Out-of-Scope').length;

  return (
    <div className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl shadow-xs border border-border/40 flex flex-col gap-4 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-secondary text-xs font-bold uppercase tracking-wider">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            <span>{t('subsidiaryGrid.kicker')}</span>
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-primary tracking-tight mt-0.5">
            {t('subsidiaryGrid.title')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('subsidiaryGrid.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-secondary-container text-on-secondary-container">
            {inScopeCount} In-Scope
          </span>
          {qualCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {qualCount} {t('subsidiaryGrid.badgeQualitative')}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-high text-muted-foreground">
            {outCount} Out-of-Scope
          </span>
        </div>
      </div>

      {/* Mandatory touch-pan-x responsive container */}
      <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0 border border-border/30 rounded-lg">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-surface-container-low text-muted-foreground text-xs font-semibold">
            <tr>
              <th className="py-2 px-3 sm:px-4 rounded-l-lg">{t('subsidiaryGrid.colEntity')}</th>
              <th className="py-2 px-2.5 sm:px-3 text-right">{t('subsidiaryGrid.colBalance')}</th>
              <th className="py-2 px-2.5 sm:px-3 text-right">{t('subsidiaryGrid.colContribution')}</th>
              <th className="py-2 px-2.5 sm:px-3 text-center">{t('subsidiaryGrid.colProcesses')}</th>
              <th className="py-2 px-2.5 sm:px-3">{t('subsidiaryGrid.colQualitativeReason')}</th>
              <th className="py-2 px-3 sm:px-4 text-center rounded-r-lg">{t('subsidiaryGrid.colStatus')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20 text-xs">
            {items.map((row) => {
              const isInScope = row.scopingStatus === 'In-Scope';
              const isQual = row.scopingStatus === 'Qualitative Consideration';

              return (
                <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2 px-3 sm:px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-surface-container-high text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {row.code.substring(0, 3)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-primary truncate max-w-[260px]">
                          {row.name}
                        </span>
                        <span className="text-muted-foreground text-xs">{row.segmentType}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-2 px-2.5 sm:px-3 text-right font-mono font-semibold text-primary">
                    {formatIDR(row.balanceValue)}
                  </td>

                  <td className="py-2 px-2.5 sm:px-3 text-right">
                    <span className="font-mono font-bold text-primary">
                      {row.percentageContribution.toFixed(1)}%
                    </span>
                  </td>

                  <td className="py-2 px-2.5 sm:px-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-primary font-bold">
                      <Layers className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      {row.processCount}
                    </span>
                  </td>

                  <td className="py-2 px-2.5 sm:px-3 max-w-xs">
                    <p className="text-xs text-muted-foreground truncate" title={row.qualitativeReason}>
                      {row.qualitativeReason || '-'}
                    </p>
                  </td>

                  <td className="py-2 px-3 sm:px-4 text-center">
                    {isInScope && (
                      <Badge className="bg-secondary-container text-on-secondary-container font-bold text-xs uppercase px-2 py-0.5 border-none">
                        <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                        IN-SCOPE
                      </Badge>
                    )}
                    {isQual && (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase px-2 py-0.5 border-amber-300">
                        <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                        KUALITATIF
                      </Badge>
                    )}
                    {!isInScope && !isQual && (
                      <Badge variant="outline" className="text-muted-foreground font-semibold text-xs uppercase px-2 py-0.5">
                        <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                        OUT-SCOPE
                      </Badge>
                    )}
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
