import { useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Node, Edge } from 'reactflow';
import { getAlignmentGuides } from '@/utils/alignment-guides';

interface UseBPMCanvasDragGuidesProps {
  isLocked: boolean;
  nodes: Node[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  edges: Edge[];
  pushState: (nodes: Node[], edges: Edge[]) => void;
  setDirty: (dirty: boolean) => void;
}

export function useBPMCanvasDragGuides({
  isLocked,
  nodes,
  setNodes,
  edges,
  pushState,
  setDirty,
}: UseBPMCanvasDragGuidesProps) {
  const [alignmentLines, setAlignmentLines] = useState<{ horizontal?: number; vertical?: number }>({});

  const handleNodeDrag = useCallback(
    (_: any, node: any) => {
      if (isLocked || node.type === 'swimlane') return;
      const nodeW = node.width || 160;
      const nodeH = node.height || 56;
      const draggedRect = {
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        width: nodeW,
        height: nodeH,
      };

      const otherRects = nodes
        .filter((n) => n.id !== node.id && n.type !== 'swimlane' && n.type !== 'risk-control-badge')
        .map((n) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
          width: n.width || 160,
          height: n.height || 56,
        }));

      const { guides, snappedX, snappedY } = getAlignmentGuides(draggedRect, otherRects);
      setAlignmentLines(guides);

      if (guides.horizontal !== undefined || guides.vertical !== undefined) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  position: {
                    x: guides.vertical !== undefined ? snappedX : n.position.x,
                    y: guides.horizontal !== undefined ? snappedY : n.position.y,
                  },
                }
              : n
          )
        );
      }
    },
    [isLocked, nodes, setNodes]
  );

  const handleNodeDragStop = useCallback(() => {
    setAlignmentLines({});
    pushState(nodes, edges);
    setDirty(true);
  }, [nodes, edges, pushState, setDirty]);

  return {
    alignmentLines,
    handleNodeDrag,
    handleNodeDragStop,
  };
}
