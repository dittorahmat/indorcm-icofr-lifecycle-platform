import * as React from 'react';
import { toast } from 'sonner';
import type { Edge, Node } from 'reactflow';
import { autoArrangeBpmDiagram } from '@/utils/bpm-auto-layout';
import type { TranslateFn } from './bpm-editor-hook-types';

interface UseBPMEditorHistoryParams {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  pushState: (nodes: Node[], edges: Edge[]) => void;
  setDirty: (dirty: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  executeUndo: () => void;
  executeRedo: () => void;
  rfInstance: { fitView: (opts: { padding: number; duration?: number }) => void } | null;
  t: TranslateFn;
}

export function useBPMEditorHistory({
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
  rfInstance,
  t,
}: UseBPMEditorHistoryParams) {
  const handleUndo = React.useCallback(() => {
    if (!canUndo) return;
    executeUndo();
    setDirty(true);
    toast.info(t('bpm:editor.toast.undo', { defaultValue: 'Perubahan dibatalkan (Undo)' }));
  }, [canUndo, executeUndo, setDirty, t]);

  const handleRedo = React.useCallback(() => {
    if (!canRedo) return;
    executeRedo();
    setDirty(true);
    toast.info(t('bpm:editor.toast.redo', { defaultValue: 'Perubahan diulang (Redo)' }));
  }, [canRedo, executeRedo, setDirty, t]);

  const handleAutoArrange = React.useCallback(() => {
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
  React.useEffect(() => {
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

  return { handleUndo, handleRedo, handleAutoArrange };
}
