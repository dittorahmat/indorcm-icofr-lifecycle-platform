import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Settings, BPMProcess } from '@shared/types';
import { useActiveSimulation, useSimulationSnapshot } from '@/hooks/use-bpm';
import { useConfirm } from '@/hooks/use-confirm';
import { unmappedControlsFrom } from '@shared/control-linkage';
import {
  SIGNATURE_FIELDS,
  comparableDiagramEdges,
  comparableDiagramNodes,
  projectSignatures,
} from './bpm-diagram-projection';

/** Locale-stable sign-off date; an unparseable/absent stamp renders empty. */
function formatSignatureDate(timestamp: number | undefined): string {
  try {
    return format(new Date(Number(timestamp)), 'dd/MM/yyyy');
  } catch {
    return '';
  }
}

interface UseBPMEditorStateProps {
  diagramId: string;
  subProcess: string;
  workingYear: string;
  currentGL?: string;
  bpmProcessId?: string;
  nodes: any[];
  edges: any[];
  localizedInitialNodes: any[];
  isExporting: boolean;
  t: (key: string, options?: any) => string;
}

export function useBPMEditorState({
  diagramId,
  subProcess,
  workingYear,
  currentGL,
  bpmProcessId: propBpmProcessId,
  nodes,
  edges,
  localizedInitialNodes,
  isExporting,
  t,
}: UseBPMEditorStateProps) {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Fetch Diagram Data
  const { data: diagram, isLoading: isDiagramLoading } = useQuery({
    queryKey: ['bpm-diagrams', diagramId, currentGL],
    queryFn: () => api<any>(`/api/bpm-diagrams/${diagramId}${currentGL ? `?noGL=${currentGL}` : ''}`),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  const resolvedBpmProcessId = propBpmProcessId || searchParams.get('bpmProcessId') || undefined;

  const { data: bpmProcess } = useQuery({
    queryKey: ['bpm-processes', subProcess, workingYear, resolvedBpmProcessId, currentGL],
    queryFn: async () => {
      const res = await api<{ items: BPMProcess[] }>(`/api/bpm-processes?year=${workingYear}`);
      if (resolvedBpmProcessId) {
        const foundById = res.items.find((p) => p.id === resolvedBpmProcessId);
        if (foundById) return foundById;
      }
      if (currentGL) {
        const foundByGL = res.items.find(
          (p) => p.name === subProcess && p.year === parseInt(workingYear) && p.noGL === currentGL
        );
        if (foundByGL) return foundByGL;
      }
      return res.items.find((p) => p.name === subProcess && p.year === parseInt(workingYear));
    },
    enabled: !!subProcess,
  });

  const { data: users } = useQuery({
    queryKey: ['users-for-workflow'],
    queryFn: () => api<{ items: { id: string; name: string; role: string }[] }>('/api/users'),
  });

  const [signatures, setSignatures] = useState({
    lini1Name: '',
    lini1Date: '',
    lini2Name: '',
    lini2Date: '',
    cfoName: '',
    cfoDate: '',
  });

  const getUserName = useCallback(
    (userId: string) => {
      if (!users?.items || !userId) return userId;
      const found = users.items.find((u) => u.id === userId);
      return found ? found.name : userId;
    },
    [users]
  );

  useEffect(() => {
    if (diagram) {
      setSignatures(
        projectSignatures({
          saved: diagram.metadata?.signatures,
          workflowHistory: bpmProcess?.workflowHistory,
          createdBy: diagram.createdBy,
          resolveUserName: getUserName,
          formatDate: formatSignatureDate,
        }),
      );
    }
  }, [diagram, bpmProcess, getUserName]);

  const { data: activeSim } = useActiveSimulation(workingYear);
  const { data: activeSnap } = useSimulationSnapshot(activeSim?.glSnapshotId);

  const [selectedGLs, setSelectedGLs] = useState<string[]>([]);
  const [globalScale, setGlobalScale] = useState<number>(100);

  useEffect(() => {
    if (diagram) {
      if (diagram.metadata?.globalScale) {
        setGlobalScale(diagram.metadata.globalScale);
      }
      if (diagram.noGLs && diagram.noGLs.length > 0) {
        setSelectedGLs(diagram.noGLs);
      } else if (currentGL) {
        setSelectedGLs([currentGL]);
      }
    }
  }, [diagram, currentGL]);

  const glOptions = useMemo(() => {
    if (!activeSnap || !activeSnap.rows) return [];
    const accounts: { label: string; value: string; isCurrentFsli: boolean }[] = [];
    const seen = new Set<string>();
    const targetFsli = bpmProcess?.fsliName ? bpmProcess.fsliName.trim().toLowerCase() : '';

    activeSnap.rows.forEach((r: any) => {
      const key = r.noGL;
      if (key && !seen.has(key)) {
        seen.add(key);
        const rFsli = r.fsliName ? r.fsliName.trim().toLowerCase() : '';
        const isCurrentFsli = targetFsli !== '' && rFsli === targetFsli;
        accounts.push({
          label: `${r.noGL} • ${r.glDesc || 'No Description'}`,
          value: r.noGL,
          isCurrentFsli,
        });
      }
    });

    return accounts.sort((a, b) => {
      if (a.isCurrentFsli && !b.isCurrentFsli) return -1;
      if (!a.isCurrentFsli && b.isCurrentFsli) return 1;
      return a.value.localeCompare(b.value);
    });
  }, [activeSnap, bpmProcess?.fsliName]);

  const { data: matrixData } = useQuery({
    queryKey: ['rcm-matrix-tlc', bpmProcess?.id, workingYear, currentGL],
    queryFn: async () => {
      let url = `/api/rcm-matrix/tlc?year=${workingYear}`;
      if (bpmProcess?.id) url += `&bpmProcessId=${bpmProcess.id}`;
      if (currentGL) url += `&noGL=${currentGL}`;
      return api<{ items: any[] }>(url);
    },
    enabled: !!bpmProcess?.id && !!workingYear,
  });

  const unmappedControls = useMemo(() => {
    if (!matrixData?.items) return [];
    return unmappedControlsFrom(matrixData.items, nodes);
  }, [matrixData, nodes]);

  const isWorkflowLocked = useMemo(() => {
    if (!bpmProcess) return false;
    const status = bpmProcess.workflowStatus || 'Draft';
    return status !== 'Draft' && status !== 'Rejected';
  }, [bpmProcess]);

  const isLocked = useMemo(() => {
    if (isWorkflowLocked) return true;
    if (!diagram || !workingYear) return false;
    const diagramYear = diagram.year || parseInt(workingYear);
    return diagramYear < parseInt(workingYear) || settings?.isPeriodLocked === true;
  }, [isWorkflowLocked, diagram, workingYear, settings?.isPeriodLocked]);

  const isDirty = useMemo(() => {
    if (!diagram || isLocked) return false;

    const initialSignatures = projectSignatures({
      saved: diagram.metadata?.signatures,
      workflowHistory: bpmProcess?.workflowHistory,
      createdBy: diagram.createdBy,
      resolveUserName: getUserName,
      formatDate: formatSignatureDate,
    });
    const signaturesChanged = SIGNATURE_FIELDS.some(
      (field) => signatures[field] !== initialSignatures[field],
    );

    const savedScale = diagram.metadata?.globalScale || 100;

    return (
      comparableDiagramNodes(nodes) !== comparableDiagramNodes(diagram.nodes || localizedInitialNodes) ||
      comparableDiagramEdges(edges) !== comparableDiagramEdges(diagram.edges || []) ||
      signaturesChanged ||
      globalScale !== savedScale
    );
  }, [nodes, edges, diagram, isLocked, localizedInitialNodes, signatures, bpmProcess, getUserName, globalScale]);

  const handleSwitchGLContext = useCallback(
    async (targetGL: string) => {
      if (targetGL === currentGL) return;

      if (isDirty) {
        const ok = await confirm({
          title: t('common:unsavedChanges.title'),
          description: t('common:unsavedChanges.description'),
          confirmText: t('common:unsavedChanges.discard'),
          cancelText: t('common:unsavedChanges.stay'),
          variant: 'destructive',
        });
        if (!ok) return;
      }

      const matchedRow = activeSnap?.rows?.find((r: any) => r.noGL === targetGL);
      const glDesc = matchedRow?.glDesc || 'No Description';
      const fsliName = matchedRow?.fsliName;

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('noGL', targetGL);
        next.set('glDesc', glDesc);
        if (fsliName) {
          next.set('fsli', fsliName);
        }
        return next;
      });

      toast.success(t('bpm:editor.toast.contextSwitched', { defaultValue: `Switched context to ${targetGL}` }));
    },
    [currentGL, isDirty, activeSnap, setSearchParams, t, confirm]
  );

  return {
    diagram,
    isDiagramLoading,
    settings,
    bpmProcess,
    users,
    signatures,
    setSignatures,
    selectedGLs,
    setSelectedGLs,
    globalScale,
    setGlobalScale,
    glOptions,
    unmappedControls,
    isLocked,
    isDirty,
    handleSwitchGLContext,
  };
}
