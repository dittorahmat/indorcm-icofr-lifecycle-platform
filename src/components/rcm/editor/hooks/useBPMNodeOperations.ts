import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Node, Edge } from 'reactflow';
import { getStandardNodeDimensions, DEFAULT_SWIMLANE_DIMENSIONS } from '@/utils/bpm-constants';

interface UseBPMNodeOperationsProps {
  isLocked: boolean;
  setNodes: Dispatch<SetStateAction<Node[]>>;
  edges: Edge[];
  setDirty: (dirty: boolean) => void;
  pushState: (nodes: Node[], edges: Edge[]) => void;
  t: (key: string, options?: any) => string;
}

export function useBPMNodeOperations({
  isLocked,
  setNodes,
  edges,
  setDirty,
  pushState,
  t,
}: UseBPMNodeOperationsProps) {
  const toggleNodeLock = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const nextLocked = !node.data?.isLocked;
            return {
              ...node,
              draggable: !isLocked && !nextLocked,
              data: {
                ...node.data,
                isLocked: nextLocked,
              },
            };
          }
          return node;
        })
      );
      setDirty(true);
    },
    [setNodes, setDirty, isLocked]
  );

  const updateNodeData = useCallback(
    (nodeId: string, partialData: any) => {
      setNodes((nds) => {
        const updatedNodes = nds.map((node) => {
          if (node.id === nodeId) {
            const isLockedNode =
              partialData.isLocked !== undefined ? partialData.isLocked : !!node.data?.isLocked;
            return {
              ...node,
              draggable: !isLocked && !isLockedNode,
              data: { ...node.data, ...partialData },
            };
          }
          return node;
        });

        const targetNode = updatedNodes.find((n) => n.id === nodeId);
        if (!targetNode || targetNode.type === 'swimlane') return updatedNodes;

        // Sync badges if needed
        const pairs =
          targetNode.data.regulatoryPairs ||
          (targetNode.data.regulatoryData ? [targetNode.data.regulatoryData] : []);
        const riskIds = Array.from(new Set(pairs.map((p: any) => p.riskId).filter(Boolean)));
        const controlIds = Array.from(new Set(pairs.map((p: any) => p.controlId).filter(Boolean)));

        const badgeId = `badge_${nodeId}`;
        let finalNodes = [...updatedNodes];

        if (riskIds.length > 0 || controlIds.length > 0) {
          const existingBadgeIdx = finalNodes.findIndex((n) => n.id === badgeId);
          const badgeData = { riskIds, controlIds, label: 'RCM' };
          if (existingBadgeIdx > -1) {
            finalNodes[existingBadgeIdx] = { ...finalNodes[existingBadgeIdx], data: badgeData };
          } else {
            finalNodes.push({
              id: badgeId,
              type: 'risk-control-badge',
              parentId: nodeId,
              extent: 'parent',
              draggable: false,
              position: { x: targetNode.type === 'decision' ? 85 : 140, y: -10 },
              data: badgeData,
            });
          }
        } else {
          finalNodes = finalNodes.filter((n) => n.id !== badgeId);
        }

        return finalNodes;
      });
    },
    [setNodes, isLocked]
  );

  const handleSwimlaneResizeEnd = useCallback(
    (laneId: string, params: any) => {
      setNodes((nds) => {
        const next = nds.map((n) =>
          n.id === laneId
            ? {
                ...n,
                style: { ...n.style, width: params.width, height: params.height },
                width: params.width,
                height: params.height,
              }
            : n
        );
        pushState(next, edges);
        setDirty(true);
        return next;
      });
    },
    [edges, pushState, setDirty, setNodes]
  );

  const createActivityNode = useCallback(
    (type: string) => {
      const id = `node_${Date.now()}`;
      const dims = getStandardNodeDimensions(type);
      setNodes((nds) => [
        ...nds,
        {
          id,
          type,
          position: { x: 100, y: 100 },
          width: dims.width,
          height: dims.height,
          draggable: !isLocked,
          zIndex: 10,
          data: {
            label: t(`bpm:editor.nodes.${type.replace('-', '')}` as any) || type,
            role: t('bpm:editor.roles.default'),
            regulatoryPairs: [],
            isLocked: false,
            onToggleLock: () => toggleNodeLock(id),
          },
        },
      ]);
    },
    [setNodes, t, isLocked, toggleNodeLock]
  );

  const createStartNode = useCallback(() => {
    const id = `start_${Date.now()}`;
    const dims = getStandardNodeDimensions('start');
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'start',
        position: { x: 250, y: 0 },
        width: dims.width,
        height: dims.height,
        data: { label: t('bpm:editor.nodes.start'), type: 'start' },
      },
    ]);
  }, [setNodes, t]);

  const createEndNode = useCallback(() => {
    const id = `end_${Date.now()}`;
    const dims = getStandardNodeDimensions('end');
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'end',
        position: { x: 250, y: 500 },
        width: dims.width,
        height: dims.height,
        data: { label: t('bpm:editor.nodes.end'), type: 'end' },
      },
    ]);
  }, [setNodes, t]);

  const createSwimlane = useCallback(() => {
    const id = `lane_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'swimlane',
        position: { x: 0, y: 0 },
        zIndex: -1,
        draggable: !isLocked,
        dragHandle: '.swimlane-drag-handle',
        style: {
          width: DEFAULT_SWIMLANE_DIMENSIONS.defaultWidth,
          height: DEFAULT_SWIMLANE_DIMENSIONS.defaultHeight,
        },
        width: DEFAULT_SWIMLANE_DIMENSIONS.defaultWidth,
        height: DEFAULT_SWIMLANE_DIMENSIONS.defaultHeight,
        data: {
          label: t('bpm:editor.swimlane.defaults.lane'),
          department: t('bpm:editor.swimlane.defaults.dept'),
          function: t('bpm:editor.swimlane.defaults.func'),
          isLocked: false,
          onToggleLock: () => toggleNodeLock(id),
          onChangeDepartment: (v: string) => updateNodeData(id, { department: v }),
          onChangeFunction: (v: string) => updateNodeData(id, { function: v }),
        },
      },
    ]);
  }, [setNodes, t, isLocked, toggleNodeLock, updateNodeData]);

  return {
    toggleNodeLock,
    updateNodeData,
    handleSwimlaneResizeEnd,
    createActivityNode,
    createStartNode,
    createEndNode,
    createSwimlane,
  };
}
