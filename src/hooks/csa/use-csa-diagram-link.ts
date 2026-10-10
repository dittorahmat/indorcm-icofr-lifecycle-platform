import { useMemo } from 'react';
import { BPMDiagram } from '@shared/types';
import { regulatoryPairsOf } from '@/components/rcm/editor/utils/bpm-control-linkage';

export function useCSADiagramLink(diagram?: BPMDiagram, propControls: any[] = []) {
  const bpmRiskControlPairs = useMemo(() => {
    if (!diagram?.nodes) return [];
    const pairs: { riskId: string; riskName: string; controlId: string; controlName: string; code: string }[] = [];
    
    diagram.nodes.forEach((node: any) => {
      const nodePairs = regulatoryPairsOf(node.data);
      
      if ((node.type === 'activity' || node.type === 'automated-activity') && nodePairs.length > 0) {
        nodePairs.forEach((reg: any) => {
          if (reg.riskId && reg.controlId) {
            pairs.push({
              riskId: reg.riskId,
              riskName: reg.riskDescription || "N/A",
              controlId: reg.controlId,
              controlName: reg.controlDescription || node.data.label || "N/A",
              code: reg.controlId
            });
          }
        });
      }
    });
    return pairs;
  }, [diagram]);

  const activeControls = useMemo(() => {
    if (bpmRiskControlPairs.length > 0) {
      const seen = new Set();
      return bpmRiskControlPairs.filter(p => {
        const isNew = !seen.has(p.controlId);
        seen.add(p.controlId);
        return isNew;
      }).map(p => ({ id: p.controlId, name: p.controlName, code: p.code, description: p.riskName }));
    }
    return propControls;
  }, [bpmRiskControlPairs, propControls]);

  return {
    bpmRiskControlPairs,
    activeControls
  };
}
