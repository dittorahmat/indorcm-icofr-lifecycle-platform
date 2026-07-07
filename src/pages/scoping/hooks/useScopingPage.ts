import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import type { 
  MaterialitySimulation, GLRow, GLSnapshot, QualitativeLevel, Department, Application, SignificantAccount 
} from '@shared/types';
import { 
  getGroupMultiplier, 
  calculateBenchmarkValue, 
  calculateOM, 
  calculatePM, 
  identifySignificantAccounts,
  calculateScopingCompliance,
  getRowScopeClassification
} from '../services/materiality-calc';
import { buildEntityHierarchy, calculateRollupBalances } from '../utils/hierarchy-utils';

export function useScopingPage() {
  const { t } = useTranslation(['scoping', 'common']);
  const { setDirty, resetDirty } = useUnsavedChangesContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSimId = searchParams.get('id');
  const { workingYear } = useFiscalYearStore();

  const filterYear = workingYear;
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
    queryKey: ['gl-snapshots', filterYear],
    queryFn: () => api<{ items: GLSnapshot[] }>(`/api/gl-snapshots?year=${filterYear}`),
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

  const rolloverMutation = useMutation({
    mutationFn: (data: { sourceYear: string, targetYear: string, force?: boolean }) => 
      api('/api/migration/rollover', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success(t('scoping:rollover.success'));
    },
    onError: (err: any) => {
      toast.error(t('scoping:rollover.error', { error: err.message }));
    }
  });

  return {
    selectedSimId,
    setSearchParams,
    filterYear,
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
      uploadSnap: uploadSnapMutation,
      rollover: rolloverMutation
    }
  };
}

export function useScopingEditor(initialSimulation: MaterialitySimulation) {
  const { t } = useTranslation(['scoping', 'common']);
  const { setDirty, resetDirty } = useUnsavedChangesContext();
  const queryClient = useQueryClient();
  const [simState, setSimState] = React.useState(initialSimulation);
  const [glData, setGlData] = React.useState<GLRow[]>([]);
  const [selectedEntityCodes, setSelectedEntityCodes] = React.useState<string[]>([]);
  const [localAppMappings, setLocalAppMappings] = React.useState<Record<string, string[]>>({});
  const [localDeptMappings, setLocalDeptMappings] = React.useState<Record<string, string[]>>({});

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

  // Memoize initial app mappings for comparison
  const initialAppMappings = React.useMemo(() => {
    if (!initialMappings?.items) return {};
    const map: Record<string, string[]> = {};
    initialMappings.items.forEach(m => {
      if (!map[m.accountCode]) map[m.accountCode] = [];
      map[m.accountCode].push(m.applicationId);
    });
    return map;
  }, [initialMappings]);

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
      appMappings: initialAppMappings,
      deptMappings: initialDeptMappings
    };

    return JSON.stringify(currentState) !== JSON.stringify(originalState);
  }, [simState, localAppMappings, localDeptMappings, initialSimulation, initialAppMappings]);

  const lastSimIdRef = React.useRef(initialSimulation.id);

  // Sync state with prop
  React.useEffect(() => {
    if (initialSimulation.id !== lastSimIdRef.current) {
      lastSimIdRef.current = initialSimulation.id;
      setSimState(initialSimulation);
    } else if (!isDirty) {
      setSimState(initialSimulation);
    }
  }, [initialSimulation, isDirty]);

  // Effects
  React.useEffect(() => {
    if (snapshot) {
      setGlData(snapshot.rows);
      // Default: select all entities
      const allCodes = Array.from(new Set(snapshot.rows.map(r => r.entityCode || 'UNKNOWN')));
      setSelectedEntityCodes(allCodes);
    }
  }, [snapshot]);

  React.useEffect(() => {
    if (initialSimulation.id !== lastSimIdRef.current || !isDirty) {
      if (initialMappings?.items) {
        const map: Record<string, string[]> = {};
        initialMappings.items.forEach(m => {
          if (!map[m.accountCode]) map[m.accountCode] = [];
          map[m.accountCode].push(m.applicationId);
        });
        setLocalAppMappings(map);
      }
    }
  }, [initialMappings, isDirty, initialSimulation.id]);

  React.useEffect(() => {
    if (initialSimulation.id !== lastSimIdRef.current || !isDirty) {
      if (initialSimulation.significantAccounts) {
        const map: Record<string, string[]> = {};
        initialSimulation.significantAccounts.forEach(sa => {
          if (sa.fsliCode && sa.assignedDepartmentIds) {
            map[sa.fsliCode] = sa.assignedDepartmentIds;
          }
        });
        setLocalDeptMappings(map);
      }
    }
  }, [initialSimulation, isDirty]);

  // Hierarchy and Filtering
  const entityHierarchy = React.useMemo(() => {
    const tree = buildEntityHierarchy(glData);
    return tree;
  }, [glData]);

  const filteredGlData = React.useMemo(() => {
    if (selectedEntityCodes.length === 0) return glData;
    return glData.filter(row => selectedEntityCodes.includes(row.entityCode || 'UNKNOWN'));
  }, [glData, selectedEntityCodes]);

  // Calculations
  const calculateValues = React.useMemo(() => {
    if (filteredGlData.length === 0 || !snapshot) return { omValue: 0, pmValue: 0, multiplier: 1, benchmarkValue: 0 };
    const benchmarkValue = calculateBenchmarkValue(filteredGlData, simState.basis);
    const multiplier = 1; // getGroupMultiplier(simState.locationCount || 1) - DEFERRED
    const omValue = calculateOM(benchmarkValue, simState.omPercentage, multiplier);
    const pmValue = calculatePM(omValue, simState.haircutPercentage);
    return { omValue, pmValue, multiplier, benchmarkValue };
  }, [filteredGlData, snapshot, simState.basis, simState.omPercentage, simState.haircutPercentage]);

  const { omValue, pmValue, multiplier, benchmarkValue } = calculateValues;

  const mergedGlData = React.useMemo(() => {
    return filteredGlData.map(row => {
      const scopeClassification = getRowScopeClassification({
        row,
        pmValue,
        assessmentData: simState.assessmentData,
        selectedEntityCodes,
        allGlRows: glData
      });
      return {
        ...row,
        assignedDepartmentIds: localDeptMappings[row.noGL] || [],
        scopeClassification
      };
    });
  }, [filteredGlData, localDeptMappings, pmValue, simState.assessmentData, selectedEntityCodes, glData]);

  const significantAccounts = React.useMemo(() => {
    return identifySignificantAccounts({
      glData: mergedGlData,
      pmValue,
      assessmentData: simState.assessmentData
    });
  }, [mergedGlData, simState.assessmentData, pmValue]);

  const scopingCompliance = React.useMemo(() => {
    if (glData.length === 0) return null;
    return calculateScopingCompliance(glData, selectedEntityCodes);
  }, [glData, selectedEntityCodes]);

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

  return {
    simState,
    setSimState,
    mergedGlData,
    entityHierarchy,
    selectedEntityCodes,
    setSelectedEntityCodes,
    omValue,
    pmValue,
    multiplier,
    benchmarkValue,
    scopingCompliance,
    departments: departments?.items || [],
    applications: appsData?.items || [],
    localAppMappings,
    localDeptMappings,
    isDirty,
    isLocked: simState.workflowStatus !== 'Draft' && simState.workflowStatus !== 'Rejected',
    mutations: {
      save: updateSimMutation,
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
