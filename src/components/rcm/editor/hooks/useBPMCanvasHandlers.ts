import { useCallback } from 'react';
import type { Dispatch, SetStateAction, DragEvent } from 'react';
import type { Node, Edge } from 'reactflow';
import { toast } from 'sonner';
import { getStandardNodeDimensions, BPM_CANVAS_Z_INDEX } from '@/utils/bpm-constants';
import type { BPMDiagramSheet } from '@shared/types';
import { applyOcrImport } from '../ocr/ocr-import-adapter';
import { enrichCanvasNodes } from '../ocr/ocr-node-normalize';
import type { OcrApplyRequest } from '../ocr/ocr-types';

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
    (deleted: Node[]) => {
      if (deleted.length > 0) {
        pushState(nodes, edges);
        setDirty(true);
        toast.info(`Deleted ${deleted.length} node(s)`);
      }
    },
    [nodes, edges, pushState, setDirty]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
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
          zIndex: BPM_CANVAS_Z_INDEX.SHAPE,
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
    (request: OcrApplyRequest) => {
      const out = applyOcrImport({
        stagedNodes: request.nodes,
        stagedEdges: request.edges,
        mode: request.mode ?? 'overwrite',
        direction: request.direction ?? 'below',
        existingNodes: nodes,
        existingEdges: edges,
        pages: request.pages,
        activePage: request.activePage,
        formatSheetName: request.formatSheetName,
      });

      if (out.kind === 'sheets' && onImportMultipleSheets) {
        // boundary: ReactFlow runtime sheets share element shape with the
        // persisted BPMDiagramSheet store; shape locked by ocr-import-adapter.test.ts.
        onImportMultipleSheets(out.sheets as BPMDiagramSheet[]);
        setDirty(true);
        toast.success(t('bpm:ocr.toast.applySuccess'));
        setTimeout(() => {
          rfInstance?.fitView?.({ padding: 0.15, duration: 300 });
        }, 150);
        return;
      }

      const canvasNodes = out.kind === 'canvas' ? out.nodes : request.nodes;
      const canvasEdges = out.kind === 'canvas' ? out.edges : request.edges;
      const finalNodes = enrichCanvasNodes(canvasNodes, {
        isLocked,
        defaultRole: t('bpm:editor.roles.default'),
        toggleNodeLock,
        updateNodeData,
        handleSwimlaneResizeEnd,
      });

      pushState(finalNodes, canvasEdges);
      setNodes(finalNodes);
      setEdges(canvasEdges);
      setDirty(true);
      toast.success(t('bpm:ocr.toast.applySuccess'));
      setTimeout(() => {
        rfInstance?.fitView?.({ padding: 0.15, duration: 300 });
      }, 150);
    },
    [nodes, edges, isLocked, t, pushState, setNodes, setEdges, setDirty, rfInstance, toggleNodeLock, updateNodeData, handleSwimlaneResizeEnd, onImportMultipleSheets]
  );

  return {
    onNodesDelete,
    onEdgesDelete,
    onDragOver,
    onDrop,
    handleApplyOcr,
  };
}
