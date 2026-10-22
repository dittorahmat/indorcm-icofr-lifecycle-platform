import * as React from 'react';
import { toast } from 'sonner';
import type { TranslateFn } from './bpm-editor-hook-types';

interface UseBPMEditorHistoryParams {
  setDirty: (dirty: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  executeUndo: () => void;
  executeRedo: () => void;
  t: TranslateFn;
}

export function useBPMEditorHistory({
  setDirty,
  canUndo,
  canRedo,
  executeUndo,
  executeRedo,
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

  return { handleUndo, handleRedo };
}
