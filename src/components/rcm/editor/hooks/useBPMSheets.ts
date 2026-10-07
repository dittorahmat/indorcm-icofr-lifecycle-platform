import * as React from 'react';
import type { Node, Edge } from 'reactflow';
import type { BPMDiagramSheet } from '../../../../../shared/types/rcm-bpm';
import {
  normalizeDiagramSheets,
  updateSheetInList,
  createNewSheet,
} from '../utils/diagram-sheet-adapter';

interface UseBPMSheetsParams {
  diagram: any;
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  defaultStartNodeLabel?: string;
  defaultSheetLabel?: string;
}

export function useBPMSheets({
  diagram,
  nodes,
  edges,
  setNodes,
  setEdges,
  defaultStartNodeLabel = 'Start',
  defaultSheetLabel = 'Sheet 1',
}: UseBPMSheetsParams) {
  const [sheets, setSheets] = React.useState<BPMDiagramSheet[]>([]);
  const [activeSheetId, setActiveSheetId] = React.useState<string>('sheet-default');
  const [isMultiSheet, setIsMultiSheet] = React.useState<boolean>(false);
  const loadedRef = React.useRef<string | null>(null);

  // Initialize sheets when diagram data arrives
  React.useEffect(() => {
    if (!diagram) return;
    const diagramKey = `${diagram.id}-${diagram.updatedAt || diagram.createdAt || 'initial'}`;
    if (loadedRef.current === diagramKey) return;
    loadedRef.current = diagramKey;

    const normalized = normalizeDiagramSheets(
      diagram.nodes,
      diagram.edges,
      diagram.metadata,
      defaultSheetLabel
    );

    setSheets(normalized.sheets);
    setActiveSheetId(normalized.activeSheetId);
    setIsMultiSheet(normalized.isMultiSheet);
  }, [diagram, defaultSheetLabel]);

  // Keep the active sheet's node and edge arrays synchronized in memory
  const syncCurrentCanvasToSheet = React.useCallback(() => {
    setSheets((prevSheets) =>
      updateSheetInList(prevSheets, activeSheetId, {
        nodes: nodes as any,
        edges: edges as any,
      })
    );
  }, [activeSheetId, nodes, edges]);

  // Switch to another sheet with state preservation
  const switchSheet = React.useCallback(
    (targetSheetId: string, targetNodeId?: string) => {
      if (targetSheetId === activeSheetId) return;

      // 1. Save current canvas nodes/edges into current sheet
      const currentSnapshot = sheets.map((s) =>
        s.id === activeSheetId ? { ...s, nodes: nodes as any, edges: edges as any } : s
      );

      // 2. Find target sheet
      const targetSheet = currentSnapshot.find((s) => s.id === targetSheetId);
      if (!targetSheet) return;

      setSheets(currentSnapshot);
      setActiveSheetId(targetSheetId);
      setNodes((targetSheet.nodes as Node[]) || []);
      setEdges((targetSheet.edges as Edge[]) || []);

      return targetNodeId;
    },
    [activeSheetId, sheets, nodes, edges, setNodes, setEdges]
  );

  // Add a new sheet
  const addSheet = React.useCallback(
    (sheetName?: string) => {
      // 1. Save current sheet first
      const currentSnapshot = sheets.map((s) =>
        s.id === activeSheetId ? { ...s, nodes: nodes as any, edges: edges as any } : s
      );

      // 2. Create new sheet
      const newSheet = createNewSheet(currentSnapshot, sheetName, defaultStartNodeLabel);
      const nextSheets = [...currentSnapshot, newSheet];

      setSheets(nextSheets);
      setIsMultiSheet(true);
      setActiveSheetId(newSheet.id);
      setNodes(newSheet.nodes as Node[]);
      setEdges(newSheet.edges as Edge[]);
    },
    [sheets, activeSheetId, nodes, edges, defaultStartNodeLabel, setNodes, setEdges]
  );

  // Rename an existing sheet
  const renameSheet = React.useCallback((sheetId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSheets((prev) => updateSheetInList(prev, sheetId, { name: trimmed }));
  }, []);

  // Remove a sheet
  const removeSheet = React.useCallback(
    (sheetId: string) => {
      if (sheets.length <= 1) return; // Keep at least one sheet
      const filtered = sheets.filter((s) => s.id !== sheetId);
      setSheets(filtered);

      if (activeSheetId === sheetId) {
        const nextActive = filtered[0];
        setActiveSheetId(nextActive.id);
        setNodes((nextActive.nodes as Node[]) || []);
        setEdges((nextActive.edges as Edge[]) || []);
      }
    },
    [sheets, activeSheetId, setNodes, setEdges]
  );

  return {
    sheets,
    setSheets,
    activeSheetId,
    setActiveSheetId,
    isMultiSheet,
    setIsMultiSheet,
    syncCurrentCanvasToSheet,
    switchSheet,
    addSheet,
    renameSheet,
    removeSheet,
  };
}
