import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { BPMProcess, BPMProcessWithChildren, User, BPMDiagram, Settings, AccountAssertion } from '@shared/types';
import { MOCK_DEPARTMENTS } from '@shared/mock-data';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useConfirm } from '@/hooks/use-confirm';
import { useAccountAssertions, useActiveSimulation, useSimulationSnapshot } from '@/hooks/use-bpm';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { toast } from 'sonner';

export function buildProcessTree(
  items: BPMProcess[],
  searchTerm = ""
): BPMProcessWithChildren[] {
  const itemMap = new Map<string, BPMProcessWithChildren>();
  const rootItems: BPMProcessWithChildren[] = [];

  // Initialize map with copies and empty children arrays
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Build tree hierarchy
  items.forEach(item => {
    const current = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(current);
    } else {
      rootItems.push(current);
    }
  });

  if (!searchTerm.trim()) {
    return rootItems;
  }

  const query = searchTerm.toLowerCase().trim();
  const filterNode = (node: BPMProcessWithChildren): BPMProcessWithChildren | null => {
    const nameMatches = node.name.toLowerCase().includes(query) || (node.bpmCode && node.bpmCode.toLowerCase().includes(query));
    const matchingChildren: BPMProcessWithChildren[] = [];

    if (node.children) {
      for (const child of node.children) {
        const filteredChild = filterNode(child);
        if (filteredChild) {
          matchingChildren.push(filteredChild);
        }
      }
    }

    if (nameMatches || matchingChildren.length > 0) {
      return {
        ...node,
        children: nameMatches ? (node.children || []) : matchingChildren
      };
    }
    return null;
  };

  return rootItems
    .map(filterNode)
    .filter((node): node is BPMProcessWithChildren => node !== null);
}

export function useBPMPage() {
  const { t } = useTranslation(['bpm', 'common', 'rcm']);
  const confirm = useConfirm();
  const { workingYear } = useFiscalYearStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDirty } = useUnsavedChangesContext();

  const [selectedFsli, setSelectedFsli] = React.useState<string>("");
  const [selectedAccountKey, setSelectedAccountKey] = React.useState<string>("");
  const [selectedBpmId, setSelectedBpmId] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCsaModalOpen, setIsCsaModalOpen] = React.useState(false);
  const [selectedBpmName, setSelectedBpmName] = React.useState("");

  const viewYear = workingYear;

  const selectedDiagramId = searchParams.get('diagramId');
  const isBpmEditorOpen = !!selectedDiagramId;
  const currentSubProcess = searchParams.get('subProcess') || "";
  const currentBpmProcessId = searchParams.get('bpmProcessId') || "";

  const [isCreatingBPM, setIsCreatingBPM] = React.useState(false);
  const [bpmName, setBpmName] = React.useState("");
  const [bpmCode, setBpmCode] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedProcess, setSelectedProcess] = React.useState<BPMProcess | null>(null);

  const [localAssertion, setLocalAssertion] = React.useState<Partial<AccountAssertion>>({});

  const handleOpenDiagram = (diagramId: string, subProcess: string, bpmProcessId?: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('diagramId', diagramId);
      next.set('subProcess', subProcess);
      if (bpmProcessId) next.set('bpmProcessId', bpmProcessId);
      next.set('year', viewYear);
      return next;
    });
  };

  const handleCloseDiagram = async () => {
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
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('diagramId');
      next.delete('subProcess');
      next.delete('bpmProcessId');
      return next;
    });
  };

  // 1. Fetch Active Simulation for Account Assignments - Filtered by viewYear
  const { data: activeSim, isLoading: simLoading } = useActiveSimulation(viewYear);

  // 2. Fetch Snapshot linked to the simulation (or fallback to active)
  const { data: activeSnap, isLoading: snapLoading } = useSimulationSnapshot(activeSim?.glSnapshotId);

  // Handle Deep Linking from Scoping
  React.useEffect(() => {
    const fsli = searchParams.get('fsli');
    const noGL = searchParams.get('noGL');
    const glDesc = searchParams.get('glDesc');

    let resolvedFsli = fsli;
    if (noGL && activeSnap?.rows) {
      const matchedRow = activeSnap.rows.find((r: any) => r.noGL === noGL);
      if (matchedRow?.fsliName) {
        resolvedFsli = matchedRow.fsliName;
      }
    }

    if (resolvedFsli) setSelectedFsli(resolvedFsli);
    if (noGL && glDesc) {
      setSelectedAccountKey(`${noGL} ||| ${glDesc}`);
    }
  }, [searchParams, activeSnap]);

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  const { assertion: accountAssertion, isLoading: assertionLoading } = useAccountAssertions(
    selectedFsli,
    selectedAccountKey.split(' ||| ')[0]
  );

  React.useEffect(() => {
    if (accountAssertion !== undefined) {
      if (accountAssertion === null) {
        setLocalAssertion({
          assertionE: 'N', assertionC: 'N', assertionA: 'N',
          assertionCo: 'N', assertionRo: 'N', assertionVa: 'N',
          assertionPd: 'N'
        });
      } else {
        setLocalAssertion(accountAssertion);
      }
    }
  }, [accountAssertion]);

  const updateAssertionMutation = useMutation({
    mutationFn: (data: Partial<AccountAssertion>) => api('/api/account-assertions', {
      method: 'POST',
      body: JSON.stringify({
        fsliName: selectedFsli,
        noGL: selectedAccountKey.split(' ||| ')[0],
        ...data
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-assertions'] });
      toast.success("Account assertions updated");
    }
  });

  const isAssertionDirty = React.useMemo(() => {
    if (!accountAssertion) {
      return Object.values(localAssertion).some(v => v === 'Y');
    }
    return (
      localAssertion.assertionE !== (accountAssertion.assertionE || 'N') ||
      localAssertion.assertionC !== (accountAssertion.assertionC || 'N') ||
      localAssertion.assertionA !== (accountAssertion.assertionA || 'N') ||
      localAssertion.assertionCo !== (accountAssertion.assertionCo || 'N') ||
      localAssertion.assertionRo !== (accountAssertion.assertionRo || 'N') ||
      localAssertion.assertionVa !== (accountAssertion.assertionVa || 'N') ||
      localAssertion.assertionPd !== (accountAssertion.assertionPd || 'N')
    );
  }, [localAssertion, accountAssertion]);

  useUnsavedChanges(isAssertionDirty);

  const handleAssertionChange = (field: keyof AccountAssertion, value: string) => {
    setLocalAssertion(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAssertions = () => {
    updateAssertionMutation.mutate(localAssertion);
  };

  const glLookupMap = React.useMemo(() => {
    if (!activeSnap || !activeSnap.rows) return new Map<string, string>();
    const map = new Map<string, string>();
    activeSnap.rows.forEach(r => {
      if (r.glDesc && r.fsliName) map.set(`desc:${r.glDesc}`, r.fsliName);
      if (r.noGL && r.fsliName) map.set(`no:${r.noGL}`, r.fsliName);
    });
    return map;
  }, [activeSnap]);

  const fsliNoUrutMap = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!activeSnap || !activeSnap.rows) return map;
    activeSnap.rows.forEach(r => {
      if (r.fsliName) {
        const currentMin = map.get(r.fsliName) ?? 999999;
        const rowNoUrut = r.noUrut ?? 999999;
        if (rowNoUrut < currentMin) map.set(r.fsliName, rowNoUrut);
      }
    });
    return map;
  }, [activeSnap]);

  const significantFsliNames = React.useMemo(() => {
    const names = new Set<string>();
    if (activeSim && activeSim.significantAccounts) {
      activeSim.significantAccounts.forEach(sa => {
        if (sa.name) {
          const fsliNameFromMap = glLookupMap.get(`desc:${sa.name}`) || glLookupMap.get(`no:${sa.fsliCode}`);
          if (fsliNameFromMap) names.add(fsliNameFromMap);
          else names.add(sa.name);
        }
      });
    }
    const urlFsli = searchParams.get('fsli');
    if (urlFsli) names.add(urlFsli);
    return Array.from(names).sort((a, b) => {
      const orderA = fsliNoUrutMap.get(a) ?? 999999;
      const orderB = fsliNoUrutMap.get(b) ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [activeSim, glLookupMap, fsliNoUrutMap, searchParams]);

  const glNumbers = React.useMemo(() => {
    if (!activeSnap || !activeSnap.rows || !selectedFsli) return [];
    const accounts: { key: string, noGL: string, glDesc: string }[] = [];
    const seen = new Set<string>();
    activeSnap.rows
      .filter(r => (r.fsliName || "").trim().toLowerCase() === selectedFsli.trim().toLowerCase())
      .forEach(r => {
        const key = `${r.noGL} ||| ${r.glDesc}`;
        if (!seen.has(key)) {
          seen.add(key);
          accounts.push({ key, noGL: r.noGL, glDesc: r.glDesc });
        }
      });
    return accounts.sort((a, b) => a.noGL.localeCompare(b.noGL));
  }, [activeSnap, selectedFsli]);

  const selectedGLRow = React.useMemo(() => {
    if (!selectedAccountKey || !activeSnap || !activeSnap.rows) return null;
    const [noGL, glDesc] = selectedAccountKey.split(' ||| ');
    return activeSnap.rows.find(r => r.noGL === noGL && r.glDesc === glDesc);
  }, [selectedAccountKey, activeSnap]);

  const { departmentName, hasAccess } = React.useMemo(() => {
    if (!selectedGLRow || !activeSim || !currentUser) return { hasAccess: true, departmentName: "Finance & Accounting" };
    const assignment = activeSim.significantAccounts?.find(sa =>
      sa.name === selectedGLRow.fsliName || (sa.fsliCode && sa.fsliCode === selectedGLRow.fsliCode)
    );
    const deptIds = assignment?.assignedDepartmentIds || [];
    const deptName = deptIds.length > 0
      ? deptIds.map(id => MOCK_DEPARTMENTS.find(d => d.id === id)?.name).filter(Boolean).join(", ")
      : "Unassigned";
    if (currentUser.role === 'Line 2' || currentUser.role === 'Admin') return { departmentName: deptName, hasAccess: true };
    const match = !!currentUser.departmentId && deptIds.includes(currentUser.departmentId);
    return { departmentName: deptName, hasAccess: match };
  }, [selectedGLRow, activeSim, currentUser]);

  const { data: bpmProcesses, isLoading: bpmLoading } = useQuery({
    queryKey: ['bpm-processes', selectedAccountKey, viewYear],
    queryFn: () => {
      const noGL = selectedAccountKey.split(' ||| ')[0];
      return api<{ items: BPMProcess[] }>(`/api/bpm-processes?noGL=${noGL}&year=${viewYear}`);
    },
    enabled: !!selectedAccountKey
  });

  const { data: diagrams } = useQuery({
    queryKey: ['bpm-diagrams', viewYear],
    queryFn: () => api<{ items: BPMDiagram[] }>(`/api/bpm-diagrams?year=${viewYear}`)
  });

  const createDiagramMutation = useMutation({
    mutationFn: (subProcess: string) => api<{ id: string }>('/api/bpm-diagrams', {
      method: 'POST',
      body: JSON.stringify({
        name: subProcess,
        subProcess,
        year: parseInt(viewYear)
      })
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
      handleOpenDiagram(data.id, variables);
    }
  });

  const createBPMMutation = useMutation({
    mutationFn: (data: Partial<BPMProcess>) => api('/api/bpm-processes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      setIsCreatingBPM(false);
      setBpmName("");
      setBpmCode("");
      toast.success(t('common:notifications.created'));
    }
  });

  const setBpmNameWithFuzzy = (name: string) => {
    setBpmName(name);
    if (!bpmProcesses?.items) return;
    
    const searchStr = name.toLowerCase();
    const exactMatch = bpmProcesses.items.find(p => p.name.toLowerCase() === searchStr);
    
    if (exactMatch?.bpmCode) {
      setBpmCode(exactMatch.bpmCode);
      return;
    }
    
    const words = searchStr.split(' ').filter(w => w.length >= 3);
    if (words.length > 0) {
      const similar = bpmProcesses.items.find(p => 
        p.bpmCode && words.some(w => p.name.toLowerCase().includes(w))
      );
      if (similar?.bpmCode) {
        setBpmCode(similar.bpmCode);
      }
    }
  };

  const [selectedProcessIds, setSelectedProcessIds] = React.useState<string[]>([]);
  const [expandedProcessIds, setExpandedProcessIds] = React.useState<Set<string>>(new Set());
  const [isMigrationModalOpen, setIsMigrationModalOpen] = React.useState(false);

  const deleteBPMMutation = useMutation({
    mutationFn: (id: string) => api(`/api/bpm-processes/${id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      setSelectedBpmId(null);
      setSelectedProcessIds(prev => prev.filter(itemId => itemId !== variables));
      toast.success(t('common:notifications.deleted'));
    }
  });

  const batchReorganizeMutation = useMutation({
    mutationFn: (payload: { action: 'demote' | 'promote'; targetParentId?: string; processIds: string[] }) =>
      api('/api/bpm-processes/batch-reorganize', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      setSelectedProcessIds([]);
      setIsMigrationModalOpen(false);
      toast.success(
        variables.action === 'demote'
          ? t('bpm:migration.demoteSuccess', 'Sub-proses berhasil dikelompokkan ke proses induk')
          : t('bpm:migration.promoteSuccess', 'Sub-proses berhasil diangkat menjadi proses mandiri')
      );
    },
    onError: (err: any) => {
      toast.error(err.message || t('bpm:migration.error', 'Gagal memproses reorganisasi proses'));
    }
  });

  const filteredBpmProcesses = React.useMemo(() => {
    if (!bpmProcesses?.items) return [];
    return bpmProcesses.items.filter(bpm => bpm.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [bpmProcesses, searchTerm]);

  const hierarchicalProcesses = React.useMemo(() => {
    if (!bpmProcesses?.items) return [];
    return buildProcessTree(bpmProcesses.items, searchTerm);
  }, [bpmProcesses, searchTerm]);

  const candidateParentProcesses = React.useMemo(() => {
    if (!bpmProcesses?.items) return [];
    return bpmProcesses.items.filter(p => !p.parentId && !selectedProcessIds.includes(p.id));
  }, [bpmProcesses, selectedProcessIds]);

  const toggleSelectProcess = (id: string) => {
    setSelectedProcessIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!bpmProcesses?.items) return;
    const allIds = bpmProcesses.items.map(p => p.id);
    if (selectedProcessIds.length === allIds.length) {
      setSelectedProcessIds([]);
    } else {
      setSelectedProcessIds(allIds);
    }
  };

  const clearSelection = () => {
    setSelectedProcessIds([]);
  };

  const toggleExpandProcess = (id: string) => {
    setExpandedProcessIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!bpmProcesses?.items) return;
    const parentIds = bpmProcesses.items.filter(p => !p.parentId).map(p => p.id);
    setExpandedProcessIds(new Set(parentIds));
  };

  const collapseAll = () => {
    setExpandedProcessIds(new Set());
  };

  return {
    t,
    viewYear,
    selectedFsli,
    setSelectedFsli,
    selectedAccountKey,
    setSelectedAccountKey,
    selectedBpmId,
    setSelectedBpmId,
    isModalOpen,
    setIsModalOpen,
    isCsaModalOpen,
    setIsCsaModalOpen,
    selectedBpmName,
    setSelectedBpmName,
    isBpmEditorOpen,
    selectedDiagramId,
    currentSubProcess,
    currentBpmProcessId,
    isCreatingBPM,
    setIsCreatingBPM,
    bpmName,
    setBpmName: setBpmNameWithFuzzy,
    bpmCode,
    setBpmCode,
    searchTerm,
    setSearchTerm,
    selectedProcess,
    setSelectedProcess,
    localAssertion,
    setLocalAssertion,
    handleOpenDiagram,
    handleCloseDiagram,
    queryClient,

    // Hierarchy & Selection States
    selectedProcessIds,
    setSelectedProcessIds,
    toggleSelectProcess,
    toggleSelectAll,
    clearSelection,
    expandedProcessIds,
    toggleExpandProcess,
    expandAll,
    collapseAll,
    isMigrationModalOpen,
    setIsMigrationModalOpen,

    // Queries
    activeSim,
    simLoading,
    activeSnap,
    snapLoading,
    currentUser,
    settings,
    accountAssertion,
    assertionLoading,
    bpmProcesses,
    bpmLoading,
    diagrams,

    // Derived properties
    significantFsliNames,
    glNumbers,
    selectedGLRow,
    departmentName,
    hasAccess,
    filteredBpmProcesses,
    hierarchicalProcesses,
    candidateParentProcesses,
    isAssertionDirty,

    // Mutations
    updateAssertionMutation,
    createDiagramMutation,
    createBPMMutation,
    deleteBPMMutation,
    batchReorganizeMutation,

    // Actions
    handleAssertionChange,
    handleSaveAssertions,
  };
}
