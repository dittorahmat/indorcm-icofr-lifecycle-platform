import { useCallback } from 'react';
import { useEdgesState, useNodesState, type Edge, type Node } from 'reactflow';
import { useCanvasHistory } from '@/hooks/use-canvas-history';

interface UseBPMDiagramParams {
  maxHistory?: number;
}

/**
 * useBPMDiagram — single diagram-ownership seam for the BPM editor
 * (SK-5/DKU.MBU/11/2024 Lampiran 3).
 *
 * One interface owns nodes, edges, history (push/undo/redo), and loading.
 * Canvas handlers, selection, sheets, persistence, and the loader are
 * adapters over its output: BPMEditor creates this module once instead of
 * threading nodes/setNodes/edges/setEdges/history bindings into every hook.
 * View (fullscreen/fit), selection (edit-intent protocol), signatures, and
 * the save payload stay in their adapters — deletion-tested, each earns
 * its keep. Headless-testable: no canvas mount required.
 */
export function useBPMDiagram({ maxHistory = 30 }: UseBPMDiagramParams = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { canUndo, canRedo, pushState, undo, redo, resetHistory } = useCanvasHistory([], [], {
    maxHistory,
  });

  const undoDiagram = useCallback(() => {
    undo(nodes, edges, setNodes, setEdges);
  }, [undo, nodes, edges, setNodes, setEdges]);

  const redoDiagram = useCallback(() => {
    redo(nodes, edges, setNodes, setEdges);
  }, [redo, nodes, edges, setNodes, setEdges]);

  const loadDiagram = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      setNodes(nextNodes);
      setEdges(nextEdges);
      resetHistory(nextNodes, nextEdges);
    },
    [setNodes, setEdges, resetHistory],
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    pushState,
    canUndo,
    canRedo,
    undoDiagram,
    redoDiagram,
    loadDiagram,
  };
}

export type BPMDiagramApi = ReturnType<typeof useBPMDiagram>;
