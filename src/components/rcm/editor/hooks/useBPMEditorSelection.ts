import * as React from 'react';
import type { Edge, Node, ReactFlowInstance } from 'reactflow';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { isBadgeNodeType } from '../bpm-editor-constants';
import { matchesStepRef } from '../utils/step-ref-utils';

interface UseBPMEditorSelectionParams {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  pushState: (nodes: Node[], edges: Edge[]) => void;
  setDirty: (dirty: boolean) => void;
  isLocked: boolean;
  rfInstance?: ReactFlowInstance | null;
}

export function useBPMEditorSelection({
  nodes,
  edges,
  setNodes,
  setEdges,
  pushState,
  setDirty,
  isLocked,
  rfInstance,
}: UseBPMEditorSelectionParams) {
  const { t } = useTranslation('bpm');
  const [searchParams] = useSearchParams();
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
  // Explicit edit intent: the node whose Regulatory Property Worksheet is open.
  // Single-click only sets selectedNodeId (HUD + highlight); double-click,
  // HUD Edit, or Enter sets editingNodeId to open the sheet.
  const [editingNodeId, setEditingNodeId] = React.useState<string | null>(null);

  // Read-only inspection contract on small viewports: same canvas, no edits.
  const isMobileView = useIsMobile();
  const [mobileInspectId, setMobileInspectId] = React.useState<string | null>(null);
  const isTouchReadOnly = isLocked || isMobileView;
  const mobileInspectNode = mobileInspectId ? (nodes.find((n) => n.id === mobileInspectId) ?? null) : null;

  // Portals escape CSS wrappers: close the inspector when leaving mobile width.
  React.useEffect(() => {
    if (!isMobileView) setMobileInspectId(null);
  }, [isMobileView]);

  // Deep-link node highlight: check search params for nodeId / stepRef to auto-select and center
  const notifiedMissingRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (nodes.length === 0) return;
    const targetNodeId = searchParams.get('nodeId');
    const targetStepRef = searchParams.get('stepRef');
    if (!targetNodeId && !targetStepRef) return;

    let match = targetNodeId ? nodes.find((n) => n.id === targetNodeId) : undefined;
    if (!match && targetStepRef) {
      match = nodes.find((n) => matchesStepRef(n.data?.stepRef, n.data?.label, targetStepRef));
    }

    if (match) {
      setSelectedNodeId(match.id);
      if (rfInstance && match.position) {
        const nodeWidth = typeof match.width === 'number' ? match.width : 160;
        const nodeHeight = typeof match.height === 'number' ? match.height : 60;
        rfInstance.setCenter(match.position.x + nodeWidth / 2, match.position.y + nodeHeight / 2, { zoom: 1.1, duration: 400 });
      }
    } else {
      const searchKey = `${targetNodeId || ''}:${targetStepRef || ''}`;
      if (notifiedMissingRef.current !== searchKey) {
        notifiedMissingRef.current = searchKey;
        toast.info(t('bpm:editor.toast.nodeNotFound'));
      }
    }
  }, [nodes, searchParams, rfInstance, t]);

  // Explicit edit intent: resolves the node, skips badge helpers, then marks it
  // as both selected (HUD) and editing (worksheet open).
  const openPropertiesForNode = React.useCallback(
    (nodeId: string) => {
      const target = nodes.find((n) => n.id === nodeId);
      if (!target || isBadgeNodeType(target.type)) return;
      setSelectedEdgeId(null);
      setSelectedNodeId(nodeId);
      setEditingNodeId(nodeId);
    },
    [nodes],
  );

  // Enter opens the Regulatory Property Worksheet for the selected node.
  // Guarded so typing in inputs (incl. the HUD edge-label field) never triggers it,
  // and so it never fires while the sheet is already open.
  React.useEffect(() => {
    const handleEnterToEdit = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      if (!selectedNodeId || editingNodeId) return;
      openPropertiesForNode(selectedNodeId);
    };

    window.addEventListener('keydown', handleEnterToEdit);
    return () => window.removeEventListener('keydown', handleEnterToEdit);
  }, [selectedNodeId, editingNodeId, openPropertiesForNode]);

  // Keyboard Delete flows through here: clear stale selection/editing refs for
  // removed nodes so the worksheet can never dangle on a deleted node.
  const syncSelectionAfterDelete = React.useCallback((deletedIds: Set<string>) => {
    setSelectedNodeId((prev) => (prev && deletedIds.has(prev) ? null : prev));
    setEditingNodeId((prev) => (prev && deletedIds.has(prev) ? null : prev));
  }, []);

  const handleUpdateEdgeLabel = React.useCallback(
    (edgeId: string, label: string) => {
      if (isLocked) return;
      pushState(nodes, edges);
      setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, label } : e)));
      setDirty(true);
    },
    [isLocked, nodes, edges, pushState, setEdges, setDirty],
  );

  const handleUpdateEdgeRouting = React.useCallback(
    (edgeId: string, mode: 'auto' | '1-corner' | '2-corner', resetOffset?: boolean) => {
      if (isLocked) return;
      pushState(nodes, edges);
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edgeId) return e;
          const currentData = { ...(e.data || {}) };
          if (resetOffset) {
            delete currentData.bendOffset;
          }
          currentData.routingMode = mode;
          return {
            ...e,
            data: currentData,
          };
        }),
      );
      setDirty(true);
    },
    [isLocked, nodes, edges, pushState, setEdges, setDirty],
  );

  const handleDeleteSelected = React.useCallback(() => {
    const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
    const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;
    if (selectedNode) {
      pushState(nodes, edges);
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id && n.parentId !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNodeId(null);
      setEditingNodeId(null);
      setDirty(true);
    } else if (selectedEdge) {
      pushState(nodes, edges);
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdgeId(null);
      setDirty(true);
    }
  }, [nodes, edges, selectedNodeId, selectedEdgeId, pushState, setNodes, setEdges, setDirty]);

  const clearSelection = React.useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEditingNodeId(null);
  }, []);

  const selectNode = React.useCallback((id: string) => {
    if (!id) {
      setSelectedNodeId(null);
      return;
    }
    setSelectedEdgeId(null);
    setSelectedNodeId(id);
  }, []);

  const selectEdge = React.useCallback((id: string) => {
    if (!id) {
      setSelectedEdgeId(null);
      return;
    }
    setSelectedNodeId(null);
    setEditingNodeId(null);
    setSelectedEdgeId(id);
  }, []);

  const handleDeleteNode = React.useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id && n.parentId !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNodeId(null);
      setEditingNodeId(null);
    },
    [setNodes, setEdges],
  );

  const selectedNode = React.useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const selectedEdge = React.useMemo(() => edges.find((e) => e.id === selectedEdgeId), [edges, selectedEdgeId]);
  // The node whose worksheet dialog is open. Falls back to null (never to the
  // current selection) so moving selection while the sheet is open keeps the
  // sheet pinned to the node being edited.
  const editingNode = React.useMemo(() => nodes.find((n) => n.id === editingNodeId) ?? null, [nodes, editingNodeId]);

  return {
    selectedNodeId,
    selectedEdgeId,
    editingNodeId,
    selectedNode,
    selectedEdge,
    editingNode,
    isMobileView,
    isTouchReadOnly,
    mobileInspectNode,
    setMobileInspectId,
    setEditingNodeId,
    openPropertiesForNode,
    syncSelectionAfterDelete,
    handleUpdateEdgeLabel,
    handleUpdateEdgeRouting,
    handleDeleteSelected,
    handleDeleteNode,
    clearSelection,
    selectNode,
    selectEdge,
  };
}
