import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CSAWorklistItem, CSAWorklistResponse } from '@shared/types';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

export type WorklistTabItem = CSAWorklistItem & { id: string };

export interface WorklistGroup<T = WorklistTabItem> {
  key: string;
  title: string | null;
  items: T[];
}

export type WorklistEmptyKind = 'no-controls' | 'all-assessed';

const UNLINKED_KEY = 'unlinked';

/** Internal seam: groups worklist items per BPM sub-process in first-seen order. */
function groupWorklistByProcessInternal(items: WorklistTabItem[]): WorklistGroup[] {
  const groups = new Map<string, WorklistGroup>();
  for (const item of items) {
    const key = item.bpmProcessId ?? UNLINKED_KEY;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { key, title: item.bpmProcessName, items: [item] });
    }
  }
  return Array.from(groups.values());
}

function classifyWorklistEmptyInternal(hasControlsInYear: boolean): WorklistEmptyKind {
  return hasControlsInYear ? 'all-assessed' : 'no-controls';
}

/**
 * Worklist "Belum Dinilai" CSA hub untuk tahun kerja aktif: control tanpa
 * record CSA non-draft, dikelompokkan per sub-proses BPM. Status dihitung
 * dari keberadaan record (endpoint derive), bukan kolom controls.csa_status.
 */
export function useCsaWorklist(): {
  groups: WorklistGroup[];
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
    const groups = groupWorklistByProcessInternal(
      items.map((item) => ({ ...item, id: item.controlId })),
    );
    const emptyKind =
      !isLoading && items.length === 0
        ? classifyWorklistEmptyInternal((data?.totalControls ?? 0) > 0)
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
