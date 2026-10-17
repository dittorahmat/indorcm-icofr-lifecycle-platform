import type { FindingControlRef, FindingExportRow } from '@/lib/findings-excel-export';
import { formatIDRPlain } from '@/components/reports/dod/dod-format';

/** Single-owner re-exports: the canonical findings-presentation seam lives in
 *  `@/lib/findings-excel-export` (shared by the on-screen table and the Excel
 *  path). This module keeps screen-only formatting plus the severity tone map;
 *  exposure money delegates to the IDR owner in `@/components/reports/dod/dod-format`. */
export {
  findingRowId,
  findingsColumns,
  findingsFilename,
  mapFindingsRows,
  resolveFindingControlName,
} from '@/lib/findings-excel-export';

export function formatExposureValue(exposureValue: unknown): string {
  return typeof exposureValue === 'number' ? formatIDRPlain(exposureValue) : '-';
}

export type FindingSeverityTone = 'mw' | 'sd' | 'cd';

export function findingSeverityTone(severity: string | undefined): FindingSeverityTone {
  if (severity === 'Material Weakness') return 'mw';
  if (severity === 'Significant Deficiency') return 'sd';
  return 'cd';
}

export type { FindingControlRef, FindingExportRow };
