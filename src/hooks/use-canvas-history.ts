// src/hooks/use-canvas-history.ts
import { useState, useCallback, useRef } from 'react';
import type { Node, Edge } from 'reactflow';

export interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface UseCanvasHistoryOptions {
  maxHistory?: number;
}

export function useCanvasHistory(
  initialNodes: Node[] = [],
  initialEdges: Edge[] = [],
  options: UseCanvasHistoryOptions = {}
) {
  const maxHistory = options.maxHistory ?? 30;

  // Past states for undo
  const [past, setPast] = useState<CanvasSnapshot[]>([]);
  // Future states for redo
  const [future, setFuture] = useState<CanvasSnapshot[]>([]);

  // Ref tracking current snapshot to avoid race conditions
  const currentSnapshotRef = useRef<CanvasSnapshot>({
    nodes: initialNodes,
    edges: initialEdges,
  });

  // Push new snapshot to past history
  const pushState = useCallback((nodes: Node[], edges: Edge[]) => {
    // Deep clone to prevent direct mutative modifications affecting history
    const clonedSnapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    setPast((prevPast) => {
      const updated = [...prevPast, currentSnapshotRef.current];
      if (updated.length > maxHistory) {
        return updated.slice(updated.length - maxHistory);
      }
      return updated;
    });

    currentSnapshotRef.current = clonedSnapshot;
    setFuture([]); // clear redo stack on new action
  }, [maxHistory]);

  // Undo action: restore last snapshot from past
  const undo = useCallback((
    currentNodes: Node[],
    currentEdges: Edge[],
    setNodes: (nds: Node[]) => void,
    setEdges: (eds: Edge[]) => void
  ): boolean => {
    if (past.length === 0) return false;

    const previousSnapshot = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    const currentSnapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
    };

    setFuture((prevFuture) => [currentSnapshot, ...prevFuture]);
    setPast(newPast);

    currentSnapshotRef.current = previousSnapshot;
    setNodes(previousSnapshot.nodes);
    setEdges(previousSnapshot.edges);
    return true;
  }, [past]);

  // Redo action: restore first snapshot from future
  const redo = useCallback((
    currentNodes: Node[],
    currentEdges: Edge[],
    setNodes: (nds: Node[]) => void,
    setEdges: (eds: Edge[]) => void
  ): boolean => {
    if (future.length === 0) return false;

    const nextSnapshot = future[0];
    const newFuture = future.slice(1);

    const currentSnapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
    };

    setPast((prevPast) => [...prevPast, currentSnapshot]);
    setFuture(newFuture);

    currentSnapshotRef.current = nextSnapshot;
    setNodes(nextSnapshot.nodes);
    setEdges(nextSnapshot.edges);
    return true;
  }, [future]);

  const resetHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    currentSnapshotRef.current = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    setPast([]);
    setFuture([]);
  }, []);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undoCount: past.length,
    redoCount: future.length,
    pushState,
    undo,
    redo,
    resetHistory,
  };
}
