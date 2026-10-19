import type { FindingControlRef, FindingExportRow } from '@/lib/findings-excel-export';
import { formatIDRPlain } from '@/components/reports/dod/dod-format';

/** Single-owner re-exports: the canonical findings-presentation seam lives in
 *  `@/lib/findings-excel-export` (shared by the on-screen table and the Excel
 *  path). This module keeps screen-only formatting; exposure money delegates to
 *  the IDR owner in `@/components/reports/dod/dod-format`, and severity tone to
 *  `@/lib/badge-tone`. */
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

export type { FindingControlRef, FindingExportRow };
