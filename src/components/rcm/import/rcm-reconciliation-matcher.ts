import { matchesStepRef } from '../editor/utils/step-ref-utils';
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
    // 1. Direct Ref match (e.g., bpmNodeRef = '1.2' matches node with stepRef '1.2', label '1.2', or id '1.2')
    if (row.bpmNodeRef) {
      const cleanRef = row.bpmNodeRef.trim();
      const exactMatch = bpmNodes.find(
        (n) => matchesStepRef(n.stepRef, n.label, cleanRef) || n.id.toLowerCase() === cleanRef.toLowerCase()
      );

      if (exactMatch) {
        // If user explicitly provided bpmNodeName, verify semantic concordance with node label
        if (row.bpmNodeName) {
          const nodeTokens = exactMatch.label
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 2);
          const providedTokens = row.bpmNodeName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 2);

          const sharedTokens = providedTokens.filter((t) => nodeTokens.includes(t));
          // Contradiction happens when provided name has meaningful tokens but 0 match with node label
          const hasSemanticConflict = providedTokens.length > 0 && sharedTokens.length === 0;

          // If there is an evident semantic mismatch between provided step name and node label,
          // demote to suggested so auditor can visually confirm in Step 3
          if (hasSemanticConflict) {
            return {
              ...row,
              matchStatus: 'suggested',
              targetBpmNodeId: exactMatch.id,
            };
          }
        }

        return {
          ...row,
          matchStatus: 'matched',
          targetBpmNodeId: exactMatch.id,
        };
      }
    }

    // 2. Fuzzy / Semantic token matching between control/step name and node labels
    const textCorpus = `${row.bpmNodeName || ''} ${row.controlName} ${row.controlDescription || ''}`;
    const rowTokens = textCorpus
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
