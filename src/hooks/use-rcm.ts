import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { RCM, ApiResponse } from '@shared/types';
import { toast } from 'sonner';

export function useRcm(year?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rcm', year],
    queryFn: () => api<{ items: RCM[] }>(`/api/rcm${year ? `?year=${year}` : ''}`)
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<RCM>) => api<RCM>('/api/rcm', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      toast.success('RCM entry created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<RCM> }) => api<ApiResponse>(`/api/rcm/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      toast.success('RCM updated');
    }
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => api<ApiResponse>(`/api/rcm/${id}/validate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      toast.success('RCM design validated');
    }
  });

  const approveChangeMutation = useMutation({
    mutationFn: (id: string) => api<ApiResponse>(`/api/rcm/${id}/approve-change`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      toast.success('Change request approved');
    }
  });

  return {
    rcm: query.data?.items || [],
    isLoading: query.isLoading,
    createRcm: createMutation.mutateAsync,
    updateRcm: updateMutation.mutateAsync,
    validateRcm: validateMutation.mutateAsync,
    approveChange: approveChangeMutation.mutateAsync
  };
}

export function useRcmMatrix(type: 'tlc' | 'itgc' | 'elc', bpmProcessId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rcm-matrix', type, bpmProcessId],
    queryFn: () => api<{ items: any[] }>(`/api/rcm-matrix/${type}${bpmProcessId ? `?bpmProcessId=${bpmProcessId}` : ''}`)
  });

  const batchUpdateMutation = useMutation({
    mutationFn: (items: any[]) => api<ApiResponse>(`/api/rcm-matrix/${type}/batch-update`, {
      method: 'POST',
      body: JSON.stringify({ items })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rcm-matrix', type] });
      toast.success('Matrix updated successfully');
    }
  });

  return {
    items: query.data?.items || [],
    isLoading: query.isLoading,
    batchUpdate: batchUpdateMutation.mutateAsync,
    isUpdating: batchUpdateMutation.isPending
  };
}
