import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import type { 
  MaterialitySimulation, GLRow, GLSnapshot, QualitativeLevel, Department, Application, SignificantAccount 
} from '@shared/types';
import { 
  getGroupMultiplier, 
  calculateBenchmarkValue, 
  calculateOM, 
  calculatePM, 
  identifySignificantAccounts 
} from '../services/materiality-calc';

export function useScopingPage() {
  const { t } = useTranslation(['scoping', 'common']);
  const { setDirty, resetDirty } = useUnsavedChangesContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSimId = searchParams.get('id');

  const [filterYear, setFilterYear] = React.useState<string>("2025");
  const [isCreating, setIsCreating] = React.useState(false);
  const [benchmarkModalSnap, setBenchmarkModalSnap] = React.useState<GLSnapshot | null>(null);

  // Reset dirty state on mount/unmount for the main page
  React.useEffect(() => {
    if (!selectedSimId) resetDirty();
    return () => resetDirty();
  }, [selectedSimId, resetDirty]);

  // Queries
  const { data: simulations, isLoading: simLoading } = useQuery({
    queryKey: ['simulations', filterYear],
    queryFn: () => api<{ items: MaterialitySimulation[] }>(`/api/simulations?year=${filterYear}`),
  });

  const { data: snapshots, isLoading: snapsLoading } = useQuery({
    queryKey: ['gl-snapshots'],
    queryFn: () => api<{ items: GLSnapshot[] }>('/api/gl-snapshots'),
  });

  const activeSnapshot = snapshots?.items.find(s => s.isActive);

  // Mutations
  const createSimMutation = useMutation({
    mutationFn: (data: Partial<MaterialitySimulation>) => api<MaterialitySimulation>('/api/simulations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (newSim) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setSearchParams({ id: newSim.id });
      setIsCreating(false);
      toast.success(t('common:notifications.created'));
    }
  });

  const deleteSimMutation = useMutation({
    mutationFn: (id: string) => api(`/api/simulations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success(t('common:notifications.deleted'));
    }
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => api(`/api/gl-snapshots/${id}/set-active`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      toast.success(t('common:notifications.updated'));
    }
  });

  const deleteSnapMutation = useMutation({
    mutationFn: (id: string) => api(`/api/gl-snapshots/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      toast.success(t('common:notifications.deleted'));
    }
  });

  const uploadSnapMutation = useMutation({
    mutationFn: (data: { filename: string, rows: GLRow[] }) => api<GLSnapshot>('/api/gl-snapshots', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (snap) => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      setBenchmarkModalSnap(snap);
      toast.success(t('common:notifications.success'));
    }
  });

  return {
    selectedSimId,
    setSearchParams,
    filterYear,
    setFilterYear,
    isCreating,
    setIsCreating,
    benchmarkModalSnap,
    setBenchmarkModalSnap,
    simulations: simulations?.items || [],
    snapshots: snapshots?.items || [],
    activeSnapshot,
    isLoading: simLoading || snapsLoading,
    mutations: {
      createSim: createSimMutation,
      deleteSim: deleteSimMutation,
      setActiveSnap: setActiveMutation,
      deleteSnap: deleteSnapMutation,
      uploadSnap: uploadSnapMutation
    }
  };
}

export function useScopingEditor(initialSimulation: MaterialitySimulation) {
  const { t } = useTranslation(['scoping', 'common']);
  const { setDirty, resetDirty } = useUnsavedChangesContext();
  const queryClient = useQueryClient();
  const [simState, setSimState] = React.useState(initialSimulation);
  const [glData, setGlData] = React.useState<GLRow[]>([]);
  const [localAppMappings, setLocalAppMappings] = React.useState<Record<string, string[]>>({});
  const [localDeptMappings, setLocalDeptMappings] = React.useState<Record<string, string[]>>({});

  // Sync state with prop
  React.useEffect(() => {
    setSimState(initialSimulation);
  }, [initialSimulation]);

  // Queries
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ items: Department[] }>('/api/departments'),
  });

  const { data: appsData } = useQuery({
    queryKey: ['applications-all'],
    queryFn: () => api<{ items: (Application & { linkedControlCount?: number })[] }>('/api/applications'),
  });

  const { data: initialMappings } = useQuery({
    queryKey: ['sim-app-mappings', initialSimulation.id],
    queryFn: () => api<{ items: any[] }>(`/api/simulations/${initialSimulation.id}/account-applications`),
    enabled: !!initialSimulation.id
  });

  const { data: snapshot } = useQuery({
    queryKey: ['gl-snapshot', simState.glSnapshotId],
    queryFn: () => api<GLSnapshot>(`/api/gl-snapshots/${simState.glSnapshotId}`),
    enabled: !!simState.glSnapshotId
  });

  // Effects
  React.useEffect(() => {
    if (snapshot) setGlData(snapshot.rows);
  }, [snapshot]);

  React.useEffect(() => {
    if (initialMappings?.items) {
      const map: Record<string, string[]> = {};
      initialMappings.items.forEach(m => {
        if (!map[m.accountCode]) map[m.accountCode] = [];
        map[m.accountCode].push(m.applicationId);
      });
      setLocalAppMappings(map);
    }
  }, [initialMappings]);

  React.useEffect(() => {
    if (initialSimulation.significantAccounts) {
      const map: Record<string, string[]> = {};
      initialSimulation.significantAccounts.forEach(sa => {
        if (sa.fsliCode && sa.assignedDepartmentIds) {
          map[sa.fsliCode] = sa.assignedDepartmentIds;
        }
      });
      setLocalDeptMappings(map);
    }
  }, [initialSimulation]);

  // Calculations
  const calculateValues = React.useMemo(() => {
    if (glData.length === 0 || !snapshot) return { omValue: 0, pmValue: 0, multiplier: 1, benchmarkValue: 0 };
    const benchmarkValue = calculateBenchmarkValue(glData, simState.basis);
    const multiplier = getGroupMultiplier(simState.locationCount || 1);
    const omValue = calculateOM(benchmarkValue, simState.omPercentage, multiplier);
    const pmValue = calculatePM(omValue, simState.haircutPercentage);
    return { omValue, pmValue, multiplier, benchmarkValue };
  }, [glData, snapshot, simState.basis, simState.omPercentage, simState.haircutPercentage, simState.locationCount]);

  const { omValue, pmValue, multiplier, benchmarkValue } = calculateValues;

  const mergedGlData = React.useMemo(() => {
    return glData.map(row => ({
      ...row,
      assignedDepartmentIds: localDeptMappings[row.noGL] || []
    }));
  }, [glData, localDeptMappings]);

  const significantAccounts = React.useMemo(() => {
    return identifySignificantAccounts({
      glData: mergedGlData,
      pmValue,
      assessmentData: simState.assessmentData
    });
  }, [mergedGlData, simState.assessmentData, pmValue]);

  // Dirty state tracking
  const isDirty = React.useMemo(() => {
    const initialDeptMappings: Record<string, string[]> = {};
    initialSimulation.significantAccounts?.forEach(sa => {
      if (sa.fsliCode && sa.assignedDepartmentIds) {
        initialDeptMappings[sa.fsliCode] = sa.assignedDepartmentIds;
      }
    });

    const currentState = {
      assessmentData: simState.assessmentData,
      locationCount: simState.locationCount,
      omPercentage: simState.omPercentage,
      haircutPercentage: simState.haircutPercentage,
      basis: simState.basis,
      appMappings: localAppMappings,
      deptMappings: localDeptMappings
    };

    const originalState = {
      assessmentData: initialSimulation.assessmentData,
      locationCount: initialSimulation.locationCount,
      omPercentage: initialSimulation.omPercentage,
      haircutPercentage: initialSimulation.haircutPercentage,
      basis: initialSimulation.basis,
      appMappings: {}, // App mappings are fetched separately, simplification
      deptMappings: initialDeptMappings
    };

    return JSON.stringify(currentState) !== JSON.stringify(originalState);
  }, [simState, localAppMappings, localDeptMappings, initialSimulation]);

  React.useEffect(() => {
    setDirty(isDirty);
    return () => resetDirty();
  }, [isDirty, setDirty, resetDirty]);

  // Mutations
  const updateSimMutation = useMutation({
    mutationFn: async (data: Partial<MaterialitySimulation>) => {
      await api(`/api/simulations/${simState.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ ...data, omValue, pmValue, significantAccounts }) 
      });

      const appMappings = Object.entries(localAppMappings).map(([accountCode, applicationIds]) => ({
        accountCode, applicationIds
      }));
      await api(`/api/simulations/${simState.id}/account-applications/sync`, {
        method: 'POST', body: JSON.stringify({ mappings: appMappings })
      });

      const deptMappingsToSync = Object.entries(localDeptMappings).map(([noGL, departmentIds]) => ({
        noGL, departmentIds
      }));
      await api(`/api/simulations/${simState.id}/account-departments/sync`, {
        method: 'POST', body: JSON.stringify({ mappings: deptMappingsToSync })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      resetDirty();
      toast.success(t('common:notifications.saved'));
    }
  });

  const submitSimMutation = useMutation({
    mutationFn: () => 
      api<MaterialitySimulation>(`/api/simulations/${simState.id}/submit`, { 
        method: 'POST',
        body: JSON.stringify({ ...simState, omValue, pmValue, significantAccounts })
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries();
      setSimState(updated);
      toast.success("Simulation submitted for approval");
    }
  });

  return {
    simState,
    setSimState,
    mergedGlData,
    omValue,
    pmValue,
    multiplier,
    benchmarkValue,
    departments: departments?.items || [],
    applications: appsData?.items || [],
    localAppMappings,
    localDeptMappings,
    isDirty,
    isLocked: simState.status === 'Approved' || simState.status === 'Pending CFO' || simState.status === 'Pending Komut',
    mutations: {
      save: updateSimMutation,
      submit: submitSimMutation
    },
    handlers: {
      onAssignDepartments: (accountName: string, departmentIds: string[]) => {
        setLocalDeptMappings(prev => ({ ...prev, [accountName]: departmentIds }));
      },
      onAppsChange: (accountCode: string, appIds: string[]) => {
        setLocalAppMappings(prev => ({ ...prev, [accountCode]: appIds }));
      },
      onAssessmentChange: (fsliName: string, ruleId: number, level: QualitativeLevel) => {
        setSimState(prev => {
          const currentData = prev.assessmentData || {};
          const fsliData = currentData[fsliName] || {};
          return { ...prev, assessmentData: { ...currentData, [fsliName]: { ...fsliData, [ruleId]: level } } };
        });
      }
    }
  };
}
