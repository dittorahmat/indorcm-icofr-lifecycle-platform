import { describe, expect, it, vi } from 'vitest';
import type { DrizzleDb } from '../../db';
import { CsaDomainService } from '../csa-domain-service';
import { ControlService } from '../control-service';

function makeStubDb() {
  const queries: unknown[] = [];
  const orderBy = vi.fn(() => Promise.resolve([{ id: 'sched-1', plannedDate: new Date('2025-06-01') }]));
  const where = vi.fn((cond: unknown) => {
    queries.push(cond);
    return Object.assign(Promise.resolve([{ id: 'sched-1', plannedDate: new Date('2025-06-01') }]), { orderBy });
  });
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const db: DrizzleDb = Object.create(null);
  Object.assign(db, { select });
  return { db, select, from, where, queries };
}

function extractSql(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return String(obj);
  if ('queryChunks' in obj) {
    const chunks = (obj as { queryChunks: unknown[] }).queryChunks;
    return chunks.map(c => extractSql(c)).join(' ');
  }
  if ('value' in obj) {
    return String((obj as { value: unknown }).value);
  }
  return '';
}

describe('Year filtering on backend services', () => {
  it('CsaDomainService.getSchedules filters by plannedDate year when year is specified', async () => {
    const { db, where, queries } = makeStubDb();
    const service = new CsaDomainService(db);

    const result = await service.getSchedules('org-1', 2025);

    expect(result).toHaveLength(1);
    expect(where).toHaveBeenCalledTimes(1);
    const condStr = extractSql(queries[0]);
    expect(condStr).toContain('EXTRACT');
    expect(condStr).toContain('2025');
  });

  it('CsaDomainService.getSchedules queries by orgId only when year is omitted', async () => {
    const { db, where, queries } = makeStubDb();
    const service = new CsaDomainService(db);

    const result = await service.getSchedules('org-1');

    expect(result).toHaveLength(1);
    expect(where).toHaveBeenCalledTimes(1);
    const condStr = extractSql(queries[0]);
    expect(condStr).not.toContain('EXTRACT');
  });

  it('ControlService.getAll filters by controls.year when year is specified', async () => {
    const { db, where } = makeStubDb();
    const service = new ControlService(db);

    await service.getAll('org-1', undefined, 2026);

    expect(where).toHaveBeenCalledTimes(1);
  });

  it('ControlService.getAll queries by orgId only when year is omitted', async () => {
    const { db, where } = makeStubDb();
    const service = new ControlService(db);

    await service.getAll('org-1');

    expect(where).toHaveBeenCalledTimes(1);
  });
});
