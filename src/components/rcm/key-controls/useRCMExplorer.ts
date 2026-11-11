import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { RCMControlMapping, BUMNCluster } from '@shared/types';
import type { MitigationPillar, BusinessCycleCode } from './rcm-explorer-types';

export interface RCMMatrixItem extends RCMControlMapping {
  mappingId: string;
  processName: string;
  bpmCode?: string;
  parentProcessName?: string;
  parentBpmCode?: string;
  fsliName: string;
  noGL: string;
  subProcessName: string;
  riskDescription: string;
  isFraudRelated: boolean;
  riskRating: string;
  controlCode: string;
  baseControlName: string;
  baseControlDescription: string;
  mappedControlName?: string;
  mappedControlDescription?: string;
  companyName: string;
  locationCode: string;
  automatedSubNature?: string | null;
  diagramId?: string | null;
  nodeId?: string | null;
  itApplication?: string | null;
  pilarObjective?: string | null;
  pilarTiming?: string | null;
  pilarAuthority?: string | null;
  pilarReliability?: string | null;
  pilarCoverage?: string | null;
  pilarEvidence?: string | null;
  conclusion?: string | null;
}

export function useRCMExplorer(workingYear: string) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCluster, setActiveCluster] = React.useState<BUMNCluster | 'ALL'>('ALL');
  const [selectedCycle, setSelectedCycle] = React.useState<BusinessCycleCode>('ALL');
  const [selectedPillar, setSelectedPillar] = React.useState<MitigationPillar>('ALL');
  const [riskLevelFilter, setRiskLevelFilter] = React.useState('ALL');
  const [keyControlFilter, setKeyControlFilter] = React.useState('ALL');
  const [frequencyFilter, setFrequencyFilter] = React.useState('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rcm-matrix-tlc', workingYear],
    queryFn: () => api<{ items: RCMMatrixItem[] }>(`/api/rcm-matrix/tlc?year=${workingYear}`),
  });

  const rawItems = data?.items || [];

  // Filtered items
  const filteredItems = React.useMemo(() => {
    return rawItems.filter((item) => {
      // 1. Search term match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          (item.controlCode && item.controlCode.toLowerCase().includes(query)) ||
          (item.mappedControlName && item.mappedControlName.toLowerCase().includes(query)) ||
          (item.baseControlName && item.baseControlName.toLowerCase().includes(query)) ||
          (item.riskDescription && item.riskDescription.toLowerCase().includes(query)) ||
          (item.executorRole && item.executorRole.toLowerCase().includes(query)) ||
          (item.supportingApp && item.supportingApp.toLowerCase().includes(query)) ||
          (item.rcmId && item.rcmId.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // 2. Cycle match (O2C, P2P, R2R, FAM, ITGC, etc. checked against processName, subProcessName, or controlCode)
      if (selectedCycle !== 'ALL') {
        const cycleCode = selectedCycle.toLowerCase();
        const proc = (item.processName || item.parentProcessName || '').toLowerCase();
        const sub = (item.subProcessName || '').toLowerCase();
        const ctrl = (item.controlCode || '').toLowerCase();
        const rcm = (item.rcmId || '').toLowerCase();
        const matchesCycle =
          proc.includes(cycleCode) ||
          sub.includes(cycleCode) ||
          ctrl.includes(cycleCode) ||
          rcm.includes(cycleCode);
        if (!matchesCycle) return false;
      }

      // 3. Risk Level
      if (riskLevelFilter !== 'ALL') {
        const rRating = (item.riskRating || '').toLowerCase();
        if (rRating !== riskLevelFilter.toLowerCase()) return false;
      }

      // 4. Key Control filter
      if (keyControlFilter === 'KEY' && !item.isKeyControl) return false;
      if (keyControlFilter === 'NONKEY' && item.isKeyControl) return false;

      // 5. Frequency filter
      if (frequencyFilter !== 'ALL') {
        const freq = (item.frequency || '').toLowerCase();
        if (!freq.includes(frequencyFilter.toLowerCase())) return false;
      }

      // 6. Mitigation Pillar filter
      if (selectedPillar !== 'ALL') {
        const pVal = item[selectedPillar];
        if (!pVal || String(pVal).trim().length === 0) return false;
      }

      return true;
    });
  }, [
    rawItems,
    searchTerm,
    selectedCycle,
    riskLevelFilter,
    keyControlFilter,
    frequencyFilter,
    selectedPillar,
  ]);

  // Aggregate metrics
  const totalControls = rawItems.length;
  const keyControlsCount = rawItems.filter((i) => i.isKeyControl).length;
  const totalRisks = new Set(rawItems.map((i) => i.rcmId).filter(Boolean)).size;

  const preventiveCount = rawItems.filter(
    (i) => (i.controlType || '').toLowerCase() === 'preventive'
  ).length;
  const detectiveCount = totalControls - preventiveCount;

  const automatedCount = rawItems.filter(
    (i) =>
      (i.controlNature || '').toLowerCase().includes('auto') ||
      (i.controlNature || '').toLowerCase().includes('itdm') ||
      Boolean(i.automatedSubNature)
  ).length;
  const manualCount = totalControls - automatedCount;

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCycle('ALL');
    setSelectedPillar('ALL');
    setRiskLevelFilter('ALL');
    setKeyControlFilter('ALL');
    setFrequencyFilter('ALL');
  };

  return {
    rawItems,
    filteredItems,
    isLoading,
    refetch,
    searchTerm,
    setSearchTerm,
    activeCluster,
    setActiveCluster,
    selectedCycle,
    setSelectedCycle,
    selectedPillar,
    setSelectedPillar,
    riskLevelFilter,
    setRiskLevelFilter,
    keyControlFilter,
    setKeyControlFilter,
    frequencyFilter,
    setFrequencyFilter,
    handleResetFilters,
    totalControls,
    keyControlsCount,
    totalRisks,
    preventiveCount,
    detectiveCount,
    automatedCount,
    manualCount,
  };
}
