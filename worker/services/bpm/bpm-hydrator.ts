import { rcms, rcmControls, bpmNodeRcms } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { DrizzleDb } from '../../db';
import {
  BPM_NON_SYNC_NODE_TYPES,
  extractBaseId,
  makeGlSpecificId,
} from '@shared/control-linkage';

export class BpmHydrator {
  constructor(private db: DrizzleDb) {}

  setDb(db: DrizzleDb) {
    this.db = db;
  }

  async hydrateDiagramNodes(diagramId: string, nodes: any[], noGL?: string) {
    return await Promise.all(nodes.map(async (node: any) => {
      if (node.type && !BPM_NON_SYNC_NODE_TYPES.includes(node.type)) {
        const allMappings = await this.db.select({
          risk: rcms,
          map: rcmControls
        })
        .from(bpmNodeRcms)
        .innerJoin(rcms, eq(bpmNodeRcms.rcmId, rcms.id))
        .leftJoin(rcmControls, eq(rcms.id, rcmControls.rcmId))
        .where(and(
          eq(bpmNodeRcms.diagramId, diagramId),
          eq(bpmNodeRcms.nodeId, node.id)
        ));

        let selectedMappings = allMappings;
        if (noGL && allMappings.length > 0) {
          const glMappings = allMappings.filter(m => m.risk.id.endsWith(`-${noGL}`));
          if (glMappings.length > 0) {
            selectedMappings = glMappings;
          } else {
            selectedMappings = allMappings.map(m => {
              const adaptedRiskId = makeGlSpecificId(m.risk.id, noGL);
              const adaptedControlId = m.map?.controlId ? makeGlSpecificId(m.map.controlId, noGL) : `C-TBD-${noGL}`;
              return {
                ...m,
                risk: {
                  ...m.risk,
                  id: adaptedRiskId
                },
                map: m.map ? {
                  ...m.map,
                  rcmId: adaptedRiskId,
                  controlId: adaptedControlId
                } : null
              };
            });
          }
        }

        const regulatoryPairs = selectedMappings.map((m: any) => ({
          riskId: extractBaseId(m.risk.id),
          riskDescription: m.risk.riskDescription,
          isFraudRelated: m.risk.isFraudRelated,
          riskRating: m.risk.riskRating,
          controlId: m.map?.controlId ? extractBaseId(m.map.controlId) : (noGL ? `C-TBD-${noGL}` : 'C-TBD'),
          controlDescription: m.map?.controlDescription || '',
          isKeyControl: m.map?.isKeyControl || false,
          classification: m.map?.controlType || 'TLC',
          ipoC: m.map?.ipoC,
          ipoA: m.map?.ipoA,
          ipoV: m.map?.ipoV,
          ipoRa: m.map?.ipoRa,
          cosoPrinciples: m.map?.cosoPrinciples,
          itgcDomain: m.map?.itgcDomain,
          itgcAssertions: m.map?.itgcAssertions,
        }));

        return {
          ...node,
          data: {
            ...node.data,
            regulatoryPairs
          }
        };
      }
      return node;
    }));
  }
}
