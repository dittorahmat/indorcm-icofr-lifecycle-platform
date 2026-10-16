import { format } from 'date-fns';
import type { RegulatoryExportColumn } from './rcm-excel-export';

export interface FindingsColumnLabels {
  no: string;
  ref: string;
  description: string;
  control: string;
  severity: string;
  exposure: string;
  identifiedBy: string;
  identifiedDate: string;
  source: string;
  status: string;
}

const FALLBACK = '-';

import type { Control, Deficiency } from '@shared/types';

export type FindingExportRow = Partial<
  Pick<Deficiency, 'id' | 'description' | 'exposureValue' | 'identifiedBy' | 'identifiedDate' | 'controlId'>
> & {
  // Display-level widening: report rows and fixtures carry plain strings
  // where the domain type uses literal unions.
  severity?: string;
  status?: string;
  source?: string | null;
  controlCode?: string | null;
  controlName?: string | null;
};

export type FindingControlRef = Partial<Pick<Control, 'id' | 'code' | 'name'>>;

export function findingsColumns(labels: FindingsColumnLabels): RegulatoryExportColumn[] {
  return [
    { key: 'no', header: labels.no, numeric: true },
    { key: 'ref', header: labels.ref },
    { key: 'description', header: labels.description },
    { key: 'control', header: labels.control },
    { key: 'severity', header: labels.severity },
    { key: 'exposure', header: labels.exposure, numeric: true },
    { key: 'identifiedBy', header: labels.identifiedBy },
    { key: 'identifiedDate', header: labels.identifiedDate },
    { key: 'source', header: labels.source },
    { key: 'status', header: labels.status },
  ];
}

export function findingRowId(d: FindingExportRow, index: number): string {
  return d.id || `DEF-${String(index + 1).padStart(3, '0')}`;
}

export function mapFindingsRows(
  deficiencies: FindingExportRow[],
  resolveControlName: (d: FindingExportRow) => string,
): Record<string, unknown>[] {
  return deficiencies.map((d, index) => ({
    no: index + 1,
    ref: findingRowId(d, index),
    description: d.description || FALLBACK,
    control: resolveControlName(d) || FALLBACK,
    severity: d.severity || FALLBACK,
    exposure: typeof d.exposureValue === 'number' ? d.exposureValue : FALLBACK,
    identifiedBy: d.identifiedBy || FALLBACK,
    identifiedDate: d.identifiedDate ? format(d.identifiedDate, 'yyyy-MM-dd') : FALLBACK,
    source: d.source || FALLBACK,
    status: d.status || FALLBACK,
  }));
}

export function resolveFindingControlName(
  d: FindingExportRow,
  controls: Array<FindingControlRef>,
): string {
  const match = controls.find((c) => (d.controlId && c.id === d.controlId) || (d.controlCode && c.code === d.controlCode));
  if (match) return `${match.code || match.id || ''} - ${match.name || ''}`.trim().replace(/^- /, '');
  return d.controlName || d.controlCode || FALLBACK;
}

export function findingsFilename(year: string | number): string {
  return `Lampiran_9_Daftar_Temuan_${year}.xlsx`;
}
