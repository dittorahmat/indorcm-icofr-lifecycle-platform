import * as React from 'react';
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { resolveWorkflowAction } from '@/lib/deficiency-workflow';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import { findingsColumns, findingsFilename, mapFindingsRows } from '@/lib/findings-excel-export';
import { KANBAN_COLUMNS, type DoDCompletionMetadata, type TranslateFn } from './board-constants';
import type {
  ActionPlan,
  AggregateDeficiency,
  Deficiency,
  DeficiencySeverity,
  DeficiencyWorkflowStatus,
  MaterialitySimulation,
} from '@shared/types';

export function useDeficiencyBoard(t: TranslateFn) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const mockRole = localStorage.getItem('mockRole');
  const userRole = user?.role || mockRole || 'Admin';

  const [isWizardOpen, setWizardOpen] = React.useState(false);
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [isRemediationOpen, setRemediationOpen] = React.useState(false);
  const [isAggregateMode, setAggregateMode] = React.useState(false);
  const [selectedDeficiencies, setSelectedDeficiencies] = React.useState<string[]>([]);
  const [activeDeficiencyId, setActiveDeficiencyId] = React.useState<string | null>(null);
  const [activePlan, setActivePlan] = React.useState<ActionPlan | null>(null);
  const [sourceFilter, setSourceFilter] = React.useState<string>('all');
  const [mobileStatus, setMobileStatus] = React.useState<string>(KANBAN_COLUMNS[0] as string);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const filteredDeficiencies = React.useMemo(() => {
    if (!deficienciesData?.items) return [];
    if (sourceFilter === 'all') return deficienciesData.items;
    if (sourceFilter === 'csa') return deficienciesData.items.filter((d) => d.source === 'Lini 1 - CSA');
    if (sourceFilter === 'tod') return deficienciesData.items.filter((d) => d.source === 'Lini 2 - TOD Review');
    if (sourceFilter === 'toe')
      return deficienciesData.items.filter(
        (d) => d.source === 'Lini 2 - CSA Validation' || d.source === 'Lini 2 - CSA Review' || d.source === 'Lini 2 - TOE Review',
      );
    if (sourceFilter === 'audit') return deficienciesData.items.filter((d) => d.source === 'Lini 3 - Audit');
    return deficienciesData.items;
  }, [deficienciesData, sourceFilter]);

  const { data: actionPlansData, isLoading: actionPlansLoading } = useQuery({
    queryKey: ['actionplans'],
    queryFn: () => api<{ items: ActionPlan[] }>('/api/actionplans'),
  });

  const { data: simulationsData } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => api<{ items: MaterialitySimulation[] }>('/api/simulations'),
  });

  const activeSimulation = simulationsData?.items.find((s) => s.status === 'Approved') || simulationsData?.items[0];
  const pmValue = activeSimulation?.pmValue;

  const actionPlans = React.useMemo(() => actionPlansData?.items ?? [], [actionPlansData?.items]);

  const actionPlansRef = React.useRef<ActionPlan[]>([]);
  React.useEffect(() => {
    actionPlansRef.current = actionPlans;
  }, [actionPlans]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const planMutation = useMutation({
    mutationFn: async (payload: Partial<ActionPlan> & { id: string; deficiencyId: string }) => {
      await api(`/api/actionplans/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(t('toast.planUpdated', { defaultValue: 'Action plan updated.' }));
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
      queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
    },
    onError: (error) => {
      toast.error(t('toast.updateFailed', { message: error.message, defaultValue: `Update failed: ${error.message}` }));
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
    },
  });

  const severityMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      severity: DeficiencySeverity;
      rationale?: string;
      exposureValue?: number;
      assertions?: string[];
      flowchartPath?: Record<number, boolean>;
    }) => api(`/api/deficiencies/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success(t('toast.severityUpdated', { defaultValue: 'Deficiency severity updated based on DoD assessment.' }));
      queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
    },
  });

  const aggregateMutation = useMutation({
    mutationFn: (data: Partial<AggregateDeficiency>) =>
      api(`/api/aggregatedeficiencies`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success(t('toast.aggregateSaved', { defaultValue: 'Aggregate deficiency analysis saved (Lampiran 10).' }));
      queryClient.invalidateQueries({ queryKey: ['aggregatedeficiencies'] });
      setAggregateMode(false);
      setSelectedDeficiencies([]);
    },
  });

  const workflowMutation = useMutation<
    unknown,
    Error,
    { id: string; action: string; note: string },
    { serverPlans: { items: ActionPlan[] } | undefined; localSnapshot: ActionPlan[] }
  >({
    mutationFn: async ({ id, action, note }: { id: string; action: string; note: string }) => {
      return await api(`/api/actionplans/${id}/workflow`, {
        method: 'POST',
        body: JSON.stringify({ action, note }),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['actionplans'] });
      return {
        serverPlans: queryClient.getQueryData<{ items: ActionPlan[] }>(['actionplans']),
        localSnapshot: actionPlansRef.current,
      };
    },
    onSuccess: () => {
      toast.success(t('toast.workflowUpdated', { defaultValue: 'Workflow status updated.' }));
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
      queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
    },
    onError: (error, _variables, context) => {
      if (context?.serverPlans) {
        queryClient.setQueryData(['actionplans'], context.serverPlans);
      }
      toast.error(error.message);
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
    },
  });

  const handleAssess = useCallback((id: string) => {
    setActiveDeficiencyId(id);
    setWizardOpen(true);
  }, []);

  const handleWizardComplete = useCallback(
    (severity: DeficiencySeverity, rationale?: string, metadata?: DoDCompletionMetadata) => {
      if (isAggregateMode) {
        const selectedData = deficienciesData?.items.filter((d) => selectedDeficiencies.includes(d.id)) || [];
        aggregateMutation.mutate({
          deficiencyIds: selectedDeficiencies,
          finalSeverity: severity,
          conclusionRationale: rationale || 'Evaluasi agregasi akun sejenis (Box 7 loop-back).',
          combinedMagnitude: metadata?.exposureValue || selectedData.reduce((sum, d) => sum + (d.magnitude || 0), 0),
          affectedAccounts: [...new Set(selectedData.map((d) => d.controlId))],
          affectedAssertions: metadata?.assertions,
        });
      } else if (activeDeficiencyId) {
        severityMutation.mutate({
          id: activeDeficiencyId,
          severity,
          rationale,
          ...(metadata
            ? {
                exposureValue: metadata.exposureValue,
                assertions: metadata.assertions,
                flowchartPath: metadata.flowchartPath,
              }
            : {}),
        });
      }
    },
    [isAggregateMode, deficienciesData, selectedDeficiencies, aggregateMutation, activeDeficiencyId, severityMutation],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const plan = actionPlans.find((p) => p.id === active.id);
      if (!plan) return;

      const currentWorkflowStatus = (plan.workflowStatus || plan.status || 'Ineffective') as DeficiencyWorkflowStatus;

      let overStatus: DeficiencyWorkflowStatus | null = null;
      const overIdStr = String(over.id);
      if (KANBAN_COLUMNS.includes(overIdStr)) {
        overStatus = overIdStr as DeficiencyWorkflowStatus;
      } else {
        const overCard = actionPlans.find((p) => p.id === over.id);
        if (overCard) {
          overStatus = (overCard.workflowStatus || overCard.status || 'Ineffective') as DeficiencyWorkflowStatus;
        } else if (over.data.current?.sortable?.containerId && KANBAN_COLUMNS.includes(over.data.current.sortable.containerId)) {
          overStatus = over.data.current.sortable.containerId as DeficiencyWorkflowStatus;
        }
      }

      if (!overStatus) return;

      const resolution = resolveWorkflowAction(currentWorkflowStatus, overStatus, userRole);
      if ('error' in resolution) {
        if (resolution.error !== 'same-status') {
          toast.error(resolution.error);
        }
        return;
      }

      queryClient.setQueryData<{ items: ActionPlan[] }>(['actionplans'], (prev) => {
        if (!prev?.items) return prev as { items: ActionPlan[] };
        const activeIndex = prev.items.findIndex((ap) => ap.id === active.id);
        if (activeIndex === -1) return prev;
        const newItems = [...prev.items];
        newItems[activeIndex] = {
          ...newItems[activeIndex],
          workflowStatus: overStatus as DeficiencyWorkflowStatus,
          status: overStatus === 'Resolved' ? 'Resolved' : newItems[activeIndex]?.status,
        };
        return { ...prev, items: newItems };
      });

      workflowMutation.mutate({
        id: plan.id,
        action: resolution.action,
        note: resolution.note,
      });
    },
    [actionPlans, userRole, workflowMutation, queryClient],
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedDeficiencies((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  const handleStartAggregate = useCallback(() => {
    if (selectedDeficiencies.length < 2) {
      toast.error(t('board.minSelectionError', { defaultValue: 'Select at least 2 findings for aggregate analysis.' }));
      return;
    }
    setWizardOpen(true);
  }, [selectedDeficiencies.length, t]);

  const handleStatusChange = useCallback(
    (apId: string, action: string) => {
      workflowMutation.mutate({
        id: apId,
        action,
        note: `Transitioned from board: ${action}`,
      });
    },
    [workflowMutation],
  );

  const handleEditPlan = useCallback((plan: ActionPlan) => {
    setActivePlan(plan);
    setRemediationOpen(true);
  }, []);

  const cancelAggregateMode = useCallback(() => {
    setAggregateMode(false);
    setSelectedDeficiencies([]);
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (filteredDeficiencies.length === 0 || isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const rows = mapFindingsRows(filteredDeficiencies, (d) => d.controlName || d.controlCode || '-');
      await exportRegulatoryTableToExcel(rows, {
        title: t('reports:findings.title', { defaultValue: 'LAMPIRAN 9' }),
        subtitle: t('reports:findings.subtitle', { defaultValue: '' }),
        identityLines: [String(new Date().getFullYear())],
        columns: findingsColumns({
          no: t('reports:findings.columns.no', { defaultValue: 'No' }),
          ref: t('reports:findings.columns.ref', { defaultValue: 'Ref. Temuan' }),
          description: t('reports:findings.columns.description', { defaultValue: 'Deskripsi Temuan' }),
          control: t('reports:findings.columns.control', { defaultValue: 'Kontrol Terkait' }),
          severity: t('reports:findings.columns.severity', { defaultValue: 'Tingkat' }),
          exposure: t('reports:findings.columns.exposure', { defaultValue: 'Nilai Eksposur' }),
          identifiedBy: t('reports:findings.columns.identifiedBy', { defaultValue: 'Ditemukan Oleh' }),
          identifiedDate: t('reports:findings.columns.identifiedDate', { defaultValue: 'Tanggal Temuan' }),
          source: t('reports:findings.columns.source', { defaultValue: 'Sumber' }),
          status: t('reports:findings.columns.status', { defaultValue: 'Status' }),
        }),
        filename: findingsFilename(new Date().getFullYear()),
        sheetName: t('reports:findings.title', { defaultValue: 'Lampiran 9' }),
      });
      toast.success(t('common:notifications.exportSuccess', { defaultValue: 'Excel berhasil diunduh' }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common:notifications.exportFailed', { defaultValue: 'Gagal mengekspor Excel' });
      toast.error(message);
    } finally {
      setIsExportingExcel(false);
    }
  }, [filteredDeficiencies, isExportingExcel, t]);

  const dragPlan = activeId ? (actionPlans.find((p) => p.id === activeId) ?? null) : null;
  const dragDeficiency = dragPlan ? (filteredDeficiencies.find((d) => d.id === dragPlan.deficiencyId) ?? null) : null;
  const activeDeficiency = deficienciesData?.items.find((d) => d.id === activeDeficiencyId) || null;

  return {
    userRole,
    sourceFilter,
    mobileStatus,
    isAggregateMode,
    selectedDeficiencies,
    isWizardOpen,
    isRemediationOpen,
    activePlan,
    activeDeficiency,
    pmValue,
    isExportingExcel,
    isLoading: deficienciesLoading || actionPlansLoading,
    filteredDeficiencies,
    actionPlans,
    sensors,
    dragPlan,
    dragDeficiency,
    planMutation,
    setSourceFilter,
    setMobileStatus,
    setWizardOpen,
    setRemediationOpen,
    setAggregateMode,
    handleAssess,
    handleWizardComplete,
    handleDragStart,
    handleDragEnd,
    handleToggleSelect,
    handleStartAggregate,
    handleStatusChange,
    handleEditPlan,
    cancelAggregateMode,
    handleExportExcel,
  };
}
