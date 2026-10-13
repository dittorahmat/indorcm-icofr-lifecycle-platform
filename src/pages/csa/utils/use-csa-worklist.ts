import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CSAWorklistItem, CSAWorklistResponse } from '@shared/types';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import {
  classifyWorklistEmpty,
  groupWorklistByProcess,
  type WorklistEmptyKind,
  type WorklistGroup,
} from './csa-worklist-grouping';

export type WorklistTabItem = CSAWorklistItem & { id: string };

/**
 * Worklist "Belum Dinilai" CSA hub untuk tahun kerja aktif: control tanpa
 * record CSA non-draft, dikelompokkan per sub-proses BPM. Status dihitung
 * dari keberadaan record (endpoint derive), bukan kolom controls.csa_status.
 */
export function useCsaWorklist(): {
  groups: WorklistGroup<WorklistTabItem>[];
  emptyKind: WorklistEmptyKind | null;
  total: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { workingYear } = useFiscalYearStore();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['csa-worklist', workingYear],
    queryFn: () => api<CSAWorklistResponse>(`/api/csa/worklist?year=${workingYear}`),
  });

  return useMemo(() => {
    const items = data?.items ?? [];
    const groups = groupWorklistByProcess(
      items.map((item) => ({ ...item, id: item.controlId })),
    );
    const emptyKind =
      !isLoading && items.length === 0
        ? classifyWorklistEmpty((data?.totalControls ?? 0) > 0)
        : null;
    return {
      groups,
      emptyKind,
      total: items.length,
      isLoading,
      isError,
      refetch: () => {
        void refetch();
      },
    };
  }, [data, isLoading, isError, refetch]);
}
