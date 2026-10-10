import React, { useMemo } from 'react';
import { useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useCanvasHistory } from '@/hooks/use-canvas-history';
import { RegulatoryPropertySheet } from './properties/RegulatoryPropertySheet';
import { BPMCanvasToolbar } from './editor/BPMCanvasToolbar';
import { BPMDocumentView } from './editor/BPMDocumentView';
import { BPMNodeInspectSheet } from './editor/BPMNodeInspectSheet';
import { BPMOcrModal } from './editor/BPMOcrModal';
import { RCMImportWizardModal } from './import/RCMImportWizardModal';
import { BPMCanvasExportOverlay } from './editor/BPMCanvasExportOverlay';
import { BPMCanvas } from './editor/BPMCanvas';
import { bpmEdgeTypes, bpmNodeTypes } from './editor/bpm-canvas-types';
import { BPMCanvasSheetTabBar } from './editor/BPMCanvasSheetTabBar';
import { useBPMSheets } from './editor/hooks/useBPMSheets';
import { useBPMEditorState } from './editor/hooks/useBPMEditorState';
import { useBPMNodeOperations } from './editor/hooks/useBPMNodeOperations';
import { useBPMCanvasDragGuides } from './editor/hooks/useBPMCanvasDragGuides';
import { useBPMCanvasHandlers } from './editor/hooks/useBPMCanvasHandlers';
import { useBPMEditorHistory } from './editor/hooks/useBPMEditorHistory';
import { useBPMEditorPersistence } from './editor/hooks/useBPMEditorPersistence';
import { useBPMEditorSelection } from './editor/hooks/useBPMEditorSelection';
import { useBPMEditorView } from './editor/hooks/useBPMEditorView';
import { useBPMDiagramLoader } from './editor/hooks/useBPMDiagramLoader';
import { initialNodes } from './editor/bpm-editor-constants';

interface BPMEditorProps {
  diagramId: string;
  subProcess: string;
  workingYear: string;
  currentGL?: string;
  bpmProcessId?: string;
}

export function BPMEditor({ diagramId, subProcess, workingYear, currentGL, bpmProcessId: propBpmProcessId }: BPMEditorProps) {
  const { t } = useTranslation(['risklibrary', 'common', 'bpm']);
  const { setDirty, resetDirty } = useUnsavedChangesContext();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const view = useBPMEditorView();

  const localizedInitialNodes = useMemo(
    () => [
      { ...initialNodes[0], data: { ...initialNodes[0]?.data, label: t('bpm:editor.nodes.start') } },
      { id: '2', type: 'end', position: { x: 250, y: 500 }, data: { label: t('bpm:editor.nodes.end'), type: 'end' } },
    ],
    [t],
  );

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
    isExporting: view.isExporting,
    t,
  });

  // Sync isDirty with global context using the unique ID hook
  useUnsavedChanges(isDirty || view.isExporting);

  const { canUndo, canRedo, pushState, undo: executeUndo, redo: executeRedo } = useCanvasHistory(nodes, edges, { maxHistory: 30 });

  const history = useBPMEditorHistory({
    nodes,
    edges,
    setNodes,
    setEdges,
    pushState,
    setDirty,
    canUndo,
    canRedo,
    executeUndo,
    executeRedo,
    rfInstance: view.rfInstance,
    t,
  });

  const selection = useBPMEditorSelection({ nodes, edges, setNodes, setEdges, pushState, setDirty, isLocked });

  const { toggleNodeLock, updateNodeData, handleSwimlaneResizeEnd, createActivityNode, createStartNode, createEndNode, createSwimlane } =
    useBPMNodeOperations({ isLocked, setNodes, edges, setDirty, pushState, t });

  const { alignmentLines, handleNodeDrag, handleNodeDragStop } = useBPMCanvasDragGuides({
    isLocked,
    nodes,
    setNodes,
    edges,
    pushState,
    setDirty,
  });

  const sheetsManager = useBPMSheets({
    diagram,
    nodes,
    edges,
    setNodes,
    setEdges,
    defaultStartNodeLabel: t('bpm:editor.nodes.start'),
    defaultSheetLabel: 'Sheet 1',
  });

  const { onNodesDelete, onEdgesDelete, onDragOver, onDrop, handleApplyOcr } = useBPMCanvasHandlers({
    isLocked,
    rfInstance: view.rfInstance,
    nodes,
    edges,
    setNodes,
    setEdges,
    pushState,
    setDirty,
    toggleNodeLock,
    updateNodeData,
    handleSwimlaneResizeEnd,
    onImportMultipleSheets: sheetsManager.importMultipleSheets,
    t,
  });

  useBPMDiagramLoader({
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
  });


  const persistence = useBPMEditorPersistence({
    diagramId,
    subProcess,
    workingYear,
    diagramYear: diagram?.year,
    diagramMetadata: diagram?.metadata,
    nodes,
    edges,
    sheets: sheetsManager.sheets,
    activeSheetId: sheetsManager.activeSheetId,
    selectedGLs,
    signatures,
    globalScale,
    rfInstance: view.rfInstance,
    diagram,
    setIsExporting: view.setIsExporting,
    resetDirty,
    t,
  });


  // Keyboard Delete flows through here: clear stale selection/editing refs for
  // removed nodes so the worksheet can never dangle on a deleted node.
  const handleNodesDelete = React.useCallback(
    (deleted: import('reactflow').Node[]) => {
      onNodesDelete(deleted);
      selection.syncSelectionAfterDelete(new Set(deleted.map((d) => d.id)));
    },
    [onNodesDelete, selection],
  );

  const suggestionGlDesc = useMemo(() => {
    const found = glOptions.find((o) => o.value === currentGL);
    const parts = (found?.label || '').split('•');
    const desc = parts.length > 1 ? parts.slice(1).join('•').trim() : '';
    return desc && desc !== 'No Description' ? desc : '';
  }, [glOptions, currentGL]);

  if (isDiagramLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );

  return (
    <div ref={view.containerRef} className={cn('flex h-full w-full bg-slate-50 overflow-hidden print:p-0', view.isFullscreen && 'fixed inset-0 z-50 bg-white')}>
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        {view.documentView ? (
          <BPMDocumentView
            subProcess={subProcess}
            workingYear={workingYear}
            isDirty={isDirty}
            fsliName={diagram?.fsliName || 'N/A'}
            nodes={nodes}
            edges={edges}
            globalScale={globalScale}
            signatures={signatures}
            onChangeSignature={(key, val) => setSignatures((prev) => ({ ...prev, [key]: val }))}
            isLocked={isLocked}
            nodeTypes={bpmNodeTypes}
            edgeTypes={bpmEdgeTypes}
            onInit={(instance) => view.setRfInstance(instance)}
            onClose={() => view.setDocumentView(false)}
            onExportToImage={persistence.exportToImage}
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
                isSaving={persistence.saveMutation.isPending}
                hasNodes={nodes.length > 0}
                globalScale={globalScale}
                currentGL={currentGL}
                selectedGLs={selectedGLs}
                glOptions={glOptions}
                isFullscreen={view.isFullscreen}
                onUndo={history.handleUndo}
                onRedo={history.handleRedo}
                onAutoArrange={history.handleAutoArrange}
                onFitView={view.handleFitView}
                onToggleFullscreen={view.toggleFullscreen}
                onOpenDocumentView={() => view.setDocumentView(true)}
                onOpenOcrDialog={() => view.setIsOcrDialogOpen(true)}
                onOpenRcmImportDialog={() => view.setIsRcmImportDialogOpen(true)}
                onScaleChange={(scale) => setGlobalScale(scale)}
                onSelectedGLsChange={setSelectedGLs}
                onSwitchGLContext={handleSwitchGLContext}
                onSave={persistence.handleSave}
              />
            </div>

            {/* Sheet Tabs Bar (Multi-Sheet Navigation) */}
            <BPMCanvasSheetTabBar
              sheets={sheetsManager.sheets}
              activeSheetId={sheetsManager.activeSheetId}
              isLocked={isLocked}
              onSelectSheet={sheetsManager.switchSheet}
              onAddSheet={sheetsManager.addSheet}
              onRenameSheet={sheetsManager.renameSheet}
              onRemoveSheet={sheetsManager.removeSheet}
            />

            <BPMCanvas

              nodes={nodes}
              edges={edges}
              globalScale={globalScale}
              isLocked={isLocked}
              isTouchReadOnly={selection.isTouchReadOnly}
              isMobileView={selection.isMobileView}
              alignmentLines={alignmentLines}
              nodeTypes={bpmNodeTypes}
              edgeTypes={bpmEdgeTypes}
              selectedNode={selection.selectedNode}
              selectedEdge={selection.selectedEdge}
              unmappedControls={unmappedControls}
              subProcess={subProcess}
              setNodes={setNodes}
              setEdges={setEdges}
              setDirty={setDirty}
              pushState={pushState}
              onInit={(instance) => view.setRfInstance(instance)}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodesDelete={handleNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onNodeDrag={handleNodeDrag}
              onNodeDragStop={handleNodeDragStop}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onSelectNode={selection.selectNode}
              onSelectEdge={selection.selectEdge}
              onClearSelection={selection.clearSelection}
              onOpenProperties={selection.openPropertiesForNode}
              onInspectMobile={(id) => selection.setMobileInspectId(id)}
              onToggleLock={toggleNodeLock}
              onUpdateEdgeLabel={selection.handleUpdateEdgeLabel}
              onUpdateEdgeRouting={selection.handleUpdateEdgeRouting}
              onDeleteSelected={selection.handleDeleteSelected}
              onCreateStartNode={createStartNode}
              onCreateEndNode={createEndNode}
              onCreateActivityNode={createActivityNode}
              onCreateSwimlane={createSwimlane}
            />
          </div>
        )}

        <RegulatoryPropertySheet
          selectedNode={selection.editingNode ?? selection.selectedNode ?? null}
          isOpen={!!selection.editingNode}
          onClose={() => selection.setEditingNodeId(null)}
          onUpdateNodeData={updateNodeData}
          onDeleteNode={selection.handleDeleteNode}
          onSave={persistence.handleSave}
          isSaving={persistence.saveMutation.isPending}
          isDirty={isDirty}
          isLocked={isLocked}
          bpmProcessId={bpmProcess?.id}
          nodes={nodes}
          suggestionBase={{
            glCode: currentGL ?? '',
            glDesc: suggestionGlDesc,
            bpmName: bpmProcess?.name ?? subProcess,
          }}
        />

        {/* Mobile read-only node inspector (bottom sheet; opens on mobile tap only) */}
        <BPMNodeInspectSheet node={selection.mobileInspectNode} onClose={() => selection.setMobileInspectId(null)} />
      </div>

      <BPMCanvasExportOverlay isExporting={view.isExporting} />

      {/* --- OCR Diagram Import & Review Dialog --- */}
      <BPMOcrModal
        isOpen={view.isOcrDialogOpen}
        onClose={() => view.setIsOcrDialogOpen(false)}
        onApply={handleApplyOcr}
        nodeTypes={bpmNodeTypes}
        edgeTypes={bpmEdgeTypes}
        isDirty={isDirty}
        hasExistingNodes={nodes.length > 0}
      />

      {/* --- RCM Spreadsheet Import & BPM Auto-Link Dialog --- */}
      <RCMImportWizardModal
        isOpen={view.isRcmImportDialogOpen}
        onClose={() => view.setIsRcmImportDialogOpen(false)}
        diagramId={diagramId}
        bpmProcessId={bpmProcess?.id}
        subProcessName={subProcess}
        workingYear={workingYear}
        bpmNodes={nodes.map((n) => ({
          id: n.id,
          label: n.data?.label || n.id,
          type: n.type || 'activity',
        }))}
        onSuccess={() => {
          persistence.handleSave();
        }}
        onAddBpmNode={(nodeLabel) => {
          createActivityNode(nodeLabel);
          return nodes[nodes.length - 1]?.id || String(Date.now());
        }}
      />
    </div>
  );
}
