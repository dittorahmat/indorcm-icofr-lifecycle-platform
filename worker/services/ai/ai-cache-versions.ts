import { eq, desc } from 'drizzle-orm';
import { documents, simulations } from '../../db/schema';
import type { DrizzleDb } from '../../db';
import type { AiCacheVersions } from '@shared/ai-cache';

export interface AiCacheVersionLoaders {
  loadDocMarker(orgId: string): Promise<string>;
  loadApprovedSimulationId(orgId: string): Promise<string>;
}

/**
 * Derives the cache version binding (ADR-0007): Knowledge Base marker +
 * active Approved simulation id. Falls back to empty versions (uncached
 * behavior preserved) when loaders fail, so AI never breaks on DB errors.
 */
export async function getAiCacheVersions(
  loaders: AiCacheVersionLoaders,
  orgId: string,
): Promise<AiCacheVersions> {
  try {
    const [kbVersion, simulationId] = await Promise.all([
      loaders.loadDocMarker(orgId),
      loaders.loadApprovedSimulationId(orgId),
    ]);
    return { kbVersion, simulationId };
  } catch {
    return { kbVersion: '', simulationId: '' };
  }
}

/** Latest KB document marker per org: `<docId>@<createdAtMs>` ('' when none). */
export function createDocMarkerLoader(db: DrizzleDb): (orgId: string) => Promise<string> {
  return async (orgId: string) => {
    const rows = await db.select({ id: documents.id, createdAt: documents.createdAt })
      .from(documents).where(eq(documents.organizationId, orgId))
      .orderBy(desc(documents.createdAt)).limit(1);
    const top = rows[0];
    if (!top) return '';
    const stamp = top.createdAt instanceof Date ? top.createdAt.getTime() : 0;
    return `${top.id}@${stamp}`;
  };
}

/** Latest Approved simulation id per org ('' when none). */
export function createApprovedSimulationLoader(db: DrizzleDb): (orgId: string) => Promise<string> {
  return async (orgId: string) => {
    const rows = await db.select({ id: simulations.id, status: simulations.status })
      .from(simulations)
      .where(eq(simulations.organizationId, orgId))
      .orderBy(desc(simulations.createdAt)).limit(10);
    const approved = rows.filter((row) => row.status === 'Approved');
    const top = approved[0];
    if (!top) return '';
    return top.id;
  };
}
