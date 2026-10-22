import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';
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
import { useBPMEditor } from './editor/hooks/useBPMEditor';

interface BPMEditorProps {
  diagramId: string;
  subProcess: string;
  workingYear: string;
  currentGL?: string;
  bpmProcessId?: string;
}

export function BPMEditor({ diagramId, subProcess, workingYear, currentGL, bpmProcessId: propBpmProcessId }: BPMEditorProps) {
  const { t } = useTranslation(['risklibrary', 'common', 'bpm']);
  const editor = useBPMEditor({ diagramId, subProcess, workingYear, currentGL, bpmProcessId: propBpmProcessId, t });
  const { graph, state, view, history, selection, ops, guides, sheets, handlers, persistence } = editor;

  if (state.isDiagramLoading)
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
            isDirty={state.isDirty}
            fsliName={state.diagram?.fsliName || 'N/A'}
            nodes={graph.nodes}
            edges={graph.edges}
            globalScale={state.globalScale}
            signatures={state.signatures}
            onChangeSignature={(key, val) => state.setSignatures((prev) => ({ ...prev, [key]: val }))}
            isLocked={state.isLocked}
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
                canUndo={graph.canUndo}
                canRedo={graph.canRedo}
                isLocked={state.isLocked}
                isSaving={persistence.saveMutation.isPending}
                hasNodes={graph.nodes.length > 0}
                globalScale={state.globalScale}
                currentGL={currentGL}
                selectedGLs={state.selectedGLs}
                glOptions={state.glOptions}
                isFullscreen={view.isFullscreen}
                onUndo={history.handleUndo}
                onRedo={history.handleRedo}
                onFitView={view.handleFitView}
                onToggleFullscreen={view.toggleFullscreen}
                onOpenDocumentView={() => view.setDocumentView(true)}
                onOpenOcrDialog={() => view.setIsOcrDialogOpen(true)}
                onOpenRcmImportDialog={() => view.setIsRcmImportDialogOpen(true)}
                onScaleChange={(scale) => state.setGlobalScale(scale)}
                onSelectedGLsChange={state.setSelectedGLs}
                onSwitchGLContext={state.handleSwitchGLContext}
                onSave={persistence.handleSave}
              />
            </div>

            {/* Sheet Tabs Bar (Multi-Sheet Navigation) */}
            <BPMCanvasSheetTabBar
              sheets={sheets.sheets}
              activeSheetId={sheets.activeSheetId}
              isLocked={state.isLocked}
              onSelectSheet={sheets.switchSheet}
              onAddSheet={sheets.addSheet}
              onRenameSheet={sheets.renameSheet}
              onRemoveSheet={sheets.removeSheet}
            />

            <BPMCanvas
              nodes={graph.nodes}
              edges={graph.edges}
              globalScale={state.globalScale}
              isLocked={state.isLocked}
              isTouchReadOnly={selection.isTouchReadOnly}
              isMobileView={selection.isMobileView}
              alignmentLines={guides.alignmentLines}
              nodeTypes={bpmNodeTypes}
              edgeTypes={bpmEdgeTypes}
              selectedNode={selection.selectedNode}
              selectedEdge={selection.selectedEdge}
              unmappedControls={state.unmappedControls}
              subProcess={subProcess}
              setNodes={graph.setNodes}
              setEdges={graph.setEdges}
              setDirty={editor.setDirty}
              pushState={graph.pushState}
              onInit={(instance) => view.setRfInstance(instance)}
              onNodesChange={graph.onNodesChange}
              onEdgesChange={graph.onEdgesChange}
              onNodesDelete={editor.handleNodesDelete}
              onEdgesDelete={handlers.onEdgesDelete}
              onNodeDrag={guides.handleNodeDrag}
              onNodeDragStop={guides.handleNodeDragStop}
              onDragOver={handlers.onDragOver}
              onDrop={handlers.onDrop}
              onSelectNode={selection.selectNode}
              onSelectEdge={selection.selectEdge}
              onClearSelection={selection.clearSelection}
              onOpenProperties={selection.openPropertiesForNode}
              onInspectMobile={(id) => selection.setMobileInspectId(id)}
              onToggleLock={ops.toggleNodeLock}
              onUpdateEdgeLabel={selection.handleUpdateEdgeLabel}
              onUpdateEdgeRouting={selection.handleUpdateEdgeRouting}
              onDeleteSelected={selection.handleDeleteSelected}
              onCreateStartNode={ops.createStartNode}
              onCreateEndNode={ops.createEndNode}
              onCreateActivityNode={ops.createActivityNode}
              onCreateSwimlane={ops.createSwimlane}
            />
          </div>
        )}

        <RegulatoryPropertySheet
          selectedNode={selection.editingNode ?? selection.selectedNode ?? null}
          isOpen={!!selection.editingNode}
          onClose={() => selection.setEditingNodeId(null)}
          onUpdateNodeData={ops.updateNodeData}
          onDeleteNode={selection.handleDeleteNode}
          onSave={persistence.handleSave}
          isSaving={persistence.saveMutation.isPending}
          isDirty={state.isDirty}
          isLocked={state.isLocked}
          bpmProcessId={state.bpmProcess?.id}
          nodes={graph.nodes}
          suggestionBase={{
            glCode: currentGL ?? '',
            glDesc: editor.suggestionGlDesc,
            bpmName: state.bpmProcess?.name ?? subProcess,
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
        onApply={handlers.handleApplyOcr}
        nodeTypes={bpmNodeTypes}
        edgeTypes={bpmEdgeTypes}
        isDirty={state.isDirty}
        hasExistingNodes={graph.nodes.length > 0}
      />

      {/* --- RCM Spreadsheet Import & BPM Auto-Link Dialog --- */}
      <RCMImportWizardModal
        isOpen={view.isRcmImportDialogOpen}
        onClose={() => view.setIsRcmImportDialogOpen(false)}
        diagramId={diagramId}
        bpmProcessId={state.bpmProcess?.id}
        subProcessName={subProcess}
        workingYear={workingYear}
        bpmNodes={graph.nodes.map((n) => ({
          id: n.id,
          label: n.data?.label || n.id,
          type: n.type || 'activity',
        }))}
        onSuccess={() => {
          persistence.handleSave();
        }}
        onAddBpmNode={(nodeLabel) => {
          ops.createActivityNode(nodeLabel);
          return graph.nodes[graph.nodes.length - 1]?.id || String(Date.now());
        }}
      />
    </div>
  );
}
