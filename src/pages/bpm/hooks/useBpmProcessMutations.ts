import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { BPMProcess } from '@shared/types';

interface UseBpmProcessMutationsArgs {
  viewYear: string;
  bpmProcesses?: { items: BPMProcess[] };
  /** Routed by the page so this hook owns no URL state. */
  onOpenDiagram: (diagramId: string, subProcess: string, bpmProcessId?: string) => void;
  onDeleteSuccess: (id: string) => void;
  onReorganizeSuccess: () => void;
}

/**
 * Every BPM mutation the page fires — diagram creation, process create/delete,
 * batch reorganize — plus the create-process dialog's draft state and the fuzzy
 * process-code suggestion. Invalidation and success toasts live here so callers
 * cannot drift on them.
 */
export function useBpmProcessMutations({
  viewYear,
  bpmProcesses,
  onOpenDiagram,
  onDeleteSuccess,
  onReorganizeSuccess,
}: UseBpmProcessMutationsArgs) {
  const { t } = useTranslation(['bpm', 'common']);
  const queryClient = useQueryClient();

  const [isCreatingBPM, setIsCreatingBPM] = React.useState(false);
  const [bpmName, setBpmName] = React.useState('');
  const [bpmCode, setBpmCode] = React.useState('');

  const createDiagramMutation = useMutation({
    mutationFn: (subProcess: string) =>
      api<{ id: string }>('/api/bpm-diagrams', {
        method: 'POST',
        body: JSON.stringify({ name: subProcess, subProcess, year: parseInt(viewYear) }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
      onOpenDiagram(data.id, variables);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('createDiagramFailed'));
    },
  });

  const createBPMMutation = useMutation({
    mutationFn: (data: Partial<BPMProcess>) =>
      api('/api/bpm-processes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      setIsCreatingBPM(false);
      setBpmName('');
      setBpmCode('');
      toast.success(t('common:notifications.created'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('createProcessFailed'));
    },
  });

  const deleteBPMMutation = useMutation({
    mutationFn: (id: string) => api(`/api/bpm-processes/${id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      onDeleteSuccess(variables);
      toast.success(t('common:notifications.deleted'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('deleteProcessFailed'));
    },
  });

  const batchReorganizeMutation = useMutation({
    mutationFn: (payload: { action: 'demote' | 'promote'; targetParentId?: string; processIds: string[] }) =>
      api('/api/bpm-processes/batch-reorganize', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      onReorganizeSuccess();
      toast.success(
        variables.action === 'demote'
          ? t('bpm:migration.demoteSuccess', 'Sub-proses berhasil dikelompokkan ke proses induk')
          : t('bpm:migration.promoteSuccess', 'Sub-proses berhasil diangkat menjadi proses mandiri'),
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || t('bpm:migration.error', 'Gagal memproses reorganisasi proses'));
    },
  });

  /** Suggests the process code from an existing process once the name is typed. */
  const setBpmNameWithFuzzyCode = (name: string) => {
    setBpmName(name);
    if (!bpmProcesses?.items) return;

    const searchStr = name.toLowerCase();
    const exactMatch = bpmProcesses.items.find((p) => p.name.toLowerCase() === searchStr);
    if (exactMatch?.bpmCode) {
      setBpmCode(exactMatch.bpmCode);
      return;
    }

    const words = searchStr.split(' ').filter((w) => w.length >= 3);
    if (words.length > 0) {
      const similar = bpmProcesses.items.find((p) => p.bpmCode && words.some((w) => p.name.toLowerCase().includes(w)));
      if (similar?.bpmCode) setBpmCode(similar.bpmCode);
    }
  };

  return {
    isCreatingBPM,
    setIsCreatingBPM,
    bpmName,
    setBpmName: setBpmNameWithFuzzyCode,
    bpmCode,
    setBpmCode,
    createDiagramMutation,
    createBPMMutation,
    deleteBPMMutation,
    batchReorganizeMutation,
  };
}
