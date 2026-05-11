import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Control, ApiResponse } from '@shared/types';
import { toast } from 'sonner';

export function useControls(level?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['controls', level],
    queryFn: () => api<{ items: Control[] }>(`/api/controls${level ? `?level=${level}` : ''}`)
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Control>) => api<Control>('/api/controls', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      toast.success('Control created successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to create control')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Control> }) => api<ApiResponse>(`/api/controls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      toast.success('Control updated successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update control')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<ApiResponse>(`/api/controls/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      toast.success('Control deleted successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to delete control')
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api<ApiResponse>(`/api/controls/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      toast.success('Control approved');
    }
  });

  return {
    controls: query.data?.items || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createControl: createMutation.mutateAsync,
    updateControl: updateMutation.mutateAsync,
    deleteControl: deleteMutation.mutateAsync,
    approveControl: approveMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || approveMutation.isPending
  };
}

export function useControl(id?: string) {
  return useQuery({
    queryKey: ['control', id],
    queryFn: () => api<Control>(`/api/controls/${id}`),
    enabled: !!id
  });
}
