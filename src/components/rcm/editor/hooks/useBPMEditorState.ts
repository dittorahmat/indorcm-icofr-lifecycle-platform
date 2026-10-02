import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Settings, BPMProcess } from '@shared/types';
import { useActiveSimulation, useSimulationSnapshot } from '@/hooks/use-bpm';
import { useConfirm } from '@/hooks/use-confirm';

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
      const savedSigs = diagram.metadata?.signatures || {};
      const history = bpmProcess?.workflowHistory || [];
      const submitAction = history.find((h: any) => h.action === 'Submit');
      const reviewAction = history.find((h: any) => h.action === 'Review');
      const approveAction = history.find((h: any) => h.action === 'Approve');

      const formatTimestamp = (ts: number) => {
        try {
          return format(new Date(ts), 'dd/MM/yyyy');
        } catch {
          return '';
        }
      };

      setSignatures({
        lini1Name:
          savedSigs.lini1Name !== undefined
            ? savedSigs.lini1Name
            : submitAction?.userId
            ? getUserName(submitAction.userId)
            : getUserName(diagram.createdBy || ''),
        lini1Date:
          savedSigs.lini1Date !== undefined
            ? savedSigs.lini1Date
            : submitAction
            ? formatTimestamp(submitAction.timestamp)
            : '',
        lini2Name:
          savedSigs.lini2Name !== undefined
            ? savedSigs.lini2Name
            : reviewAction?.userId
            ? getUserName(reviewAction.userId)
            : '',
        lini2Date:
          savedSigs.lini2Date !== undefined
            ? savedSigs.lini2Date
            : reviewAction
            ? formatTimestamp(reviewAction.timestamp)
            : '',
        cfoName:
          savedSigs.cfoName !== undefined
            ? savedSigs.cfoName
            : approveAction?.userId
            ? getUserName(approveAction.userId)
            : '',
        cfoDate:
          savedSigs.cfoDate !== undefined
            ? savedSigs.cfoDate
            : approveAction
            ? formatTimestamp(approveAction.timestamp)
            : '',
      });
    }
  }, [diagram, bpmProcess, users, getUserName]);

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

    const mappedRiskIds = new Set<string>();
    nodes.forEach((node) => {
      const nodePairs =
        node.data?.regulatoryPairs || (node.data?.regulatoryData ? [node.data.regulatoryData] : []);
      nodePairs.forEach((pair: any) => {
        if (pair.riskId) mappedRiskIds.add(pair.riskId);
      });

      if (node.data?.risks && !node.data?.regulatoryPairs && !node.data?.regulatoryData) {
        node.data.risks.forEach((r: any) => mappedRiskIds.add(r.rcmId));
      }
    });

    return matrixData.items.filter(
      (item) => !mappedRiskIds.has(item.rcmId || item.mappingId?.split(':')[0] || item.riskId || item.id)
    );
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
    const currentNodes = JSON.stringify(nodes.map((n) => ({ id: n.id, position: n.position, data: n.data })));
    const originalNodes = JSON.stringify(
      (diagram.nodes || localizedInitialNodes).map((n: any) => ({
        id: n.id,
        position: n.position,
        data: n.data,
      }))
    );
    const currentEdges = JSON.stringify(edges.map((e) => ({ id: e.id, source: e.source, target: e.target })));
    const originalEdges = JSON.stringify(
      (diagram.edges || []).map((e: any) => ({ id: e.id, source: e.source, target: e.target }))
    );

    const savedSigs = diagram.metadata?.signatures || {};
    const history = bpmProcess?.workflowHistory || [];
    const submitAction = history.find((h: any) => h.action === 'Submit');
    const reviewAction = history.find((h: any) => h.action === 'Review');
    const approveAction = history.find((h: any) => h.action === 'Approve');

    const formatTimestamp = (ts: number) => {
      try {
        return format(new Date(ts), 'dd/MM/yyyy');
      } catch {
        return '';
      }
    };

    const initialLini1Name =
      savedSigs.lini1Name !== undefined
        ? savedSigs.lini1Name
        : submitAction?.userId
        ? getUserName(submitAction.userId)
        : getUserName(diagram.createdBy || '');
    const initialLini1Date =
      savedSigs.lini1Date !== undefined
        ? savedSigs.lini1Date
        : submitAction
        ? formatTimestamp(submitAction.timestamp)
        : '';
    const initialLini2Name =
      savedSigs.lini2Name !== undefined
        ? savedSigs.lini2Name
        : reviewAction?.userId
        ? getUserName(reviewAction.userId)
        : '';
    const initialLini2Date =
      savedSigs.lini2Date !== undefined
        ? savedSigs.lini2Date
        : reviewAction
        ? formatTimestamp(reviewAction.timestamp)
        : '';
    const initialCfoName =
      savedSigs.cfoName !== undefined
        ? savedSigs.cfoName
        : approveAction?.userId
        ? getUserName(approveAction.userId)
        : '';
    const initialCfoDate =
      savedSigs.cfoDate !== undefined
        ? savedSigs.cfoDate
        : approveAction
        ? formatTimestamp(approveAction.timestamp)
        : '';

    const sigsChanged =
      signatures.lini1Name !== initialLini1Name ||
      signatures.lini1Date !== initialLini1Date ||
      signatures.lini2Name !== initialLini2Name ||
      signatures.lini2Date !== initialLini2Date ||
      signatures.cfoName !== initialCfoName ||
      signatures.cfoDate !== initialCfoDate;

    const savedScale = diagram.metadata?.globalScale || 100;
    const scaleChanged = globalScale !== savedScale;

    return currentNodes !== originalNodes || currentEdges !== originalEdges || sigsChanged || scaleChanged;
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
