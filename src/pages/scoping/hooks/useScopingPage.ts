import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import type { 
  MaterialitySimulation, GLRow, GLSnapshot, QualitativeLevel, Department, Application
} from '@shared/types';
import {
  apiErrorMessage,
  appMappingsFromItems,
  computeMaterialityView,
  deptMappingsFromAccounts,
  draftFingerprint,
  isEditorLocked,
  isScopingDirty,
  originalFingerprint,
} from './scoping-materiality-view';
import { buildEntityHierarchy } from '../utils/hierarchy-utils';
import { useMaterialityParams } from './use-materiality-params';
import { resolveSimulationStatus } from '@shared/scoping-simulation-status';

export function useScopingPage() {
  const { t } = useTranslation(['scoping', 'common']);
  const { resetDirty } = useUnsavedChangesContext();
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
    },
    onError: (err: unknown) => {
      toast.error(apiErrorMessage(err, 'Failed to delete simulation'));
    }
  });

  const requestDeleteSimMutation = useMutation({
    mutationFn: (id: string) => api(`/api/simulations/${id}/request-deletion`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success(t('scoping:delete.requestDeletionSuccess'));
    },
    onError: (err: unknown) => {
      toast.error(apiErrorMessage(err, 'Failed to request deletion'));
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
    mutationFn: (data: { filename: string, rows: GLRow[], year?: number }) => 
      api<GLSnapshot>('/api/gl-snapshots', { 
        method: 'POST', 
        body: JSON.stringify({
          ...data,
          year: data.year ?? parseInt(filterYear)
        }) 
      }),
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
    onError: (err: unknown) => {
      toast.error(t('scoping:rollover.error', { error: apiErrorMessage(err, 'Rollover failed') }));
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
      requestDeleteSim: requestDeleteSimMutation,
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
  const [isAppMappingsTouched, setIsAppMappingsTouched] = React.useState(false);
  const [isDeptMappingsTouched, setIsDeptMappingsTouched] = React.useState(false);

  const params = useMaterialityParams(initialSimulation, setSimState);
  const {
    draftBasis,
    draftOmPercentage,
    draftHaircutPercentage,
    activeBasis, activeOmPercentage, activeHaircutPercentage,
    syncTo, applyDraft,
  } = params;

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
    queryFn: () => api<{ items: { accountCode: string; applicationId: string }[] }>(`/api/simulations/${initialSimulation.id}/account-applications`),
    enabled: !!initialSimulation.id
  });

  const { data: snapshot } = useQuery({
    queryKey: ['gl-snapshot', simState.glSnapshotId],
    queryFn: () => api<GLSnapshot>(`/api/gl-snapshots/${simState.glSnapshotId}`),
    enabled: !!simState.glSnapshotId
  });

  // Memoize initial app mappings for comparison
  const initialAppMappings = React.useMemo(() => appMappingsFromItems(initialMappings?.items), [initialMappings]);

  // Dirty state tracking
  const isDirty = React.useMemo(() => {
    if (isEditorLocked(resolveSimulationStatus(simState))) {
      return false;
    }
    return isScopingDirty(
      draftFingerprint({
        assessmentData: simState.assessmentData,
        locationCount: simState.locationCount,
        draftBasis,
        draftOmPercentage,
        draftHaircutPercentage,
        appMappings: localAppMappings,
        deptMappings: localDeptMappings,
        materialityJustification: simState.materialityJustification,
      }),
      originalFingerprint({ initial: initialSimulation, initialAppMappings }),
    );
  }, [simState, localAppMappings, localDeptMappings, initialSimulation, initialAppMappings, draftOmPercentage, draftHaircutPercentage, draftBasis]);


  const lastSimIdRef = React.useRef(initialSimulation.id);

  // Sync state with prop
  React.useEffect(() => {
    if (initialSimulation.id !== lastSimIdRef.current) {
      lastSimIdRef.current = initialSimulation.id;
      setSimState(initialSimulation);
      syncTo(initialSimulation);
      setIsAppMappingsTouched(false);
      setIsDeptMappingsTouched(false);
    } else if (!isDirty) {
      setSimState(initialSimulation);
      syncTo(initialSimulation);
    }
  }, [initialSimulation, isDirty, syncTo]);

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
    if (initialMappings?.items && !isAppMappingsTouched) {
      setLocalAppMappings(appMappingsFromItems(initialMappings.items));
    }
  }, [initialMappings, isAppMappingsTouched]);

  React.useEffect(() => {
    if (initialSimulation.significantAccounts && !isDeptMappingsTouched) {
      setLocalDeptMappings(deptMappingsFromAccounts(initialSimulation.significantAccounts));
    }
  }, [initialSimulation.significantAccounts, isDeptMappingsTouched]);

  // Hierarchy and Filtering
  const entityHierarchy = React.useMemo(() => {
    const tree = buildEntityHierarchy(glData);
    return tree;
  }, [glData]);

  const filteredGlData = React.useMemo(() => {
    if (selectedEntityCodes.length === 0) return glData;
    return glData.filter(row => selectedEntityCodes.includes(row.entityCode || 'UNKNOWN'));
  }, [glData, selectedEntityCodes]);

  // Calculations: one materiality view behind a single seam.
  // buildView concentrates the wiring (rows + snapshot + entities + mappings)
  // so the memo and the save-time draft promotion share one call shape.
  const buildView = React.useCallback((basis: string, omPercentage: number, haircutPercentage: number) => {
    return computeMaterialityView({
      filteredRows: filteredGlData,
      allRows: glData,
      snapshotPresent: !!snapshot,
      basis,
      omPercentage,
      haircutPercentage,
      assessmentData: simState.assessmentData,
      selectedEntityCodes,
      deptMappings: localDeptMappings,
      entityCount: simState.locationCount ?? selectedEntityCodes.length,
    });
  }, [filteredGlData, glData, snapshot, simState.assessmentData, simState.locationCount, selectedEntityCodes, localDeptMappings]);

  const { omValue, pmValue, multiplier, benchmarkValue, mergedGlData, significantAccounts, scopingCompliance } = React.useMemo(() => {
    return buildView(activeBasis, activeOmPercentage, activeHaircutPercentage);
  }, [buildView, activeBasis, activeOmPercentage, activeHaircutPercentage]);

  React.useEffect(() => {
    setDirty(isDirty);
    return () => resetDirty();
  }, [isDirty, setDirty, resetDirty]);

  // Mutations
  const updateSimMutation = useMutation({
    mutationFn: async (data: Partial<MaterialitySimulation>) => {
      let finalOmValue = omValue;
      let finalPmValue = pmValue;
      let finalSignificantAccounts = significantAccounts;
      let finalBasis = activeBasis;
      let finalOmPct = activeOmPercentage;
      let finalHaircutPct = activeHaircutPercentage;

      if (draftBasis !== activeBasis || draftOmPercentage !== activeOmPercentage || draftHaircutPercentage !== activeHaircutPercentage) {
        finalBasis = draftBasis;
        finalOmPct = draftOmPercentage;
        finalHaircutPct = draftHaircutPercentage;
        const draftView = buildView(draftBasis, draftOmPercentage, draftHaircutPercentage);
        finalOmValue = draftView.omValue;
        finalPmValue = draftView.pmValue;
        finalSignificantAccounts = draftView.significantAccounts;

        applyDraft(draftBasis, draftOmPercentage, draftHaircutPercentage);
      }

      await api(`/api/simulations/${simState.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ 
          ...data,
          basis: finalBasis,
          omPercentage: finalOmPct,
          haircutPercentage: finalHaircutPct,
          omValue: finalOmValue, 
          pmValue: finalPmValue, 
          significantAccounts: finalSignificantAccounts 
        }) 
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
      setIsAppMappingsTouched(false);
      setIsDeptMappingsTouched(false);
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
    isLocked: isEditorLocked(resolveSimulationStatus(simState)),
    draftBasis: params.draftBasis,
    setDraftBasis: params.setDraftBasis,
    draftOmPercentage: params.draftOmPercentage,
    setDraftOmPercentage: params.setDraftOmPercentage,
    draftHaircutPercentage: params.draftHaircutPercentage,
    setDraftHaircutPercentage: params.setDraftHaircutPercentage,
    isStale: params.isStale,
    isRecalculating: params.isRecalculating,
    handleRecalculate: params.handleRecalculate,
    mutations: {
      save: updateSimMutation,
    },
    handlers: {
      onAssignDepartments: (accountName: string, departmentIds: string[]) => {
        setIsDeptMappingsTouched(true);
        setLocalDeptMappings(prev => ({ ...prev, [accountName]: departmentIds }));
      },
      onAppsChange: (accountCode: string, appIds: string[]) => {
        setIsAppMappingsTouched(true);
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
