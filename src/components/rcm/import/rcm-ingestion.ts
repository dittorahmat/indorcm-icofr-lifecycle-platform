import { parseRCMSpreadsheet } from './rcm-spreadsheet-parser';
import { reconcileRcmWithBpmNodes } from './rcm-reconciliation-matcher';
import type { BPMNodeOption, RCMFlavor, RCMImportParsedRow } from './rcm-import-types';

export interface RCMMatchStats {
  matched: number;
  suggested: number;
  unmatched: number;
}

export interface RCMIngestionResult {
  rows: RCMImportParsedRow[];
  errors: string[];
  /** Match outcome counts over the staged rows. */
  matchStats: RCMMatchStats;
  /** Rows failing flavor validation. */
  invalidRowCount: number;
  /** True when there is anything to validate or commit. */
  canProceed: boolean;
}

export interface RCMImportPayload {
  rcmType: RCMFlavor;
  year: string;
  bpmProcessId?: string;
  diagramId?: string;
  rows: RCMImportParsedRow[];
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
  if (rows.length === 0) {
    return {
      rows,
      errors,
      matchStats: { matched: 0, suggested: 0, unmatched: 0 },
      invalidRowCount: 0,
      canProceed: false,
    };
  }
  const reconciled = reconcileRcmWithBpmNodes(rows, bpmNodes);
  const matchStats: RCMMatchStats = { matched: 0, suggested: 0, unmatched: 0 };
  let invalidRowCount = 0;
  for (const row of reconciled) {
    if (row.matchStatus === 'matched') matchStats.matched += 1;
    else if (row.matchStatus === 'suggested') matchStats.suggested += 1;
    else matchStats.unmatched += 1;
    if (row.isValid === false) invalidRowCount += 1;
  }
  return { rows: reconciled, errors, matchStats, invalidRowCount, canProceed: true };
}

/** Step-3 gate: only TLC rows reconcile against BPM nodes. */
export function requiresBpmReconciliation(flavor: RCMFlavor): boolean {
  return flavor === 'TLC';
}

/**
 * Manual link transition. The matcher owns the initial status; user
 * re-allocation in the reconciliation step forwards through this helper
 * so the status derivation lives in one place.
 */
export function linkRowToNode(
  rows: RCMImportParsedRow[],
  rowId: string,
  targetNodeId?: string,
): RCMImportParsedRow[] {
  return rows.map((r) =>
    r.id === rowId
      ? {
          ...r,
          targetBpmNodeId: targetNodeId,
          matchStatus: targetNodeId ? ('matched' as const) : ('unmatched' as const),
        }
      : r,
  );
}

/** Commit body shape for POST /api/rcm/import. */
export function buildRcmImportPayload(input: {
  flavor: RCMFlavor;
  workingYear: string;
  bpmProcessId?: string;
  diagramId?: string;
  rows: RCMImportParsedRow[];
}): RCMImportPayload {
  return {
    rcmType: input.flavor,
    year: input.workingYear,
    bpmProcessId: input.bpmProcessId,
    diagramId: input.diagramId,
    rows: input.rows,
  };
}
