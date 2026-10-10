/**
 * bpm-control-linkage — single Control Linkage mapping module (SK-5/DKU.MBU/11/2024).
 *
 * Every read of a BPM node's linked risks/controls crosses this seam:
 * badge sync, Unmapped Controls, property sheets, and CSA diagram links.
 * Node data carries three historical shapes (regulatoryPairs, legacy
 * regulatoryData, legacy risks); only this module knows the precedence.
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
