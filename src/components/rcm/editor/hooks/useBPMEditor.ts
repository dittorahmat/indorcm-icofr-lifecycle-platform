import React, { useMemo } from 'react';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useBPMSheets } from './useBPMSheets';
import { useBPMDiagram } from './useBPMDiagram';
import { useBPMEditorState } from './useBPMEditorState';
import { useBPMNodeOperations } from './useBPMNodeOperations';
import { useBPMCanvasDragGuides } from './useBPMCanvasDragGuides';
import { useBPMCanvasHandlers } from './useBPMCanvasHandlers';
import { useBPMEditorHistory } from './useBPMEditorHistory';
import { useBPMEditorPersistence } from './useBPMEditorPersistence';
import { useBPMEditorSelection } from './useBPMEditorSelection';
import { useBPMEditorView } from './useBPMEditorView';
import { useBPMDiagramLoader } from './useBPMDiagramLoader';
import { initialNodes } from '../bpm-editor-constants';
import type { TranslateFn } from './bpm-editor-hook-types';

export interface UseBPMEditorParams {
  diagramId: string;
  subProcess: string;
  workingYear: string;
  currentGL?: string;
  bpmProcessId?: string;
  t: TranslateFn;
}

export function useBPMEditor({ diagramId, subProcess, workingYear, currentGL, bpmProcessId, t }: UseBPMEditorParams) {
  const { setDirty, resetDirty } = useUnsavedChangesContext();

  const graph = useBPMDiagram({ maxHistory: 30 });
  const view = useBPMEditorView();

  const localizedInitialNodes = useMemo(
    () => [
      { ...initialNodes[0], data: { ...initialNodes[0]?.data, label: t('bpm:editor.nodes.start') } },
      { id: '2', type: 'end', position: { x: 250, y: 500 }, data: { label: t('bpm:editor.nodes.end'), type: 'end' } },
    ],
    [t],
  );

  const state = useBPMEditorState({
    diagramId,
    subProcess,
    workingYear,
    currentGL,
    bpmProcessId,
    nodes: graph.nodes,
    edges: graph.edges,
    localizedInitialNodes,
    isExporting: view.isExporting,
    t,
  });

  useUnsavedChanges(state.isDirty || view.isExporting);

  const history = useBPMEditorHistory({
    nodes: graph.nodes,
    edges: graph.edges,
    setNodes: graph.setNodes,
    setEdges: graph.setEdges,
    pushState: graph.pushState,
    setDirty,
    canUndo: graph.canUndo,
    canRedo: graph.canRedo,
    executeUndo: graph.undoDiagram,
    executeRedo: graph.redoDiagram,
    rfInstance: view.rfInstance,
    t,
  });

  const selection = useBPMEditorSelection({
    nodes: graph.nodes,
    edges: graph.edges,
    setNodes: graph.setNodes,
    setEdges: graph.setEdges,
    pushState: graph.pushState,
    setDirty,
    isLocked: state.isLocked,
  });

  const ops = useBPMNodeOperations({
    isLocked: state.isLocked,
    setNodes: graph.setNodes,
    edges: graph.edges,
    setDirty,
    pushState: graph.pushState,
    t,
  });

  const guides = useBPMCanvasDragGuides({
    isLocked: state.isLocked,
    nodes: graph.nodes,
    setNodes: graph.setNodes,
    edges: graph.edges,
    pushState: graph.pushState,
    setDirty,
  });

  const sheets = useBPMSheets({
    diagram: state.diagram,
    nodes: graph.nodes,
    edges: graph.edges,
    setNodes: graph.setNodes,
    setEdges: graph.setEdges,
    defaultStartNodeLabel: t('bpm:editor.nodes.start'),
    defaultSheetLabel: 'Sheet 1',
  });

  const handlers = useBPMCanvasHandlers({
    isLocked: state.isLocked,
    rfInstance: view.rfInstance,
    nodes: graph.nodes,
    edges: graph.edges,
    setNodes: graph.setNodes,
    setEdges: graph.setEdges,
    pushState: graph.pushState,
    setDirty,
    toggleNodeLock: ops.toggleNodeLock,
    updateNodeData: ops.updateNodeData,
    handleSwimlaneResizeEnd: ops.handleSwimlaneResizeEnd,
    onImportMultipleSheets: sheets.importMultipleSheets,
    t,
  });

  useBPMDiagramLoader({
    diagram: state.diagram,
    diagramId,
    currentGL,
    isLocked: state.isLocked,
    localizedInitialNodes,
    setNodes: graph.setNodes,
    setEdges: graph.setEdges,
    toggleNodeLock: ops.toggleNodeLock,
    updateNodeData: ops.updateNodeData,
    handleSwimlaneResizeEnd: ops.handleSwimlaneResizeEnd,
  });

  const persistence = useBPMEditorPersistence({
    diagramId,
    subProcess,
    workingYear,
    diagramYear: state.diagram?.year,
    diagramMetadata: state.diagram?.metadata,
    nodes: graph.nodes,
    edges: graph.edges,
    sheets: sheets.sheets,
    activeSheetId: sheets.activeSheetId,
    selectedGLs: state.selectedGLs,
    signatures: state.signatures,
    globalScale: state.globalScale,
    rfInstance: view.rfInstance,
    diagram: state.diagram,
    setIsExporting: view.setIsExporting,
    resetDirty,
    t,
  });

  const handleNodesDelete = React.useCallback(
    (deleted: import('reactflow').Node[]) => {
      handlers.onNodesDelete(deleted);
      selection.syncSelectionAfterDelete(new Set(deleted.map((d) => d.id)));
    },
    [handlers, selection],
  );

  const suggestionGlDesc = useMemo(() => {
    const found = state.glOptions.find((o) => o.value === currentGL);
    const parts = (found?.label || '').split('•');
    const desc = parts.length > 1 ? parts.slice(1).join('•').trim() : '';
    return desc && desc !== 'No Description' ? desc : '';
  }, [state.glOptions, currentGL]);

  return { graph, state, view, history, selection, ops, guides, sheets, handlers, persistence, handleNodesDelete, suggestionGlDesc, setDirty };
}

export type BPMEditorModel = ReturnType<typeof useBPMEditor>;
