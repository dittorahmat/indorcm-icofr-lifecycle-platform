import { parseRCMSpreadsheet } from './rcm-spreadsheet-parser';
import { reconcileRcmWithBpmNodes } from './rcm-reconciliation-matcher';
import type { BPMNodeOption, RCMFlavor, RCMImportParsedRow } from './rcm-import-types';

export interface RCMIngestionResult {
  rows: RCMImportParsedRow[];
  errors: string[];
}

/**
 * rcm-ingestion — single Auto-Reconciliation seam (SK-5 Lampiran 5).
 *
 * One interface owns spreadsheet parse, flavor validation, and BPM
 * node reconciliation. Both entry points (BPM toolbar contextual import
 * and TLC page bulk import) cross this seam; the wizard hook and step
 * views are adapters over its output.
 */
export function importRcmFileText(
  fileText: string,
  flavor: RCMFlavor,
  bpmNodes: BPMNodeOption[],
): RCMIngestionResult {
  const { rows, errors } = parseRCMSpreadsheet(fileText, flavor);
  if (rows.length === 0) return { rows, errors };
  return { rows: reconcileRcmWithBpmNodes(rows, bpmNodes), errors };
}
