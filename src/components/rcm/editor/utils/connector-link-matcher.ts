import type { BPMDiagramSheet } from '@shared/types';

/**
 * Automatically parses "Ke hal X" / "Dari hal Y" patterns on Off-Page reference nodes
 * and links them with the matching target sheet in the provided sheet collection.
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

  // Regex patterns to capture destination page number or sheet name
  // Matches "Ke hal 2", "Ke hal. 2", "Ke halaman 2", "Ke Sheet 2", "To page 2", etc.
  const targetPageRegex = /(?:ke\s*hal(?:aman)?\.?|to\s*page|ke\s*sheet)\s*(\d+)/i;

  return sheets.map((sheet) => {
    const updatedNodes = (sheet.nodes || []).map((node) => {
      if (node.type !== 'off-page-ref') return node;

      const label = node.data?.label || '';
      const match = label.match(targetPageRegex);

      if (match && match[1]) {
        const targetPageNum = parseInt(match[1], 10);
        const targetSheet = sheetIndexMap.get(targetPageNum);

        if (targetSheet && targetSheet.id !== sheet.id) {
          return {
            ...node,
            data: {
              ...node.data,
              targetSheetId: targetSheet.id,
              targetSheetName: targetSheet.name,
              direction: 'out' as const,
            },
          };
        }
      }

      // Check if it's an incoming reference from another page (e.g. "Dari hal 1")
      const incomingRegex = /(?:dari\s*hal(?:aman)?\.?|from\s*page)\s*(\d+)/i;
      const inMatch = label.match(incomingRegex);
      if (inMatch && inMatch[1]) {
        const sourcePageNum = parseInt(inMatch[1], 10);
        const sourceSheet = sheetIndexMap.get(sourcePageNum);

        if (sourceSheet && sourceSheet.id !== sheet.id) {
          return {
            ...node,
            data: {
              ...node.data,
              sourceSheetId: sourceSheet.id,
              sourceSheetName: sourceSheet.name,
              direction: 'in' as const,
            },
          };
        }
      }

      return node;
    });

    return {
      ...sheet,
      nodes: updatedNodes,
    };
  });
}
