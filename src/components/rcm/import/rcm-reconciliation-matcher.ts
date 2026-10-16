import type { BPMNodeOption, RCMImportParsedRow } from './rcm-import-types';

/**
 * Token-overlap thresholds for Auto-Reconciliation (SK-5 Lampiran 5).
 *
 * Scores are the fraction of a BPM node label's significant tokens (>2 chars)
 * also present in the RCM row's control name + description.
 */
export const RCM_MATCH_SUGGEST_THRESHOLD = 0.25;
export const RCM_MATCH_AUTO_THRESHOLD = 0.6;

export function reconcileRcmWithBpmNodes(
  rows: RCMImportParsedRow[],
  bpmNodes: BPMNodeOption[]
): RCMImportParsedRow[] {
  if (!bpmNodes || bpmNodes.length === 0) {
    return rows.map((r) => ({
      ...r,
      matchStatus: 'unmatched',
      targetBpmNodeId: undefined,
    }));
  }

  return rows.map((row) => {
    // 1. Direct Ref match (e.g., bpmNodeRef = '1.2' matches node with label '1.2' or id '1.2')
    if (row.bpmNodeRef) {
      const cleanRef = row.bpmNodeRef.trim().toLowerCase();
      const exactMatch = bpmNodes.find(
        (n) =>
          n.id.toLowerCase() === cleanRef ||
          n.label.toLowerCase().startsWith(cleanRef) ||
          n.label.toLowerCase().includes(`(${cleanRef})`) ||
          n.label.toLowerCase().includes(`[${cleanRef}]`)
      );

      if (exactMatch) {
        return {
          ...row,
          matchStatus: 'matched',
          targetBpmNodeId: exactMatch.id,
        };
      }
    }

    // 2. Fuzzy / Semantic token matching between control name and node labels
    const rowTokens = `${row.controlName} ${row.controlDescription || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let bestScore = 0;
    let candidateNodeId: string | undefined;

    for (const node of bpmNodes) {
      const nodeTokens = node.label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);

      let matchedNodeTokens = 0;
      for (const nToken of nodeTokens) {
        if (rowTokens.includes(nToken)) {
          matchedNodeTokens++;
        }
      }

      // Overlap ratio relative to node label size
      const score = nodeTokens.length > 0 ? matchedNodeTokens / nodeTokens.length : 0;
      if (score > bestScore) {
        bestScore = score;
        candidateNodeId = node.id;
      }
    }

    if (bestScore >= RCM_MATCH_SUGGEST_THRESHOLD && candidateNodeId) {
      return {
        ...row,
        matchStatus: bestScore >= RCM_MATCH_AUTO_THRESHOLD ? 'matched' : 'suggested',
        targetBpmNodeId: candidateNodeId,
      };
    }

    return {
      ...row,
      matchStatus: 'unmatched',
      targetBpmNodeId: undefined,
    };
  });
}
