import type { BPMDiagramSheet } from '@shared/types';
import { resolveOffPageLink } from '../ocr/ocr-offpage-pairing';

/**
 * Automatically parses "Ke hal X" / "Dari hal Y" patterns on Off-Page reference nodes
 * and links them with the matching target sheet in the provided sheet collection.
 * Regex locality lives in ocr/ocr-offpage-pairing; this stays as the legacy entry point.
 */
export function pairOffPageConnectors(sheets: BPMDiagramSheet[]): BPMDiagramSheet[] {
  if (!Array.isArray(sheets) || sheets.length <= 1) {
    return sheets;
  }

  // Map sheet 1-based index and sheet names to sheet identifiers
  const sheetIndexMap = new Map<number, BPMDiagramSheet>();
  sheets.forEach((s, idx) => {
    sheetIndexMap.set(idx + 1, s);
  });

  return sheets.map((sheet) => {
    const updatedNodes = (sheet.nodes || []).map((node) => {
      if (node.type !== 'off-page-ref') return node;

      const link = resolveOffPageLink(node.data?.label, sheet.id, (page) => sheetIndexMap.get(page));
      if (!link) return node;

      return {
        ...node,
        data: {
          ...node.data,
          ...link,
        },
      };
    });

    return {
      ...sheet,
      nodes: updatedNodes,
    };
  });
}
