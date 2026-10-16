import { useMemo } from 'react';
import {
  applyRiskDescriptionTo,
  duplicateIdSet,
  groupPairsByRisk,
  regulatoryPairsOf,
  removePairAtIndex,
  removeRiskFrom,
  updateAllPairsForRisk,
  updatePairAt,
} from '@shared/control-linkage';
import type { NodeDataLike, RegulatoryPair, RiskGroup } from '@shared/control-linkage';
import type { AiSuggestionContext } from './AiSuggestionPopover';
import type { RiskGroupData } from './RiskGroupCard';

export type SuggestionBase = Omit<AiSuggestionContext, 'nodeLabel' | 'riskDescription'>;

export interface PairSequenceData {
  nextRiskSeq: number;
  nextControlSeq: number;
  bpmCode: string;
}

export interface UseRegulatoryPairsParams {
  nodeId: string;
  nodeData: NodeDataLike | null | undefined;
  nodes: { data?: unknown }[];
  sequenceData: PairSequenceData | undefined;
  onUpdateNodeData: (id: string, data: Record<string, unknown>) => void;
}

export { duplicateIdSet, groupPairsByRisk };
export type { RiskGroup };

function str(p: RegulatoryPair, key: string): string | undefined {
  const v = p[key];
  return typeof v === 'string' ? v : undefined;
}

export function generatePairId(
  type: 'risk' | 'control',
  sequenceData: PairSequenceData | undefined,
  nodes: { data?: unknown }[],
): string {
  const prefix = type === 'risk' ? 'R' : 'C';
  if (!sequenceData?.bpmCode) return `${prefix}-${crypto.randomUUID().substring(0, 8)}`;
  let maxVal = type === 'risk' ? sequenceData.nextRiskSeq - 1 : sequenceData.nextControlSeq - 1;
  for (const node of nodes) {
    for (const p of regulatoryPairsOf(node.data as NodeDataLike | undefined)) {
      const id = type === 'risk' ? str(p, 'riskId') || str(p, '_tempRiskId') : str(p, 'controlId') || str(p, '_tempControlId');
      if (id?.startsWith(`${prefix}-${sequenceData.bpmCode}-`)) {
        const seq = parseInt(id.split('-')[2] ?? '', 10);
        if (!Number.isNaN(seq) && seq > maxVal) maxVal = seq;
      }
    }
  }
  return `${prefix}-${sequenceData.bpmCode}-${(maxVal + 1).toString().padStart(4, '0')}`;
}

export function newRiskTemplate(riskId: string, controlId: string): RegulatoryPair {
  return {
    _tempRiskId: riskId,
    _tempControlId: controlId,
    riskId,
    controlId,
    riskDescription: '',
    controlDescription: '',
    isFraudRelated: false,
    riskRating: 'Low',
    isKeyControl: false,
    classification: 'TLC',
    controlType: 'Preventif',
    controlNature: 'Manual',
    frequency: 'Bulanan',
    ipoC: 'N',
    ipoA: 'N',
    ipoV: 'N',
    ipoRa: 'N',
  };
}

export function controlTemplateFor(template: RegulatoryPair | undefined, controlId: string): RegulatoryPair {
  return {
    ...template,
    controlId,
    _tempControlId: controlId,
    controlDescription: '',
    isKeyControl: false,
    controlType: 'Preventif',
    controlNature: 'Manual',
    frequency: 'Bulanan',
    ipoC: 'N',
    ipoA: 'N',
    ipoV: 'N',
    ipoRa: 'N',
    cosoPrinciples: [],
    itgcAssertions: {},
  };
}

export function suggestBaseFor(base: SuggestionBase | undefined, nodeLabel: string): AiSuggestionContext | null {
  if (!base?.bpmName) return null;
  return { ...base, nodeLabel };
}

/** Thin React adapter: memoised views + commit; mutation lives in control-linkage. */
export function useRegulatoryPairs({ nodeId, nodeData, nodes, sequenceData, onUpdateNodeData }: UseRegulatoryPairsParams) {
  const pairs = useMemo(() => regulatoryPairsOf(nodeData), [nodeData]);
  const groupedRisks: RiskGroupData[] = useMemo(() => groupPairsByRisk(pairs), [pairs]);
  const duplicateRiskIds = useMemo(() => duplicateIdSet(pairs, 'riskId'), [pairs]);
  const duplicateControlIds = useMemo(() => duplicateIdSet(pairs, 'controlId'), [pairs]);

  const commit = (nextPairs: RegulatoryPair[]) => onUpdateNodeData(nodeId, { regulatoryPairs: nextPairs });

  return {
    pairs,
    groupedRisks,
    duplicateRiskIds,
    duplicateControlIds,
    updateAllPairsForRisk: (riskKey: string, field: string, value: unknown) =>
      commit(updateAllPairsForRisk(pairs, riskKey, field, value)),
    updateSpecificControl: (pairIndex: number, field: string, value: unknown) =>
      commit(updatePairAt(pairs, pairIndex, field, value)),
    applyRiskDescription: (riskKey: string, description: string, source: 'ai' | 'manual') =>
      commit(applyRiskDescriptionTo(pairs, riskKey, description, source)),
    addNewRisk: () => {
      commit([...pairs, newRiskTemplate(generatePairId('risk', sequenceData, nodes), generatePairId('control', sequenceData, nodes))]);
    },
    addControlToRisk: (riskKey: string) => {
      const template = pairs.find(
        (p) => str(p, 'riskId') === riskKey || str(p, '_tempRiskId') === riskKey,
      );
      commit([...pairs, controlTemplateFor(template, generatePairId('control', sequenceData, nodes))]);
    },
    removePairAt: (index: number) => commit(removePairAtIndex(pairs, index)),
    removeRisk: (riskKey: string) => commit(removeRiskFrom(pairs, riskKey)),
    suggestBaseFor,
  };
}
