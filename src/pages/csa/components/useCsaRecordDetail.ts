import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CSARecord } from '@shared/types';
import { useTOD } from '@/hooks/use-tod';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import {
  csaMatrixKey,
  csaRecordDetailKey,
  csaWorklistKey,
  dedupeMatrixControls,
  findTodEvaluation,
  resolveWorkflowStatus,
  type MatrixControl,
  type TodFormValues,
  buildRcmPayload,
  buildTodPayload,
} from './csa-record-detail';

interface UseCsaRecordDetailArgs {
  recordId: string;
  bpmProcessId?: string | null;
  isExpanded: boolean;
}

/** Shared orchestration behind the CSA assessed row and card adapters. */
export function useCsaRecordDetail({ recordId, bpmProcessId, isExpanded }: UseCsaRecordDetailArgs) {
  const { workingYear } = useFiscalYearStore();
  const queryClient = useQueryClient();
  const { evaluations, saveMutation } = useTOD(recordId);

  const { data: fullRecord, isLoading: isRecordLoading } = useQuery({
    queryKey: csaRecordDetailKey(recordId),
    queryFn: () => api<CSARecord>(`/api/csa/${recordId}`),
    enabled: isExpanded,
  });

  const { data: matrixData } = useQuery({
    queryKey: csaMatrixKey(bpmProcessId ?? '', workingYear),
    queryFn: () =>
      api<{ items: MatrixControl[] }>(`/api/rcm-matrix/tlc?bpmProcessId=${bpmProcessId}&year=${workingYear}`),
    enabled: isExpanded && !!bpmProcessId,
  });

  const controls = React.useMemo(
    () => dedupeMatrixControls(matrixData?.items ?? []),
    [matrixData?.items],
  );

  const applyWorkflowStatus = React.useCallback(
    (id: string, newStatus: string) => {
      queryClient.setQueryData<CSARecord>(csaRecordDetailKey(id), (old) =>
        old ? { ...old, workflowStatus: newStatus } : old,
      );
    },
    [queryClient],
  );

  const saveDual = React.useCallback(
    async (control: MatrixControl, values: TodFormValues) => {
      await Promise.all([
        api('/api/rcm-matrix/tlc/batch-update', {
          method: 'POST',
          body: JSON.stringify({ items: [buildRcmPayload(control.mappingId, values)] }),
        }),
        saveMutation.mutateAsync(buildTodPayload(control.controlId, values)),
      ]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tod-evaluations', recordId] }),
        queryClient.invalidateQueries({ queryKey: csaRecordDetailKey(recordId) }),
        queryClient.invalidateQueries({ queryKey: csaWorklistKey(workingYear) }),
      ]);
    },
    [queryClient, recordId, saveMutation, workingYear],
  );

  return {
    workingYear,
    evaluations,
    saveMutation,
    fullRecord,
    isRecordLoading,
    controls,
    applyWorkflowStatus,
    saveDual,
    resolveWorkflowStatus,
    findTodEvaluation,
  };
}
