import * as React from 'react';
import type { Edge, Node } from 'reactflow';
import { canvasNodeChrome, canvasNodeHandlers, hydrateCanvasEdges } from '../canvas-hydration';

interface DiagramLike {
  nodes?: Node[];
  edges?: Edge[];
  updatedAt?: number | string | null;
  createdAt?: number | string | null;
}

interface UseBPMDiagramLoaderParams {
  diagram: DiagramLike | null | undefined;
  diagramId: string;
  currentGL?: string;
  isLocked: boolean;
  localizedInitialNodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  toggleNodeLock: (id: string) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  handleSwimlaneResizeEnd: (id: string, params: { width: number; height: number }) => void;
}

export function useBPMDiagramLoader({
  diagram,
  diagramId,
  currentGL,
  isLocked,
  localizedInitialNodes,
  setNodes,
  setEdges,
  toggleNodeLock,
  updateNodeData,
  handleSwimlaneResizeEnd,
}: UseBPMDiagramLoaderParams) {
  const hasLoadedDiagramRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (diagram) {
      const diagramKey = `${diagramId}-${currentGL || ''}-${diagram.updatedAt || diagram.createdAt || 'initial'}`;
      if (hasLoadedDiagramRef.current === diagramKey) {
        return;
      }
      hasLoadedDiagramRef.current = diagramKey;

      const hydrationDeps = { isLocked, toggleNodeLock, updateNodeData, handleSwimlaneResizeEnd };

      const initialNodesWithHandlers = (diagram.nodes?.length ? diagram.nodes : localizedInitialNodes).map((node) => ({
        ...node,
        ...canvasNodeChrome(node, isLocked),
        data: { ...node.data, ...canvasNodeHandlers(node, hydrationDeps) },
      }));

      setNodes(initialNodesWithHandlers);
      setEdges(hydrateCanvasEdges(diagram.edges || []));
    }
  }, [
    diagram,
    diagramId,
    currentGL,
    setNodes,
    setEdges,
    localizedInitialNodes,
    updateNodeData,
    toggleNodeLock,
    handleSwimlaneResizeEnd,
    isLocked,
  ]);
}
