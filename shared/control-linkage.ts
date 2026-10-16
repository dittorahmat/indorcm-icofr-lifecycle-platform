/**
 * control-linkage — single Control Linkage canonicalizer (SK-5/DKU.MBU/11/2024).
 *
 * One module owns regulatoryPairs precedence, base↔GL id mapping, and the
 * Unmapped Controls key resolution. The frontend seam (badge sync, Unmapped
 * Controls panel, property sheets, CSA diagram links) and the worker
 * adapters (bpm-sync, hydrator) both leverage this module, so linkage
 * semantics are reviewed in one place.
 */

export type RegulatoryPair = Record<string, unknown>;

export interface NodeDataLike {
  regulatoryPairs?: unknown;
  regulatoryData?: unknown;
  risks?: unknown;
}

export interface NodeLike {
  id: string;
  data?: NodeDataLike | null;
}

export interface MatrixItemLike {
  rcmId?: unknown;
  mappingId?: unknown;
  riskId?: unknown;
  id?: unknown;
}

/** Node types that never carry Control Linkage (shared by editor, sync, hydrator). */
export const BPM_NON_SYNC_NODE_TYPES: readonly string[] = ['start', 'end', 'reference', 'swimlane'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Pairs linked to one node. Prefers regulatoryPairs, falls back to legacy regulatoryData. */
export function regulatoryPairsOf(data: NodeDataLike | null | undefined): RegulatoryPair[] {
  if (!isRecord(data)) return [];
  if (Array.isArray(data.regulatoryPairs)) {
    return data.regulatoryPairs.filter(isRecord);
  }
  if (isRecord(data.regulatoryData)) return [data.regulatoryData];
  return [];
}

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function pairRiskId(pair: RegulatoryPair): string | null {
  return textOf(pair['riskId']);
}

/** Badge-sync surface: distinct linked risk and control ids. */
export function linkedIdsOf(pairs: RegulatoryPair[]): { riskIds: string[]; controlIds: string[] } {
  const riskIds = Array.from(
    new Set(pairs.map(pairRiskId).filter((id): id is string => id !== null)),
  );
  const controlIds = Array.from(
    new Set(pairs.map((pair) => textOf(pair['controlId'])).filter((id): id is string => id !== null)),
  );
  return { riskIds, controlIds };
}

function legacyRiskIdsOf(data: NodeDataLike): string[] {
  if (!Array.isArray(data.risks)) return [];
  const ids: string[] = [];
  for (const risk of data.risks) {
    if (!isRecord(risk)) continue;
    const id = textOf(risk['rcmId']);
    if (id) ids.push(id);
  }
  return ids;
}

/** Every risk id linked from any node, including the legacy risks shape. */
export function mappedRiskIdsFromNodes(nodes: NodeLike[]): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (!isRecord(node.data)) continue;
    const pairs = regulatoryPairsOf(node.data);
    for (const pair of pairs) {
      const id = pairRiskId(pair);
      if (id) ids.add(id);
    }
    // Legacy shape predates regulatoryPairs: only consulted when no pairs exist.
    if (pairs.length === 0) {
      for (const id of legacyRiskIdsOf(node.data)) ids.add(id);
    }
  }
  return ids;
}

function itemKeyOf(item: MatrixItemLike): string | null {
  // Order mirrors the historical inline filter: rcmId, mappingId prefix, riskId, id.
  return (
    textOf(item.rcmId) ??
    (textOf(item.mappingId)?.split(':')[0] || null) ??
    textOf(item.riskId) ??
    textOf(item.id)
  );
}

/** Matrix rows with no linked node. Pure: feeds the Unmapped Controls panel. */
export function unmappedControlsFrom<T extends MatrixItemLike>(items: T[], nodes: NodeLike[]): T[] {
  const mapped = mappedRiskIdsFromNodes(nodes);
  return items.filter((item) => {
    const key = itemKeyOf(item);
    return !key || !mapped.has(key);
  });
}

export function extractBaseId(id: string): string {
  if (!id) return id;

  const legacyMatch = id.match(/^([RC]-\d+)(?:-(.+))?$/i);
  if (legacyMatch) {
    return legacyMatch[1];
  }

  const parts = id.split('-');
  if (parts.length > 1) {
    let seqIndex = -1;
    for (let i = 1; i < parts.length; i++) {
      if (/^\d{3,}$/.test(parts[i])) { // Require at least 3 digits to be confident it's a seq
        seqIndex = i;
        break;
      }
    }

    if (seqIndex !== -1) {
      if (seqIndex < parts.length - 1) {
        return parts.slice(0, seqIndex + 1).join('-');
      }
      return id;
    }

    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart) || lastPart.length >= 4) {
      return parts.slice(0, -1).join('-');
    }
  }
  return id;
}

export function makeGlSpecificId(baseId: string, glCode: string): string {
  if (!glCode) return baseId;
  const base = extractBaseId(baseId);
  return `${base}-${glCode}`;
}

/** Node surface the sync collection needs. */
export interface SyncNodeLike {
  id: string;
  type?: unknown;
  data?: (NodeDataLike & { label?: unknown }) | null;
}

export interface RiskEntryToSync {
  riskId: string;
  reg: RegulatoryPair;
  nodeId: string;
}

export interface ControlEntryToSync {
  ctrlId: string;
  riskId: string;
  reg: RegulatoryPair;
  noGL: string | null;
  nodeLabel?: string;
}

export interface NodeRcmPairToInsert {
  id: string;
  organizationId: string;
  diagramId: string;
  nodeId: string;
  rcmId: string;
}

export interface NodeSyncEntries {
  risksToSync: Map<string, RiskEntryToSync>;
  controlsToSync: Map<string, ControlEntryToSync>;
  nodeRcmPairs: NodeRcmPairToInsert[];
  activeRiskIds: Set<string>;
  activeControlIds: Set<string>;
  activeRiskControlPairs: Set<string>;
}

function syncableNode(node: SyncNodeLike): boolean {
  return typeof node.type === 'string' && !BPM_NON_SYNC_NODE_TYPES.includes(node.type);
}

function nodeLabelOf(node: SyncNodeLike): string | undefined {
  const label = node.data?.label;
  return typeof label === 'string' ? label : undefined;
}

function legacyRiskEntriesOf(data: NodeDataLike): RegulatoryPair[] {
  if (!Array.isArray(data.risks)) return [];
  return data.risks.filter(isRecord);
}

/**
 * Pure collection behind the BPM sync fan-out: node pairs (shared
 * precedence) and legacy risks (only when no pairs) fanned out per GL
 * code into sync maps, node-pair rows, and active sets. The manager
 * persists these collections; it no longer walks node data itself.
 */
export function collectNodeSyncEntries(
  nodes: SyncNodeLike[],
  glCodes: string[],
  ids: { organizationId: string; diagramId: string },
  newId: () => string = () => crypto.randomUUID(),
): NodeSyncEntries {
  const risksToSync = new Map<string, RiskEntryToSync>();
  const controlsToSync = new Map<string, ControlEntryToSync>();
  const nodeRcmPairs: NodeRcmPairToInsert[] = [];
  const activeRiskIds = new Set<string>();
  const activeControlIds = new Set<string>();
  const activeRiskControlPairs = new Set<string>();
  const insertedRiskIdsForNode = new Set<string>();

  const trackPair = (nodeId: string, riskId: string) => {
    const pairKey = `${nodeId}:${riskId}`;
    if (insertedRiskIdsForNode.has(pairKey)) return;
    nodeRcmPairs.push({
      id: newId(),
      organizationId: ids.organizationId,
      diagramId: ids.diagramId,
      nodeId,
      rcmId: riskId,
    });
    insertedRiskIdsForNode.add(pairKey);
  };

  for (const node of nodes) {
    if (!syncableNode(node) || !node.data) continue;
    const nodePairs = regulatoryPairsOf(node.data);

    if (nodePairs.length > 0) {
      for (const reg of nodePairs) {
        const rawRiskId = reg.riskId;
        const rawCtrlId = reg.controlId;
        if (typeof rawRiskId !== 'string' || !rawRiskId || typeof rawCtrlId !== 'string' || !rawCtrlId) continue;
        const baseRiskId = extractBaseId(rawRiskId);
        const baseCtrlId = extractBaseId(rawCtrlId);

        for (const gl of glCodes) {
          const riskId = makeGlSpecificId(baseRiskId, gl);
          const ctrlId = makeGlSpecificId(baseCtrlId, gl);

          activeRiskIds.add(riskId);
          activeControlIds.add(ctrlId);
          activeRiskControlPairs.add(`${riskId}:${ctrlId}`);

          risksToSync.set(riskId, { riskId, reg, nodeId: node.id });
          controlsToSync.set(ctrlId, {
            ctrlId,
            riskId,
            reg,
            noGL: gl || null,
            nodeLabel: nodeLabelOf(node),
          });
          trackPair(node.id, riskId);
        }
      }
    } else {
      // Legacy support for nodes with only .risks
      for (const riskEntry of legacyRiskEntriesOf(node.data)) {
        const rawRiskId = riskEntry.rcmId;
        if (typeof rawRiskId !== 'string' || !rawRiskId) continue;
        const baseRiskId = extractBaseId(rawRiskId);
        for (const gl of glCodes) {
          const riskId = makeGlSpecificId(baseRiskId, gl);
          activeRiskIds.add(riskId);

          risksToSync.set(riskId, { riskId, reg: riskEntry, nodeId: node.id });
          trackPair(node.id, riskId);

          const controlIds = riskEntry.controlIds;
          if (Array.isArray(controlIds)) {
            for (const ctrlIdEntry of controlIds) {
              if (typeof ctrlIdEntry !== 'string' || !ctrlIdEntry) continue;
              const ctrlId = makeGlSpecificId(extractBaseId(ctrlIdEntry), gl);
              activeRiskControlPairs.add(`${riskId}:${ctrlId}`);
              activeRiskIds.add(riskId);
              activeControlIds.add(ctrlId);
            }
          }
        }
      }
    }
  }

  return { risksToSync, controlsToSync, nodeRcmPairs, activeRiskIds, activeControlIds, activeRiskControlPairs };
}

/* Pair-editing locality: key-resolution + grouping + mutation behind one seam.
 * The property-sheet hook stays a thin React adapter (state + commit). */

function pairText(pair: RegulatoryPair, key: string): string | undefined {
  const v = pair[key];
  return typeof v === 'string' ? v : undefined;
}

/** Canonical risk identity: temp id wins over persisted id. */
export function riskKeyOf(pair: RegulatoryPair): string | null {
  return pairText(pair, '_tempRiskId') ?? pairText(pair, 'riskId') ?? null;
}

export function matchesRiskKey(pair: RegulatoryPair, riskKey: string): boolean {
  return pairText(pair, 'riskId') === riskKey || pairText(pair, '_tempRiskId') === riskKey;
}

export interface RiskGroup {
  risk: {
    _tempRiskId?: string;
    riskId?: string;
    riskDescription?: string;
    riskSource?: string;
    isFraudRelated?: boolean;
    riskRating?: string;
  };
  controls: { data: RegulatoryPair; index: number }[];
}

export function groupPairsByRisk(pairs: readonly RegulatoryPair[]): RiskGroup[] {
  const groups = new Map<string, RiskGroup>();
  pairs.forEach((p, index) => {
    const key = riskKeyOf(p) ?? `R-GROUP-${groups.size}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        risk: {
          _tempRiskId: pairText(p, '_tempRiskId'),
          riskId: pairText(p, 'riskId'),
          riskDescription: pairText(p, 'riskDescription'),
          riskSource: pairText(p, 'riskSource'),
          isFraudRelated: p['isFraudRelated'] === true,
          riskRating: pairText(p, 'riskRating'),
        },
        controls: [],
      };
      groups.set(key, group);
    }
    group.controls.push({ data: p, index });
  });
  return [...groups.values()];
}

export function duplicateIdSet(
  pairs: readonly RegulatoryPair[],
  key: 'riskId' | 'controlId',
): Set<string> {
  const ids = pairs.map((p) => pairText(p, key)?.trim()).filter((id): id is string => Boolean(id));
  return new Set(ids.filter((id, idx) => ids.indexOf(id) !== idx));
}

export function updateAllPairsForRisk(
  pairs: readonly RegulatoryPair[],
  riskKey: string,
  field: string,
  value: unknown,
): RegulatoryPair[] {
  return pairs.map((p) => (matchesRiskKey(p, riskKey) ? { ...p, [field]: value } : p));
}

export function updatePairAt(
  pairs: readonly RegulatoryPair[],
  pairIndex: number,
  field: string,
  value: unknown,
): RegulatoryPair[] {
  const next = [...pairs];
  next[pairIndex] = { ...next[pairIndex], [field]: value };
  return next;
}

export function applyRiskDescriptionTo(
  pairs: readonly RegulatoryPair[],
  riskKey: string,
  description: string,
  source: 'ai' | 'manual',
): RegulatoryPair[] {
  return pairs.map((p) =>
    matchesRiskKey(p, riskKey) ? { ...p, riskDescription: description, riskSource: source } : p,
  );
}

export function removeRiskFrom(pairs: readonly RegulatoryPair[], riskKey: string): RegulatoryPair[] {
  return pairs.filter((p) => !matchesRiskKey(p, riskKey));
}

export function removePairAtIndex(pairs: readonly RegulatoryPair[], index: number): RegulatoryPair[] {
  return pairs.filter((_, i) => i !== index);
}
