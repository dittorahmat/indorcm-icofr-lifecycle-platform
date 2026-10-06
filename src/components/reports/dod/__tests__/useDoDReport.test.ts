import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDoDReport } from '../useDoDReport';
import type { Control, Deficiency } from '@shared/types';

const t = (key: string) => key;

function makeDeficiency(overrides: Partial<Deficiency> = {}): Deficiency {
  return {
    id: 'DEF-001',
    controlId: 'CTRL-001',
    severity: 'Control Deficiency',
    status: 'Open',
    description: 'Uji deskripsi',
    exposureValue: 0,
    relatedAssertions: [],
    compensatingControlIds: [],
    identifiedDate: null,
    ...overrides,
  } as Deficiency;
}

const controls: Control[] = [];

describe('useDoDReport', () => {
  it('falls back to heuristics when worksheet and flowchart path are missing', () => {
    const { result } = renderHook(() =>
      useDoDReport({
        deficiencies: [
          makeDeficiency({ id: 'DEF-090', severity: 'Material Weakness', exposureValue: 12_000_000_000 }),
        ],
        controls,
        fiscalYear: 2025,
        t,
      }),
    );

    const row = result.current.filteredRows[0];
    expect(row.boxes.box1).toBe(true);
    expect(row.boxes.box2).toBe(true);
    expect(row.boxes.box3).toBe(true);
    expect(row.boxes.box5).toBe(false);
    expect(row.boxes.box6).toBe(true);
    expect(result.current.counters.mw).toBe(1);
    expect(result.current.counters.total).toBe(1);
  });

  it('treats exposure below threshold as non-material for box3', () => {
    const { result } = renderHook(() =>
      useDoDReport({
        deficiencies: [makeDeficiency({ id: 'DEF-091', severity: 'Control Deficiency', exposureValue: 100_000 })],
        controls,
        fiscalYear: 2025,
        t,
      }),
    );

    expect(result.current.filteredRows[0]?.boxes.box3).toBe(false);
  });

  it('filters rows by severity and search query', () => {
    const { result } = renderHook(() =>
      useDoDReport({
        deficiencies: [
          makeDeficiency({ id: 'DEF-001', severity: 'Material Weakness', description: 'Otorisasi tender' }),
          makeDeficiency({ id: 'DEF-002', severity: 'Significant Deficiency', description: 'Stock opname' }),
        ],
        controls,
        fiscalYear: 2025,
        t,
      }),
    );

    act(() => {
      result.current.setSeverityFilter('Material Weakness');
    });
    expect(result.current.filteredRows.map((r) => r.ref)).toEqual(['DEF-001']);

    act(() => {
      result.current.setSeverityFilter('ALL');
      result.current.setSearchQuery('stock');
    });
    expect(result.current.filteredRows.map((r) => r.ref)).toEqual(['DEF-002']);
  });

  it('filters remediated rows', () => {
    const { result } = renderHook(() =>
      useDoDReport({
        deficiencies: [
          makeDeficiency({ id: 'DEF-001', status: 'Open' }),
          makeDeficiency({ id: 'DEF-002', status: 'Remediated' }),
        ],
        controls,
        fiscalYear: 2025,
        t,
      }),
    );

    expect(result.current.counters.remediated).toBe(1);
    act(() => {
      result.current.setRemediationFilter('REMEDIATED');
    });
    expect(result.current.filteredRows.map((r) => r.ref)).toEqual(['DEF-002']);
  });
});
