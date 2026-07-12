import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { MaterialitySimulation, ApiResponse, GLSnapshot } from '@shared/types';
import { toast } from 'sonner';

export function useSimulations(year?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['simulations', year],
    queryFn: () => api<{ items: MaterialitySimulation[] }>(`/api/simulations${year ? `?year=${year}` : ''}`)
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<MaterialitySimulation>) => api<MaterialitySimulation>('/api/simulations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success('Simulation created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<MaterialitySimulation> }) => api<ApiResponse>(`/api/simulations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success('Simulation saved');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<ApiResponse>(`/api/simulations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success('Simulation deleted');
    }
  });

  return {
    simulations: query.data?.items || [],
    isLoading: query.isLoading,
    createSimulation: createMutation.mutateAsync,
    updateSimulation: updateMutation.mutateAsync,
    deleteSimulation: deleteMutation.mutateAsync
  };
}

export function useSimulation(id?: string) {
  return useQuery({
    queryKey: ['simulation', id],
    queryFn: () => api<MaterialitySimulation>(`/api/simulations/${id}`),
    enabled: !!id
  });
}

export function useGLSnapshots(year?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['gl-snapshots', year],
    queryFn: () => api<{ items: GLSnapshot[] }>(`/api/gl-snapshots${year ? `?year=${year}` : ''}`)
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { filename: string, rows: any[], year?: number }) => api<{ id: string }>('/api/gl-snapshots', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        year: data.year ?? year
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      toast.success('GL Snapshot uploaded');
    }
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => api<ApiResponse>(`/api/gl-snapshots/${id}/set-active`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      toast.success('Active snapshot updated');
    }
  });

  return {
    snapshots: query.data?.items || [],
    isLoading: query.isLoading,
    uploadSnapshot: uploadMutation.mutateAsync,
    setActiveSnapshot: setActiveMutation.mutateAsync
  };
}
