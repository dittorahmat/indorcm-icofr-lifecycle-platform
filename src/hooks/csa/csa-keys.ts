import type { QueryClient } from '@tanstack/react-query';

/**
 * Single owner for the year-scoped CSA query keys.
 *
 * `CODING_STANDARDS.md` §"Year-scoped query keys invalidate with the year":
 * the fetch key carries `year` and every invalidation of that data carries the
 * same year tuple. A bare `['csa-list']` / `['csa-worklist']` busts all years
 * and defeats the backend `year` filter (the Belum-Dinilai tab then reads a
 * different year's cache).
 *
 * The schedule list (`/api/csa/schedules`) is organisation-wide and has no
 * `year` param, so it is deliberately part of the same owner but not of the
 * year tuple.
 */
export function csaKeysForYear(bpmProcessId: string, year: string) {
  return {
    list: ['csa-list', bpmProcessId, year] as const,
    worklist: ['csa-worklist', year] as const,
    schedules: ['csa-schedules'] as const,
  };
}

/** Invalidate every CSA view touched by a write, for one process + year. */
export async function invalidateCsaYear(
  queryClient: QueryClient,
  bpmProcessId: string,
  year: string,
): Promise<void> {
  const keys = csaKeysForYear(bpmProcessId, year);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: keys.list }),
    queryClient.invalidateQueries({ queryKey: keys.worklist }),
    queryClient.invalidateQueries({ queryKey: keys.schedules }),
  ]);
}
