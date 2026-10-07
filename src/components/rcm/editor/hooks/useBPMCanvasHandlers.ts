import { useCallback } from 'react';
import type { Dispatch, SetStateAction, DragEvent } from 'react';
import type { Node, Edge } from 'reactflow';
import { toast } from 'sonner';
import { MarkerType } from 'reactflow';
import { deriveLabelFromId } from '@/utils/ocr-layout';
import { getStandardNodeDimensions } from '@/utils/bpm-constants';
import { calculateAppendOffset, remapElementsForAppend } from '@/utils/bpm-ocr-append';
import type { OcrAppendDirection, OcrImportMode } from '../ocr/ocr-types';

interface UseBPMCanvasHandlersProps {
  isLocked: boolean;
  rfInstance: any;
  nodes: Node[];
  edges: Edge[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  pushState: (nodes: Node[], edges: Edge[]) => void;
  setDirty: (dirty: boolean) => void;
  toggleNodeLock: (id: string) => void;
  updateNodeData: (id: string, partial: any) => void;
  handleSwimlaneResizeEnd: (laneId: string, params: any) => void;
  onImportMultipleSheets?: (sheets: any[]) => void;
  t: (key: string, options?: any) => string;
}


export function useBPMCanvasHandlers({
  isLocked,
  rfInstance,
  nodes,
  edges,
  setNodes,
  setEdges,
  pushState,
  setDirty,
  toggleNodeLock,
  updateNodeData,
  handleSwimlaneResizeEnd,
  onImportMultipleSheets,
  t,
}: UseBPMCanvasHandlersProps) {

  const onNodesDelete = useCallback(
    (deleted: any[]) => {
      if (deleted.length > 0) {
        pushState(nodes, edges);
        setDirty(true);
        toast.info(`Deleted ${deleted.length} node(s)`);
      }
    },
    [nodes, edges, pushState, setDirty]
  );

  const onEdgesDelete = useCallback(
    (deleted: any[]) => {
      if (deleted.length > 0) {
        pushState(nodes, edges);
        setDirty(true);
        toast.info(`Deleted ${deleted.length} connection(s)`);
      }
    },
    [nodes, edges, pushState, setDirty]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type || !rfInstance) {
        return;
      }

      const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = rfInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      try {
        const parsedData = JSON.parse(type);
        const newNodeId = `node_${Date.now()}`;

        const actDims = getStandardNodeDimensions('activity');
        const newNode: Node = {
          id: newNodeId,
          type: 'activity',
          position,
          width: actDims.width,
          height: actDims.height,
          draggable: !isLocked,
          zIndex: 10,
          data: {
            label: parsedData.mappedControlName || parsedData.riskDescription || t('bpm:editor.nodes.activity'),
            role: t('bpm:editor.roles.default'),
            isLocked: false,
            onToggleLock: () => toggleNodeLock(newNodeId),
            regulatoryPairs: [
              {
                riskId: parsedData.rcmId || parsedData.riskId || parsedData.mappingId?.split(':')[0],
                riskDescription: parsedData.riskDescription,
                isFraudRelated: parsedData.isFraudRelated,
                riskRating: parsedData.riskRating,
                controlId: parsedData.controlId,
                controlDescription: parsedData.mappedControlDescription || parsedData.baseControlDescription,
                isKeyControl: parsedData.isKeyControl,
                classification: parsedData.controlType || 'TLC',
                ipoC: parsedData.ipoC,
                ipoA: parsedData.ipoA,
                ipoV: parsedData.ipoV,
                ipoRa: parsedData.ipoRa,
                cosoPrinciples: parsedData.cosoPrinciples,
                itgcDomain: parsedData.itgcDomain,
                itgcAssertions: parsedData.itgcAssertions,
              },
            ],
          },
        };

        setNodes((nds) => {
          const updated = nds.concat(newNode);
          return updated.concat({
            id: `badge_${newNodeId}`,
            type: 'risk-control-badge',
            parentId: newNodeId,
            extent: 'parent',
            draggable: false,
            position: { x: 140, y: -10 },
            data: {
              riskIds: [parsedData.rcmId || parsedData.riskId || parsedData.mappingId?.split(':')[0]].filter(Boolean),
              controlIds: [parsedData.controlId].filter(Boolean),
              label: 'RCM',
            },
          });
        });

        setDirty(true);
        toast.success(t('rcm:migration.backlog.mapped_success', { defaultValue: 'Successfully mapped control to canvas' }));
      } catch (e) {
        console.error('Failed to parse dropped data', e);
      }
    },
    [rfInstance, setNodes, setDirty, t, isLocked, toggleNodeLock]
  );

  const handleApplyOcr = useCallback(
    (
      stagedNodes: any[],
      stagedEdges: any[],
      mode: OcrImportMode = 'overwrite',
      direction: OcrAppendDirection = 'below',
      extraSheets?: any[]
    ) => {
      if (Array.isArray(extraSheets) && extraSheets.length > 1 && onImportMultipleSheets) {
        onImportMultipleSheets(extraSheets);
        setDirty(true);
        toast.success(t('bpm:ocr.toast.applySuccess'));
        setTimeout(() => {
          rfInstance?.fitView?.({ padding: 0.15, duration: 300 });
        }, 150);
        return;
      }

      let candidateNodes = stagedNodes;
      let candidateEdges = stagedEdges;


      if (mode === 'append' && nodes.length > 0) {
        const offset = calculateAppendOffset({
          direction,
          existingNodes: nodes,
          newNodes: stagedNodes,
        });
        const remapped = remapElementsForAppend(stagedNodes, stagedEdges, offset);
        candidateNodes = remapped.nodes;
        candidateEdges = remapped.edges;
      }

      const finalNodes = candidateNodes.map((node: any) => {
        const isSwimlane = node.type === 'swimlane';
        const isNodeLocked = !!node.data?.isLocked;
        const resolvedDept = node.data?.department?.trim() || node.data?.label?.trim() || deriveLabelFromId(node.id);
        const resolvedLabel = node.data?.label?.trim() || resolvedDept;
        const baseNode: any = {
          id: node.id,
          type: node.type,
          position: { x: node.position.x, y: node.position.y },
          parentId: node.parentId,
          width: node.width,
          height: node.height,
          draggable: !isLocked && !isNodeLocked,
          zIndex: isSwimlane ? -1 : (node.zIndex ?? 10),
          dragHandle: isSwimlane ? '.swimlane-drag-handle' : undefined,
          style: isSwimlane 
            ? { width: node.width || 400, height: node.height || 1200, ...(node.style || {}) } 
            : (node.style ? { ...node.style } : undefined),
          data: isSwimlane
            ? {
                label: resolvedLabel,
                department: resolvedDept,
                function: node.data?.function?.trim() || '',
                isLocked: false,
                onToggleLock: () => toggleNodeLock(node.id),
                onChangeDepartment: (v: string) => updateNodeData(node.id, { department: v }),
                onChangeFunction: (v: string) => updateNodeData(node.id, { function: v }),
                onResizeEnd: (params: any) => handleSwimlaneResizeEnd(node.id, params),
              }
            : {
                label: node.data?.label || '',
                type: node.type,
                regulatoryPairs: [] as any[],
                role: t('bpm:editor.roles.default'),
                isLocked: false,
                onToggleLock: () => toggleNodeLock(node.id),
              },
        };
        return baseNode;
      });

      const standardEdges = candidateEdges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label || '',
        type: 'bridge',
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#0f172a' },
        style: { strokeWidth: 2, stroke: '#0f172a' },
      }));

      const mergedNodes = mode === 'append' ? [...nodes, ...finalNodes] : finalNodes;
      const mergedEdges = mode === 'append' ? [...edges, ...standardEdges] : standardEdges;

      pushState(mergedNodes, mergedEdges);
      setNodes(mergedNodes);
      setEdges(mergedEdges);
      setDirty(true);
      toast.success(t('bpm:ocr.toast.applySuccess'));
      setTimeout(() => {
        rfInstance?.fitView?.({ padding: 0.15, duration: 300 });
      }, 150);
    },
    [nodes, edges, isLocked, t, pushState, setNodes, setEdges, setDirty, rfInstance, toggleNodeLock, updateNodeData, handleSwimlaneResizeEnd]
  );

  return {
    onNodesDelete,
    onEdgesDelete,
    onDragOver,
    onDrop,
    handleApplyOcr,
  };
}
