import { format } from 'date-fns';
import type { Deficiency } from '@shared/types';
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

export function mapFindingsRows(
  deficiencies: Deficiency[],
  resolveControlName: (d: Deficiency) => string,
): Record<string, unknown>[] {
  return deficiencies.map((d, index) => ({
    no: index + 1,
    ref: d.id || `DEF-${String(index + 1).padStart(3, '0')}`,
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
  d: Deficiency,
  controls: Array<{ id?: string; code?: string; name?: string }>,
): string {
  const match = controls.find((c) => (d.controlId && c.id === d.controlId) || (d.controlCode && c.code === d.controlCode));
  if (match) return `${match.code || match.id || ''} - ${match.name || ''}`.trim().replace(/^- /, '');
  return d.controlName || d.controlCode || FALLBACK;
}

export function findingsFilename(year: string | number): string {
  return `Lampiran_9_Daftar_Temuan_${year}.xlsx`;
}
