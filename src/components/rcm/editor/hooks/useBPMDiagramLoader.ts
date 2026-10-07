import * as React from 'react';
import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';

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

      const initialNodesWithHandlers = (diagram.nodes?.length ? diagram.nodes : localizedInitialNodes).map((node) => {
        const isSwimlane = node.type === 'swimlane';
        const isNodeLocked = !!node.data?.isLocked;

        const baseNode: Node = {
          ...node,
          draggable: !isLocked && !isNodeLocked,
          zIndex: isSwimlane ? -1 : (node.zIndex ?? (node.id.startsWith('badge_') ? 20 : 10)),
          dragHandle: isSwimlane ? '.swimlane-drag-handle' : undefined,
        };

        if (isSwimlane) {
          baseNode.data = {
            ...node.data,
            onToggleLock: () => toggleNodeLock(node.id),
            onChangeDepartment: (v: string) => updateNodeData(node.id, { department: v }),
            onChangeFunction: (v: string) => updateNodeData(node.id, { function: v }),
            onResizeEnd: (params: { width: number; height: number }) => handleSwimlaneResizeEnd(node.id, params),
          };
        } else {
          baseNode.data = {
            ...node.data,
            onToggleLock: () => toggleNodeLock(node.id),
          };
        }
        return baseNode;
      });

      setNodes(initialNodesWithHandlers);
      setEdges(
        (diagram.edges || []).map((edge) => ({
          ...edge,
          type: 'bridge',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#0f172a',
          },
          style: { strokeWidth: 2, stroke: '#0f172a' },
        })),
      );
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
