import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Edge, Node } from 'reactflow';
import { api } from '@/lib/api-client';
import { exportBpmToPdf } from '../utils/export-bpm-pdf';
import { sanitizeEdgesForSave, sanitizeNodesForSave } from '../utils/sanitize-bpm-nodes';
import type { TranslateFn } from './bpm-editor-hook-types';

export interface BpmSavePayload {
  nodes: ReturnType<typeof sanitizeNodesForSave>;
  edges: ReturnType<typeof sanitizeEdgesForSave>;
  name: string;
  subProcess: string;
  year: number;
  noGLs: string[];
  metadata: {
    signatures: Record<string, string>;
    globalScale: number;
  };
}

interface UseBPMEditorPersistenceParams {
  diagramId: string;
  subProcess: string;
  workingYear: string;
  diagramYear?: number;
  diagramMetadata?: Record<string, unknown>;
  nodes: Node[];
  edges: Edge[];
  selectedGLs: string[];
  signatures: Record<string, string>;
  globalScale: number;
  rfInstance: { fitView?: unknown } | null;
  diagram: { fsliName?: string } | null | undefined;
  setIsExporting: (v: boolean) => void;
  resetDirty: () => void;
  t: TranslateFn;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message || fallback : fallback;
}

export function useBPMEditorPersistence({
  diagramId,
  subProcess,
  workingYear,
  diagramYear,
  diagramMetadata,
  nodes,
  edges,
  selectedGLs,
  signatures,
  globalScale,
  rfInstance,
  diagram,
  setIsExporting,
  resetDirty,
  t,
}: UseBPMEditorPersistenceParams) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data: BpmSavePayload) => api(`/api/bpm-diagrams/${diagramId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success(t('common:notifications.success'));
      resetDirty();
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, t('common:notifications.error', { defaultValue: 'Failed to save diagram changes' })));
    },
  });

  const logExportMutation = useMutation({
    mutationFn: (filename: string) =>
      api('/api/bpm-exports', {
        method: 'POST',
        body: JSON.stringify({ diagramId, filename }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-exports'] });
    },
  });

  const buildPayload = React.useCallback((): BpmSavePayload => {
    return {
      nodes: sanitizeNodesForSave(nodes),
      edges: sanitizeEdgesForSave(edges),
      name: subProcess,
      subProcess,
      year: diagramYear || parseInt(workingYear),
      noGLs: selectedGLs,
      metadata: { ...diagramMetadata, signatures, globalScale },
    };
  }, [nodes, edges, subProcess, diagramYear, workingYear, selectedGLs, diagramMetadata, signatures, globalScale]);

  const handleSave = React.useCallback(() => {
    saveMutation.mutate(buildPayload());
  }, [saveMutation, buildPayload]);

  const exportToImage = React.useCallback(() => {
    return exportBpmToPdf({
      rfInstance,
      subProcess,
      diagram,
      diagramId,
      t,
      onStart: () => setIsExporting(true),
      onFinish: () => setIsExporting(false),
      onLogExport: (filename: string) => logExportMutation.mutateAsync(filename),
    });
  }, [rfInstance, subProcess, diagram, diagramId, t, setIsExporting, logExportMutation]);

  return { saveMutation, handleSave, exportToImage };
}
