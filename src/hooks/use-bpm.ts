import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { BPMProcess, BPMDiagram, AccountAssertion, MaterialitySimulation, GLSnapshot } from '@shared/types';
import { toast } from 'sonner';

export function useBpmProcesses(noGL?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bpm-processes', noGL],
    queryFn: () => api<{ items: BPMProcess[] }>(`/api/bpm-processes${noGL ? `?noGL=${noGL}` : ''}`),
    enabled: noGL !== undefined
  });

  const createBPMMutation = useMutation({
    mutationFn: (data: Partial<BPMProcess>) => api('/api/bpm-processes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
    }
  });

  const deleteBPMMutation = useMutation({
    mutationFn: (id: string) => api(`/api/bpm-processes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
    }
  });

  return {
    processes: query.data?.items || [],
    isLoading: query.isLoading,
    createProcess: createBPMMutation,
    deleteProcess: deleteBPMMutation
  };
}

export function useBpmDiagrams(year: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bpm-diagrams', year],
    queryFn: () => api<{ items: BPMDiagram[] }>(`/api/bpm-diagrams?year=${year}`)
  });

  const createDiagramMutation = useMutation({
    mutationFn: (data: { name: string, subProcess: string, year: number }) => 
      api<{ id: string }>('/api/bpm-diagrams', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
    }
  });

  return {
    diagrams: query.data?.items || [],
    isLoading: query.isLoading,
    createDiagram: createDiagramMutation
  };
}

export function useAccountAssertions(selectedFsli?: string, noGL?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['account-assertions', selectedFsli, noGL],
    queryFn: async () => {
      if (!selectedFsli || !noGL) return null;
      return api<AccountAssertion>(`/api/account-assertions?fsliName=${encodeURIComponent(selectedFsli)}&noGL=${encodeURIComponent(noGL)}`);
    },
    enabled: !!selectedFsli && !!noGL
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AccountAssertion> & { fsliName: string, noGL: string }) => api('/api/account-assertions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-assertions'] });
    }
  });

  return {
    assertion: query.data,
    isLoading: query.isLoading,
    updateAssertion: updateMutation
  };
}

export function useActiveSnapshot() {
  return useQuery({
    queryKey: ['gl-snapshots-active'],
    queryFn: async () => {
      const list = await api<{ items: GLSnapshot[] }>('/api/gl-snapshots');
      const active = list.items.find(s => s.isActive);
      if (!active) return null;
      return api<GLSnapshot>(`/api/gl-snapshots/${active.id}`);
    }
  });
}

export function useSimulationSnapshot(snapshotId?: string | null) {
  return useQuery({
    queryKey: ['gl-snapshot', snapshotId],
    queryFn: async () => {
      if (!snapshotId) {
        // Fallback to active snapshot if no snapshotId is provided (legacy data)
        const list = await api<{ items: GLSnapshot[] }>('/api/gl-snapshots');
        const active = list.items.find(s => s.isActive);
        if (!active) return null;
        return api<GLSnapshot>(`/api/gl-snapshots/${active.id}`);
      }
      // Fetch specific snapshot
      return api<GLSnapshot>(`/api/gl-snapshots/${snapshotId}`);
    },
    enabled: snapshotId !== undefined // Allow null to trigger the fallback logic
  });
}

export function useActiveSimulation(year: string) {
  return useQuery({
    queryKey: ['active-simulation', year],
    queryFn: async () => {
      const list = await api<{ items: MaterialitySimulation[] }>(`/api/simulations?year=${year}`);
      if (list.items.length === 0) return null;

      const approved = [...list.items]
        .filter(s => s.status === 'Approved')
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
      
      if (approved) return approved;

      return [...list.items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
    }
  });
}
