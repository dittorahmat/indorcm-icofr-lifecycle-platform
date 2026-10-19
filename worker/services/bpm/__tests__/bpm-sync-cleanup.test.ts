import { describe, expect, it, vi } from 'vitest';
import type { DrizzleDb } from '../../../db';
import { rcms, rcmControls, controls } from '../../../db/schema';
import { BpmSyncManager } from '../bpm-sync';

interface ExecutedSql {
  sqlText: string;
}

function extractSqlText(query: unknown): string {
  if (typeof query === 'string') return query;
  if (query && typeof query === 'object' && 'queryChunks' in query) {
    const chunks = (query as { queryChunks: unknown[] }).queryChunks;
    return chunks
      .map(chunk => {
        if (typeof chunk === 'string') return chunk;
        if (chunk && typeof chunk === 'object' && 'value' in chunk) {
          return String((chunk as { value: unknown }).value);
        }
        return '';
      })
      .join(' ');
  }
  return String(query);
}

function makeMockDb(options: {
  diagramRisks?: Array<{ id: string }>;
  mappedControls?: Array<{ controlId: string | null }>;
  controlsByRcm?: Array<{ id: string }>;
  controlsByProcess?: Array<{ id: string }>;
  orphanControls?: Array<{ id: string }>;
} = {}) {
  const executedStatements: ExecutedSql[] = [];
  const deletedTables: unknown[] = [];
  const updatedTables: unknown[] = [];

  const execute = vi.fn(async (query: unknown) => {
    const sqlText = extractSqlText(query);
    executedStatements.push({ sqlText });

    // If this is the orphan check query
    if (sqlText.includes('SELECT id FROM controls') || sqlText.includes('NOT EXISTS')) {
      return { rows: options.orphanControls ?? [] };
    }
    return { rows: [] };
  });

  const select = vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn(async () => {
        if (table === rcms) {
          return options.diagramRisks ?? [];
        }
        if (table === rcmControls) {
          return options.mappedControls ?? [];
        }
        if (table === controls) {
          return [...(options.controlsByRcm ?? []), ...(options.controlsByProcess ?? [])];
        }
        return [];
      }),
    })),
  }));

  const deleteFn = vi.fn((table: unknown) => {
    deletedTables.push(table);
    return {
      where: vi.fn(async () => undefined),
    };
  });

  const updateFn = vi.fn((table: unknown) => {
    updatedTables.push(table);
    return {
      set: vi.fn(() => ({
        where: vi.fn(async () => undefined),
      })),
    };
  });

  const insertFn = vi.fn(() => ({
    values: vi.fn(async () => undefined),
  }));

  const db: DrizzleDb = Object.create(null);
  Object.assign(db, {
    execute,
    select,
    delete: deleteFn,
    update: updateFn,
    insert: insertFn,
  });

  return {
    db,
    execute,
    select,
    deleteFn,
    updateFn,
    executedStatements,
    deletedTables,
    updatedTables,
  };
}

describe('BpmSyncManager.cleanupStaleData', () => {
  it('detects orphaned control on rename and cascade deletes child records', async () => {
    const mock = makeMockDb({
      diagramRisks: [{ id: 'R-FIN-01' }],
      mappedControls: [{ controlId: 'C-FIN-01' }], // Previous mapping in rcm_controls
      controlsByRcm: [{ id: 'C-FIN-01' }],
      orphanControls: [{ id: 'C-FIN-01' }], // C-FIN-01 identified as orphan
    });

    const manager = new BpmSyncManager(mock.db);

    const activeRiskIds = new Set(['R-FIN-01']);
    const activeControlIds = new Set(['C-FIN-02']); // Renamed to C-FIN-02
    const activePairs = new Set(['R-FIN-01:C-FIN-02']);

    await manager.cleanupStaleData(
      'org-1',
      'diag-1',
      activeRiskIds,
      activeControlIds,
      activePairs,
      'proc-1'
    );

    // Verify stale mapping deleted for R-FIN-01 (excluding C-FIN-02)
    const staleDelete = mock.executedStatements.find(s =>
      s.sqlText.includes('DELETE FROM rcm_controls') && s.sqlText.includes('NOT IN')
    );
    expect(staleDelete).toBeDefined();

    // Verify orphan check ran
    const orphanCheck = mock.executedStatements.find(s =>
      s.sqlText.includes('SELECT id FROM controls') && s.sqlText.includes('NOT EXISTS')
    );
    expect(orphanCheck).toBeDefined();

    // Verify cascade deletes for orphaned C-FIN-01
    const cascadeTables = [
      'action_plans',
      'deficiencies',
      'tod_evaluations',
      'csa_samples',
      'csa_records',
      'test_samples',
      'test_records',
      'rcm_controls',
      'controls',
    ];

    for (const table of cascadeTables) {
      const deleteStmt = mock.executedStatements.find(s =>
        s.sqlText.includes(`DELETE FROM ${table}`) && s.sqlText.includes('organization_id')
      );
      expect(deleteStmt, `Expected cascade delete on ${table} scoped by organization_id`).toBeDefined();
    }
  });

  it('preserves shared controls when orphan check returns empty', async () => {
    const mock = makeMockDb({
      diagramRisks: [{ id: 'R-FIN-01' }],
      mappedControls: [{ controlId: 'C-SHARED' }],
      controlsByRcm: [{ id: 'C-SHARED' }],
      orphanControls: [], // C-SHARED is still mapped to another risk, so not orphaned
    });

    const manager = new BpmSyncManager(mock.db);

    const activeRiskIds = new Set(['R-FIN-01']);
    const activeControlIds = new Set(['C-FIN-02']);
    const activePairs = new Set(['R-FIN-01:C-FIN-02']);

    await manager.cleanupStaleData(
      'org-1',
      'diag-1',
      activeRiskIds,
      activeControlIds,
      activePairs,
      'proc-1'
    );

    // Orphan check ran
    const orphanCheck = mock.executedStatements.find(s =>
      s.sqlText.includes('SELECT id FROM controls') && s.sqlText.includes('NOT EXISTS')
    );
    expect(orphanCheck).toBeDefined();

    // But NO cascade deletes ran on controls or child tables
    const controlDelete = mock.executedStatements.find(s =>
      s.sqlText.includes('DELETE FROM controls WHERE')
    );
    expect(controlDelete).toBeUndefined();

    const deficiencyDelete = mock.executedStatements.find(s =>
      s.sqlText.includes('DELETE FROM deficiencies WHERE')
    );
    expect(deficiencyDelete).toBeUndefined();
  });

  it('safely handles shared control ID across diagrams without breaking other diagram mappings (ISSUE-1)', async () => {
    const mock = makeMockDb({
      diagramRisks: [{ id: 'R-A' }],
      mappedControls: [{ controlId: 'C-SHARED' }],
      controlsByRcm: [{ id: 'C-SHARED' }],
      orphanControls: [],
    });

    const manager = new BpmSyncManager(mock.db);
    const activeRiskIds = new Set(['R-A']);
    const activeControlIds = new Set(['C-A-NEW']);
    const activePairs = new Set(['R-A:C-A-NEW']);

    await manager.cleanupStaleData(
      'org-1',
      'diag-A',
      activeRiskIds,
      activeControlIds,
      activePairs,
      'proc-A'
    );

    const staleDelete = mock.executedStatements.find(s =>
      s.sqlText.includes('DELETE FROM rcm_controls') && s.sqlText.includes('R-A')
    );
    expect(staleDelete).toBeDefined();

    const controlDelete = mock.executedStatements.find(s =>
      s.sqlText.includes('DELETE FROM controls')
    );
    expect(controlDelete).toBeUndefined();
  });

  it('removes inactive diagram risks and unlinks controls', async () => {
    const mock = makeMockDb({
      diagramRisks: [{ id: 'R-REMOVED' }],
      orphanControls: [],
    });

    const manager = new BpmSyncManager(mock.db);

    // Diagram now has no active risks
    const activeRiskIds = new Set<string>();
    const activeControlIds = new Set<string>();
    const activePairs = new Set<string>();

    await manager.cleanupStaleData(
      'org-1',
      'diag-1',
      activeRiskIds,
      activeControlIds,
      activePairs,
      'proc-1'
    );

    // Inactive risk R-REMOVED should have rcm_controls deleted, controls.rcmId unlinked, and rcms deleted
    expect(mock.deleteFn).toHaveBeenCalled();
    expect(mock.updateFn).toHaveBeenCalled();
  });

  it('collects candidate controls by subProcessName even when bpmProcessId is null', async () => {
    const mock = makeMockDb({
      diagramRisks: [],
      controlsByProcess: [{ id: 'C-SUBPROC-ORPHAN' }],
      orphanControls: [{ id: 'C-SUBPROC-ORPHAN' }],
    });

    const manager = new BpmSyncManager(mock.db);

    await manager.cleanupStaleData(
      'org-1',
      'diag-1',
      new Set<string>(),
      new Set<string>(['C-SUBPROC-NEW']),
      new Set<string>(),
      null, // bpmProcessId is null
      'Procurement Subprocess' // subProcessName provided
    );

    // Orphan check ran and evaluated C-SUBPROC-ORPHAN
    const orphanCheck = mock.executedStatements.find(s =>
      s.sqlText.includes('SELECT id FROM controls') && s.sqlText.includes('NOT EXISTS')
    );
    expect(orphanCheck).toBeDefined();

    const controlDelete = mock.executedStatements.find(s =>
      s.sqlText.includes('DELETE FROM controls') && s.sqlText.includes('org-1')
    );
    expect(controlDelete).toBeDefined();
  });
});

