import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useCanvasHistory } from '@/hooks/use-canvas-history';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { RegulatoryPropertySheet } from './properties/RegulatoryPropertySheet';
import { autoArrangeBpmDiagram } from '@/utils/bpm-auto-layout';
import { BPMSelectionHUD } from './editor/BPMSelectionHUD';
import { BPMCanvasToolbar } from './editor/BPMCanvasToolbar';
import { BPMShapePalette } from './editor/BPMShapePalette';
import { BPMDocumentView } from './editor/BPMDocumentView';
import { BPMNodeInspectSheet } from './editor/BPMNodeInspectSheet';
import { BPMOcrModal } from './editor/BPMOcrModal';
import { BPMCanvasExportOverlay } from './editor/BPMCanvasExportOverlay';
import { BPMCanvasAlignmentGuides } from './editor/BPMCanvasAlignmentGuides';
import { bpmNodeTypes, bpmEdgeTypes } from './editor/bpm-canvas-types';
import { useBPMEditorState } from './editor/hooks/useBPMEditorState';
import { useBPMNodeOperations } from './editor/hooks/useBPMNodeOperations';
import { useBPMCanvasDragGuides } from './editor/hooks/useBPMCanvasDragGuides';
import { useBPMCanvasHandlers } from './editor/hooks/useBPMCanvasHandlers';
import { exportBpmToPdf } from './editor/utils/export-bpm-pdf';
import { sanitizeNodesForSave, sanitizeEdgesForSave } from './editor/utils/sanitize-bpm-nodes';

const initialNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start', type: 'start' } },
];

interface BPMEditorProps {
  diagramId: string;
  subProcess: string;
  workingYear: string;
  currentGL?: string;
  bpmProcessId?: string;
}

// Badge helper nodes never take part in select-vs-edit: neither single-click
// selection nor double-click worksheet opening applies to them.
const NON_SELECTABLE_BADGE_TYPES = new Set(['risk-control-badge', 'docked-risk', 'docked-control']);

function isBadgeNodeType(type?: string | null) {
  return !!type && NON_SELECTABLE_BADGE_TYPES.has(type);
}

// Mobile (<md) viewport detection for the read-only inspection contract.
// Edit chrome is hidden via CSS; canvas interactions are gated via this flag.
function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

export function BPMEditor({ diagramId, subProcess, workingYear, currentGL, bpmProcessId: propBpmProcessId }: BPMEditorProps) {
  const { t } = useTranslation(['risklibrary', 'common', 'bpm']);
  const [documentView, setDocumentView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // Explicit edit intent: the node whose Regulatory Property Worksheet is open.
  // Single-click only sets selectedNodeId (HUD + highlight); double-click,
  // HUD Edit, or Enter sets editingNodeId to open the sheet.
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const { setDirty, resetDirty } = useUnsavedChangesContext();

  const handleFitView = useCallback(() => {
    if (rfInstance) {
      rfInstance.fitView({ padding: 0.15, duration: 400 });
    }
  }, [rfInstance]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        // Fallback for browsers / iframes that deny native fullscreen
        setIsFullscreen(prev => !prev);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Auto refit view after fullscreen resize transition
      setTimeout(() => {
        if (rfInstance) {
          rfInstance.fitView({ padding: 0.15, duration: 200 });
        }
      }, 150);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [rfInstance]);

  const {
    canUndo,
    canRedo,
    pushState,
    undo: executeUndo,
    redo: executeRedo,
    resetHistory
  } = useCanvasHistory(nodes, edges, { maxHistory: 30 });

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    executeUndo(nodes, edges, setNodes, setEdges);
    setDirty(true);
    toast.info(t('bpm:editor.toast.undo', { defaultValue: 'Perubahan dibatalkan (Undo)' }));
  }, [canUndo, executeUndo, nodes, edges, setNodes, setEdges, setDirty, t]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    executeRedo(nodes, edges, setNodes, setEdges);
    setDirty(true);
    toast.info(t('bpm:editor.toast.redo', { defaultValue: 'Perubahan diulang (Redo)' }));
  }, [canRedo, executeRedo, nodes, edges, setNodes, setEdges, setDirty, t]);

  const handleAutoArrange = useCallback(() => {
    if (nodes.length === 0) return;
    pushState(nodes, edges);
    const arranged = autoArrangeBpmDiagram(nodes, edges);
    setNodes(arranged.nodes);
    setEdges(arranged.edges);
    setDirty(true);
    toast.success(t('bpm:editor.toast.autoArrangeSuccess', { defaultValue: 'Canvas layout auto-arranged successfully' }));
    // Automatically center and fit whole diagram after arrangement
    setTimeout(() => {
      if (rfInstance) {
        rfInstance.fitView({ padding: 0.15, duration: 400 });
      }
    }, 100);
  }, [nodes, edges, pushState, setNodes, setEdges, setDirty, t, rfInstance]);

  // Global Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'y' && !e.shiftKey) || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Explicit edit intent: resolves the node, skips badge helpers, then marks it
  // as both selected (HUD) and editing (worksheet open).
  const openPropertiesForNode = useCallback((nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    if (!target || isBadgeNodeType(target.type)) return;
    setSelectedEdgeId(null);
    setSelectedNodeId(nodeId);
    setEditingNodeId(nodeId);
  }, [nodes]);

  // Enter opens the Regulatory Property Worksheet for the selected node.
  // Guarded so typing in inputs (incl. the HUD edge-label field) never triggers it,
  // and so it never fires while the sheet is already open.
  useEffect(() => {
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

  const localizedInitialNodes = useMemo(() => [
    { ...initialNodes[0], data: { ...initialNodes[0].data, label: t('bpm:editor.nodes.start') } },
    { id: '2', type: 'end', position: { x: 250, y: 500 }, data: { label: t('bpm:editor.nodes.end'), type: 'end' } }
  ], [t]);

  const {
    diagram,
    isDiagramLoading,
    bpmProcess,
    signatures,
    setSignatures,
    selectedGLs,
    setSelectedGLs,
    globalScale,
    setGlobalScale,
    glOptions,
    unmappedControls,
    isLocked,
    isDirty,
    handleSwitchGLContext,
  } = useBPMEditorState({
    diagramId,
    subProcess,
    workingYear,
    currentGL,
    bpmProcessId: propBpmProcessId,
    nodes,
    edges,
    localizedInitialNodes,
    isExporting,
    t,
  });

  // Sync isDirty with global context using the unique ID hook
  useUnsavedChanges(isDirty || isExporting);

  // Read-only inspection contract on small viewports: same canvas, no edits.
  // (Placed after useBPMEditorState so isLocked is in scope.)
  const isMobileView = useIsMobileViewport();
  const [mobileInspectId, setMobileInspectId] = useState<string | null>(null);
  const isTouchReadOnly = isLocked || isMobileView;
  const mobileInspectNode = mobileInspectId ? nodes.find(n => n.id === mobileInspectId) ?? null : null;

  // Portals escape CSS wrappers: close the inspector when leaving mobile width.
  useEffect(() => {
    if (!isMobileView) setMobileInspectId(null);
  }, [isMobileView]);

  const {
    toggleNodeLock,
    updateNodeData,
    handleSwimlaneResizeEnd,
    createActivityNode,
    createStartNode,
    createEndNode,
    createSwimlane,
  } = useBPMNodeOperations({
    isLocked,
    setNodes,
    edges,
    setDirty,
    pushState,
    t,
  });

  const {
    alignmentLines,
    handleNodeDrag,
    handleNodeDragStop,
  } = useBPMCanvasDragGuides({
    isLocked,
    nodes,
    setNodes,
    edges,
    pushState,
    setDirty,
  });

  const {
    onNodesDelete,
    onEdgesDelete,
    onDragOver,
    onDrop,
    handleApplyOcr,
  } = useBPMCanvasHandlers({
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
    t,
  });

  // Keyboard Delete flows through here: clear stale selection/editing refs for
  // removed nodes so the worksheet can never dangle on a deleted node.
  const handleNodesDelete = useCallback((deleted: any[]) => {
    onNodesDelete(deleted);
    const deletedIds = new Set(deleted.map((d: any) => d.id));
    setSelectedNodeId(prev => (prev && deletedIds.has(prev) ? null : prev));
    setEditingNodeId(prev => (prev && deletedIds.has(prev) ? null : prev));
  }, [onNodesDelete]);

  const hasLoadedDiagramRef = useRef<string | null>(null);

  useEffect(() => {
    if (diagram) {
      const diagramKey = `${diagramId}-${currentGL || ''}-${diagram.updatedAt || diagram.createdAt || 'initial'}`;
      if (hasLoadedDiagramRef.current === diagramKey) {
        return;
      }
      hasLoadedDiagramRef.current = diagramKey;

      const initialNodesWithHandlers = (diagram.nodes?.length > 0 ? diagram.nodes : localizedInitialNodes).map((node: any) => {
        const isSwimlane = node.type === 'swimlane';
        const isNodeLocked = !!node.data?.isLocked;
        
        const baseNode = {
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
            onResizeEnd: (params: any) => handleSwimlaneResizeEnd(node.id, params),
          };
        } else {
          baseNode.data = {
            ...node.data,
            onToggleLock: () => toggleNodeLock(node.id)
          };
        }
        return baseNode;
      });
      setNodes(initialNodesWithHandlers);
      setEdges((diagram.edges || []).map((edge: any) => ({
        ...edge,
        type: 'bridge',
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#0f172a'
        },
        style: { strokeWidth: 2, stroke: '#0f172a' }
      })));
    }
  }, [diagram, diagramId, currentGL, setNodes, setEdges, localizedInitialNodes, updateNodeData, toggleNodeLock, handleSwimlaneResizeEnd, isLocked]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find(e => e.id === selectedEdgeId), [edges, selectedEdgeId]);
  // The node whose worksheet dialog is open. Falls back to null (never to the
  // current selection) so moving selection while the sheet is open keeps the
  // sheet pinned to the node being edited.
  const editingNode = useMemo(() => nodes.find(n => n.id === editingNodeId) ?? null, [nodes, editingNodeId]);

  const handleUpdateEdgeLabel = useCallback((edgeId: string, label: string) => {
    if (isLocked) return;
    pushState(nodes, edges);
    setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, label } : e)));
    setDirty(true);
  }, [isLocked, nodes, edges, pushState, setEdges, setDirty]);

  const handleUpdateEdgeRouting = useCallback((edgeId: string, mode: 'auto' | '1-corner' | '2-corner', resetOffset?: boolean) => {
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
      })
    );
    setDirty(true);
  }, [isLocked, nodes, edges, pushState, setEdges, setDirty]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api(`/api/bpm-diagrams/${diagramId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success(t('common:notifications.success'));
      resetDirty();
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
    },
    onError: (err: any) => {
      toast.error(err.message || t('common:notifications.error', { defaultValue: 'Failed to save diagram changes' }));
    }
  });

  const logExportMutation = useMutation({
    mutationFn: (filename: string) => api('/api/bpm-exports', {
      method: 'POST',
      body: JSON.stringify({ diagramId, filename })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-exports'] });
    }
  });

  const exportToImage = () => {
    return exportBpmToPdf({
      rfInstance,
      subProcess,
      diagram,
      diagramId,
      t,
      onStart: () => setIsExporting(true),
      onFinish: () => setIsExporting(false),
      onLogExport: (filename) => logExportMutation.mutateAsync(filename)
    });
  };



  if (isDiagramLoading) return <div className="flex h-full items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-300" /></div>;

  return (
    <div ref={containerRef} className={cn("flex h-full w-full bg-slate-50 overflow-hidden print:p-0", isFullscreen && "fixed inset-0 z-50 bg-white")}>
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        {documentView ? (
          <BPMDocumentView
            subProcess={subProcess}
            workingYear={workingYear}
            isDirty={isDirty}
            fsliName={diagram?.fsliName || 'N/A'}
            nodes={nodes}
            edges={edges}
            globalScale={globalScale}
            signatures={signatures}
            onChangeSignature={(key, val) => setSignatures(prev => ({ ...prev, [key]: val }))}
            isLocked={isLocked}
            nodeTypes={bpmNodeTypes}
            edgeTypes={bpmEdgeTypes}
            onInit={(instance) => setRfInstance(instance)}
            onClose={() => setDocumentView(false)}
            onExportToImage={exportToImage}
          />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Dedicated Top Canvas Toolbar (desktop only; hidden on mobile) */}
            <div className="hidden md:block">
            <BPMCanvasToolbar
              subProcess={subProcess}
              canUndo={canUndo}
              canRedo={canRedo}
              isLocked={isLocked}
              isSaving={saveMutation.isPending}
              hasNodes={nodes.length > 0}
              globalScale={globalScale}
              currentGL={currentGL}
              selectedGLs={selectedGLs}
              glOptions={glOptions}
              isFullscreen={isFullscreen}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onAutoArrange={handleAutoArrange}
              onFitView={handleFitView}
              onToggleFullscreen={toggleFullscreen}
              onOpenDocumentView={() => setDocumentView(true)}
              onOpenOcrDialog={() => setIsOcrDialogOpen(true)}
              onScaleChange={(scale) => setGlobalScale(scale)}
              onSelectedGLsChange={setSelectedGLs}
              onSwitchGLContext={handleSwitchGLContext}
              onSave={() => saveMutation.mutate({ 
                nodes: sanitizeNodesForSave(nodes), edges: sanitizeEdgesForSave(edges), name: subProcess, subProcess, year: diagram?.year || parseInt(workingYear), noGLs: selectedGLs,
                metadata: { ...diagram?.metadata, signatures, globalScale }
              })}
            />
            </div>

            {/* Mobile read-only banner */}
            <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 border-b border-slate-200 shrink-0">
              <Eye className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                {t('bpm:mobile.viewMode', { defaultValue: 'Mode Lihat' })}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {t('bpm:mobile.viewModeHint', { defaultValue: 'Read-only di HP — sunting di desktop' })}
              </span>
            </div>

            {/* ReactFlow Canvas Viewport */}
            <div className="flex-1 relative h-full w-full overflow-hidden">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                minZoom={0.02}
                maxZoom={2.5}
                style={{ 
                  '--bpm-global-width-scale': globalScale / 100, 
                  '--bpm-global-font-scale': globalScale / 100 
                } as React.CSSProperties}
                onInit={setRfInstance}
                onNodesChange={isTouchReadOnly ? undefined : onNodesChange}
                onEdgesChange={isTouchReadOnly ? undefined : onEdgesChange}
                onNodesDelete={isTouchReadOnly ? undefined : handleNodesDelete}
                onEdgesDelete={isTouchReadOnly ? undefined : onEdgesDelete}
                deleteKeyCode={isTouchReadOnly ? null : ["Delete", "Backspace"]}
                nodesDraggable={!isTouchReadOnly}
                nodesConnectable={!isTouchReadOnly}
                elementsSelectable={true}
                onNodeDrag={handleNodeDrag}
                onNodeDragStop={handleNodeDragStop}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onConnect={isTouchReadOnly ? undefined : (params) => {
                  pushState(nodes, edges);
                  setDirty(true);
                  setEdges((eds) => addEdge({ 
                    ...params, 
                    type: 'bridge',
                    markerEnd: { 
                      type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#0f172a'
                    },
                    style: { strokeWidth: 2, stroke: '#0f172a' }
                  }, eds));
                }}
                onNodeClick={(_, node) => {
                  // Select only: never opens the worksheet. Users can drag,
                  // lock, or delete straight from the selection HUD.
                  setSelectedEdgeId(null);
                  if (isBadgeNodeType(node.type)) return;
                  setSelectedNodeId(node.id);
                  // On mobile the edit HUD is hidden: tap opens the read-only inspector.
                  if (isMobileView) setMobileInspectId(node.id);
                }}
                onNodeDoubleClick={(_, node) => {
                  // Explicit edit intent: select + open the worksheet.
                  if (isBadgeNodeType(node.type)) return;
                  // On mobile there is no editing: route to the read-only inspector.
                  if (isMobileView) {
                    setSelectedNodeId(node.id);
                    setMobileInspectId(node.id);
                    return;
                  }
                  openPropertiesForNode(node.id);
                }}
                onEdgeClick={(_, edge) => {
                  setSelectedNodeId(null);
                  setEditingNodeId(null);
                  setSelectedEdgeId(edge.id);
                }}
                onPaneClick={() => {
                  setSelectedNodeId(null);
                  setSelectedEdgeId(null);
                  setEditingNodeId(null);
                }}
                nodeTypes={bpmNodeTypes}
                edgeTypes={bpmEdgeTypes}
                fitView
                fitViewOptions={{ padding: 0.15 }}
              >
                {/* Visio-like Smart Alignment Guide Lines */}
                <BPMCanvasAlignmentGuides
                  horizontal={alignmentLines.horizontal}
                  vertical={alignmentLines.vertical}
                />
                <Background gap={16} size={1} color="hsl(var(--border))" />
                {/* MOBILE POLICY (2026-10-04, audit): BPM canvas view-only di <md — full edit desktop-only.
                    Controls disembunyikan di mobile agar tidak menutupi kanvas & target sentuh kecil.
                    Jangan aktifkan toolbar/palette/Controls di mobile tanpa RFC audit. */}
                <div className="hidden md:block">
                  <Controls />
                </div>
                <div className="hidden md:block">
                  <MiniMap />
                </div>

            {/* Process Elements & Flow Controls Palette (desktop only) */}
            <div className="hidden md:block">
            <BPMShapePalette
              subProcess={subProcess}
              isLocked={isLocked}
              onCreateStartNode={createStartNode}
              onCreateEndNode={createEndNode}
              onCreateActivityNode={createActivityNode}
              onCreateSwimlane={createSwimlane}
              unmappedControls={unmappedControls}
            />

              {/* High-Contrast Selection Awareness HUD */}
              <BPMSelectionHUD
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                isLocked={isLocked}
                onToggleLock={toggleNodeLock}
                onUpdateEdgeLabel={handleUpdateEdgeLabel}
                onUpdateEdgeRouting={handleUpdateEdgeRouting}
                onEditSelected={() => {
                  if (selectedNode) openPropertiesForNode(selectedNode.id);
                }}
               onDeleteSelected={() => {
                 if (selectedNode) {
                   pushState(nodes, edges);
                   setNodes(nds => nds.filter(n => n.id !== selectedNode.id && n.parentId !== selectedNode.id));
                   setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                   setSelectedNodeId(null);
                   setEditingNodeId(null);
                   setDirty(true);
                 } else if (selectedEdge) {
                   pushState(nodes, edges);
                   setEdges(eds => eds.filter(e => e.id !== selectedEdge.id));
                   setSelectedEdgeId(null);
                   setDirty(true);
                 }
               }}
               onClearSelection={() => {
                 setSelectedNodeId(null);
                 setSelectedEdgeId(null);
                 setEditingNodeId(null);
               }}
              />
            </div>
          </ReactFlow>
        </div>
      </div>
    )}

        <RegulatoryPropertySheet
          selectedNode={editingNode ?? selectedNode ?? null}
          isOpen={!!editingNode}
          onClose={() => setEditingNodeId(null)}
          onUpdateNodeData={updateNodeData}
          onDeleteNode={(id) => {
            setNodes(nds => nds.filter(n => n.id !== id && n.parentId !== id));
            setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
            setSelectedNodeId(null);
            setEditingNodeId(null);
          }}
          onSave={() => saveMutation.mutate({ 
            nodes: sanitizeNodesForSave(nodes), edges: sanitizeEdgesForSave(edges), name: subProcess, subProcess, year: diagram?.year || parseInt(workingYear), noGLs: selectedGLs,
            metadata: { ...diagram?.metadata, signatures, globalScale }
          })}
          isSaving={saveMutation.isPending}
          isDirty={isDirty}
          isLocked={isLocked}
          bpmProcessId={bpmProcess?.id}
          nodes={nodes}
        />

        {/* Mobile read-only node inspector (bottom sheet; opens on mobile tap only) */}
        <BPMNodeInspectSheet
          node={mobileInspectNode}
          onClose={() => setMobileInspectId(null)}
        />

      </div>

      <BPMCanvasExportOverlay isExporting={isExporting} />

      {/* --- OCR Diagram Import & Review Dialog --- */}
      <BPMOcrModal
        isOpen={isOcrDialogOpen}
        onClose={() => setIsOcrDialogOpen(false)}
        onApply={handleApplyOcr}
        nodeTypes={bpmNodeTypes}
        edgeTypes={bpmEdgeTypes}
        isDirty={isDirty}
      />
    </div>
  );
}
