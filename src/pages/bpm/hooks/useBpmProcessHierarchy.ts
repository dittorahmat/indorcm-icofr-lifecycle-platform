import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { BPMDiagram, BPMProcess } from '@shared/types';
import { buildProcessTree } from '../utils/bpm-process-tree';

interface UseBpmProcessHierarchyArgs {
  viewYear: string;
  selectedAccountKey: string;
}

/**
 * The BPM process tree for the selected GL account: its query, the search
 * filter, the multi-select/expand sets, and the migration-modal flag.
 *
 * Owns no mutations and no scoping state; `useBpmScopingSelection` supplies
 * `selectedAccountKey`.
 */
export function useBpmProcessHierarchy({ viewYear, selectedAccountKey }: UseBpmProcessHierarchyArgs) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedProcess, setSelectedProcess] = React.useState<BPMProcess | null>(null);
  const [selectedProcessIds, setSelectedProcessIds] = React.useState<string[]>([]);
  const [expandedProcessIds, setExpandedProcessIds] = React.useState<Set<string>>(new Set());
  const [isMigrationModalOpen, setIsMigrationModalOpen] = React.useState(false);

  const { data: bpmProcesses, isLoading: bpmLoading } = useQuery({
    queryKey: ['bpm-processes', selectedAccountKey, viewYear],
    queryFn: () => {
      const noGL = selectedAccountKey.split(' ||| ')[0];
      return api<{ items: BPMProcess[] }>(`/api/bpm-processes?noGL=${noGL}&year=${viewYear}`);
    },
    enabled: !!selectedAccountKey,
  });

  const { data: diagrams } = useQuery({
    queryKey: ['bpm-diagrams', viewYear],
    queryFn: () => api<{ items: BPMDiagram[] }>(`/api/bpm-diagrams?year=${viewYear}`),
  });

  const hierarchicalProcesses = React.useMemo(() => {
    if (!bpmProcesses?.items) return [];
    return buildProcessTree(bpmProcesses.items, searchTerm);
  }, [bpmProcesses, searchTerm]);

  const candidateParentProcesses = React.useMemo(() => {
    if (!bpmProcesses?.items) return [];
    return bpmProcesses.items.filter((p) => !p.parentId && !selectedProcessIds.includes(p.id));
  }, [bpmProcesses, selectedProcessIds]);

  const toggleSelectProcess = (id: string) => {
    setSelectedProcessIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (!bpmProcesses?.items) return;
    const allIds = bpmProcesses.items.map((p) => p.id);
    setSelectedProcessIds(selectedProcessIds.length === allIds.length ? [] : allIds);
  };

  const clearSelection = () => setSelectedProcessIds([]);

  const toggleExpandProcess = (id: string) => {
    setExpandedProcessIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (!bpmProcesses?.items) return;
    setExpandedProcessIds(new Set(bpmProcesses.items.filter((p) => !p.parentId).map((p) => p.id)));
  };

  const collapseAll = () => setExpandedProcessIds(new Set());

  return {
    bpmProcesses,
    bpmLoading,
    diagrams,
    searchTerm,
    setSearchTerm,
    selectedProcess,
    setSelectedProcess,
    selectedProcessIds,
    setSelectedProcessIds,
    candidateParentProcesses,
    hierarchicalProcesses,
    toggleSelectProcess,
    toggleSelectAll,
    clearSelection,
    expandedProcessIds,
    toggleExpandProcess,
    expandAll,
    collapseAll,
    isMigrationModalOpen,
    setIsMigrationModalOpen,
  };
}
