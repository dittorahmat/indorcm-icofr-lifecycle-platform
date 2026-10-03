import { format } from 'date-fns';
import type { WBSReport } from '@shared/types';
import type { RegulatoryExportColumn } from './rcm-excel-export';

export interface WbsColumnLabels {
  date: string;
  category: string;
  description: string;
  impact: string;
  status: string;
  controls: string;
}

const FALLBACK = '-';

export function wbsColumns(labels: WbsColumnLabels): RegulatoryExportColumn[] {
  return [
    { key: 'date', header: labels.date },
    { key: 'category', header: labels.category },
    { key: 'description', header: labels.description },
    { key: 'impact', header: labels.impact, numeric: true },
    { key: 'status', header: labels.status },
    { key: 'controls', header: labels.controls },
  ];
}

export function mapWbsRows(reports: WBSReport[]): Record<string, unknown>[] {
  return reports.map((r) => ({
    date: r.reportDate ? format(r.reportDate, 'yyyy-MM-dd') : FALLBACK,
    category: r.category || FALLBACK,
    description: r.description ? `${r.description} [${r.id}]` : FALLBACK,
    impact: typeof r.impactMagnitude === 'number' ? r.impactMagnitude : FALLBACK,
    status: r.status || FALLBACK,
    controls: r.relatedControlIds && r.relatedControlIds.length > 0 ? r.relatedControlIds.join(', ') : FALLBACK,
  }));
}

export function wbsFilename(date: Date = new Date()): string {
  return `WBS_Fraud_Indicators_${format(date, 'yyyyMMdd')}.xlsx`;
}
