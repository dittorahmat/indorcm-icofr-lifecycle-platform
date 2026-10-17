import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { csaKeysForYear, invalidateCsaYear } from './csa-keys';

describe('csa year-scoped keys', () => {
  it('carries the year tuple on the fetch keys', () => {
    const keys = csaKeysForYear('p1', '2026');
    expect(keys.list).toEqual(['csa-list', 'p1', '2026']);
    expect(keys.worklist).toEqual(['csa-worklist', '2026']);
    // The schedule list is organisation-wide: intentionally not year-scoped.
    expect(keys.schedules).toEqual(['csa-schedules']);
  });

  it('keeps process and year distinct so one year cannot absorb another', () => {
    expect(csaKeysForYear('p1', '2026').list).not.toEqual(csaKeysForYear('p1', '2025').list);
    expect(csaKeysForYear('p1', '2026').list).not.toEqual(csaKeysForYear('p2', '2026').list);
  });

  it('invalidates every year-scoped key with the same year tuple', async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'invalidateQueries');

    await invalidateCsaYear(client, 'p1', '2026');

    expect(spy).toHaveBeenCalledWith({ queryKey: ['csa-list', 'p1', '2026'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['csa-worklist', '2026'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['csa-schedules'] });
  });
});
