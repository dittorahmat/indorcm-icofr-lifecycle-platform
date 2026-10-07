import type { Node, Edge } from 'reactflow';
import type { BPMDiagramSheet, BPMDiagramMetadata, BPMNode, BPMEdge } from '../../../../../shared/types/rcm-bpm';

export interface NormalizedDiagramSheetsResult {
  isMultiSheet: boolean;
  sheets: BPMDiagramSheet[];
  activeSheetId: string;
}

/**
 * Normalizes diagram data to guarantee a valid multi-sheet structure.
 * Supports legacy single-canvas fallback if `metadata.sheets` is absent or empty.
 */
export function normalizeDiagramSheets(
  diagramNodes?: BPMNode[] | Node[] | null,
  diagramEdges?: BPMEdge[] | Edge[] | null,
  metadata?: BPMDiagramMetadata | null,
  defaultSheetName = 'Sheet 1'
): NormalizedDiagramSheetsResult {
  const existingSheets = metadata?.sheets;

  if (Array.isArray(existingSheets) && existingSheets.length > 0) {
    const sorted = [...existingSheets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const activeSheetId =
      metadata?.activeSheetId && sorted.some((s) => s.id === metadata.activeSheetId)
        ? metadata.activeSheetId
        : sorted[0].id;

    return {
      isMultiSheet: true,
      sheets: sorted,
      activeSheetId,
    };
  }

  // Fallback for legacy single-canvas diagrams
  const singleSheet: BPMDiagramSheet = {
    id: 'sheet-default',
    name: defaultSheetName,
    order: 0,
    nodes: (diagramNodes as BPMNode[]) || [],
    edges: (diagramEdges as BPMEdge[]) || [],
  };

  return {
    isMultiSheet: false,
    sheets: [singleSheet],
    activeSheetId: singleSheet.id,
  };
}

/**
 * Updates a specific sheet within the sheet array, immutably.
 */
export function updateSheetInList(
  sheets: BPMDiagramSheet[],
  targetSheetId: string,
  updatedData: Partial<BPMDiagramSheet>
): BPMDiagramSheet[] {
  return sheets.map((s) => (s.id === targetSheetId ? { ...s, ...updatedData } : s));
}

/**
 * Creates a new blank sheet with a default start node.
 */
export function createNewSheet(
  existingSheets: BPMDiagramSheet[],
  name?: string,
  defaultStartNodeLabel = 'Start'
): BPMDiagramSheet {
  const nextOrder = existingSheets.length;
  const sheetNumber = nextOrder + 1;
  const sheetId = `sheet-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: sheetId,
    name: name || `Sheet ${sheetNumber}`,
    order: nextOrder,
    nodes: [
      {
        id: `start-${sheetId}`,
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: defaultStartNodeLabel },
      },
    ],
    edges: [],

  };
}
