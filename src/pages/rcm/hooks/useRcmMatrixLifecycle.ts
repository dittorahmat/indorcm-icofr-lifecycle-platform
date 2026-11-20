import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ASSERTION_FIELDS, IPO_FIELDS } from '@shared/assertion-fields';

export type RcmTier = 'TLC' | 'ELC' | 'ITGC';

export interface UseRcmMatrixLifecycleOptions {
  tier: RcmTier;
  workingYear: string;
  filterBpmId?: string;
  noGLFilter?: string;
}

export function useRcmMatrixLifecycle<T = Record<string, unknown>>({
  tier,
  workingYear,
  filterBpmId,
  noGLFilter,
}: UseRcmMatrixLifecycleOptions) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<T | null>(null);
  const [isRolloverOpen, setIsRolloverOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

  const queryKey = React.useMemo(() => {
    switch (tier) {
      case 'TLC':
        return ['rcm-matrix-tlc', filterBpmId, workingYear, noGLFilter];
      case 'ELC':
        return ['controls-elc', workingYear];
      case 'ITGC':
        return ['rcm-matrix-itgc', filterBpmId, workingYear];
    }
  }, [tier, filterBpmId, workingYear, noGLFilter]);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (tier === 'TLC') {
        let url = `/api/rcm-matrix/tlc?year=${workingYear}`;
        if (filterBpmId) url += `&bpmProcessId=${filterBpmId}`;
        if (noGLFilter) url += `&noGL=${noGLFilter}`;
        return api<{ items: T[] }>(url);
      }
      if (tier === 'ELC') {
        return api<{ items: T[] }>(`/api/controls?level=ELC&year=${workingYear}`);
      }
      // ITGC
      const params = new URLSearchParams();
      if (filterBpmId) params.append('bpmProcessId', filterBpmId);
      if (workingYear) params.append('year', workingYear);
      const queryStr = params.toString();
      const url = queryStr ? `/api/rcm-matrix/itgc?${queryStr}` : '/api/rcm-matrix/itgc';
      return api<{ items: T[] }>(url);
    },
    staleTime: tier === 'ELC' ? 30000 : undefined,
  });

  const rolloverMutation = useMutation({
    mutationFn: (rolloverData: { sourceYear: string; targetYear: string; force?: boolean }) =>
      api('/api/migration/rollover', { method: 'POST', body: JSON.stringify(rolloverData) }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success(t('scoping:rollover.success'));
      setIsRolloverOpen(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error';
      toast.error(t('scoping:rollover.error', { error: message }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (tier === 'ELC') {
        const dbValues = {
          ...values,
          name: values.mappedControlName,
          description: values.mappedControlDescription,
        };
        const targetId = (values.mappingId as string) || (values.id as string);
        return api(`/api/controls/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(dbValues),
        });
      }

      // TLC & ITGC batch update
      const dbValues: Record<string, unknown> = {
        ...values,
        controlName: values.mappedControlName,
        controlDescription: values.mappedControlDescription,
      };

      const booleanFields = [...IPO_FIELDS, ...ASSERTION_FIELDS];
      booleanFields.forEach((field) => {
        if (typeof values[field] === 'boolean') {
          dbValues[field] = values[field] ? 'Y' : 'N';
        }
      });

      const endpoint = tier === 'TLC' ? '/api/rcm-matrix/tlc/batch-update' : '/api/rcm-matrix/itgc/batch-update';
      return api(endpoint, {
        method: 'POST',
        body: JSON.stringify({ items: [dbValues] }),
      });
    },
    onSuccess: () => {
      toast.success(t('rcm:matrix.save_success'));
      queryClient.invalidateQueries({ queryKey });
      setEditingItem(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.error(message);
    },
  });

  const refresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    searchTerm,
    setSearchTerm,
    editingItem,
    setEditingItem,
    isRolloverOpen,
    setIsRolloverOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    data,
    isLoading,
    refresh,
    queryClient,
    queryKey,
    saveMutation,
    rolloverMutation,
  };
}
