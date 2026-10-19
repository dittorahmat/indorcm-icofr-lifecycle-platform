import { useCallback, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { BPMDiagram } from '@shared/types';
import { useWorksheetControlUpdate } from './use-worksheet-control-update';
import type { WorksheetRowCommit, WorksheetTextField } from './worksheet-row';

interface UseWorksheetRowCommitArgs {
  diagrams?: { items: BPMDiagram[] };
  /** Routed by the worksheet so this hook owns no URL state. */
  onOpenDiagram: (diagramId: string, subProcess: string) => void;
}

/**
 * The worksheet row's whole write surface: the debounced field commit, the
 * immediate patch, row deletion, and the row's flow (open, or create first).
 *
 * One seam for the four mutations the column factory used to be handed
 * separately — it takes the commit handle instead.
 */
export function useWorksheetRowCommit({
  diagrams,
  onOpenDiagram,
}: UseWorksheetRowCommitArgs): WorksheetRowCommit {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bpm', 'common']);
  const updateMutation = useWorksheetControlUpdate();

  const createDiagramMutation = useMutation({
    mutationFn: (subProcess: string) =>
      api<{ id: string }>('/api/bpm-diagrams', {
        method: 'POST',
        body: JSON.stringify({ name: subProcess, subProcess }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
      onOpenDiagram(data.id, variables);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t('worksheet.createFlowFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/controls/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
      toast.success(t('common:notifications.deleted'));
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t('worksheet.deleteFailed'));
    },
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveField = useCallback(
    (id: string, field: WorksheetTextField, value: string | string[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        updateMutation.mutate({ id, data: { [field]: value } });
      }, 500);
    },
    [updateMutation],
  );

  return useMemo(
    () => ({
      saveField,
      patch: (id, patch) => updateMutation.mutate({ id, data: patch }),
      remove: (id) => deleteMutation.mutate(id),
      openDiagramFor: (subProcess) => {
        const existing = diagrams?.items.find((diagram) => diagram.subProcess === subProcess);
        if (existing) {
          onOpenDiagram(existing.id, subProcess);
        } else if (subProcess.trim()) {
          createDiagramMutation.mutate(subProcess);
        } else {
          toast.error(t('worksheet.subProcessRequired'));
        }
      },
    }),
    [saveField, updateMutation, deleteMutation, diagrams, onOpenDiagram, createDiagramMutation, t],
  );
}
