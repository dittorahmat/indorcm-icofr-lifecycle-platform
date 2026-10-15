import type { FindingControlRef, FindingExportRow } from '@/lib/findings-excel-export';

export function findingRowId(d: FindingExportRow, index: number): string {
  return d.id || `DEF-${String(index + 1).padStart(3, '0')}`;
}

export function resolveFindingControlName(d: FindingExportRow, controls: readonly FindingControlRef[]): string {
  const match = controls.find((c) => (d.controlId && c.id === d.controlId) || (d.controlCode && c.code === d.controlCode));
  if (match) return `${match.code || ''} - ${match.name || ''}`;
  return d.controlName || d.controlCode || '-';
}

export function formatExposureValue(exposureValue: unknown): string {
  return typeof exposureValue === 'number' ? new Intl.NumberFormat('id-ID').format(exposureValue) : '-';
}

export type FindingSeverityTone = 'mw' | 'sd' | 'cd';

export function findingSeverityTone(severity: string | undefined): FindingSeverityTone {
  if (severity === 'Material Weakness') return 'mw';
  if (severity === 'Significant Deficiency') return 'sd';
  return 'cd';
}
