import { describe, expect, it } from 'vitest';
import { changeLogRowMeta, sortChangeLogsDesc } from './changelog-helpers';
import { findingRowId, findingSeverityTone, formatExposureValue, resolveFindingControlName } from './findings-helpers';
import { isAssessmentSigned, summarizeEffectiveness } from './lampiran11-helpers';
import type { Deficiency } from '@shared/types';

describe('regulatory report helpers (one appendix per module)', () => {
  it('reads change-log metadata preferring after over before', () => {
    const meta = changeLogRowMeta({
      dataBefore: { process: 'Lama', controlId: 'C-1', controlDescription: 'Sebelum' },
      dataAfter: { process: 'Baru', subProcess: 'Sub', controlId: 'C-2', executingFunction: 'Finance' },
      descriptionBefore: 'fb',
      descriptionAfter: 'fa',
    });
    expect(meta).toMatchObject({ process: 'Baru', subProcess: 'Sub', descBefore: 'Sebelum', refBefore: 'C-1', refAfter: 'C-2', owner: 'Finance' });
  });

  it('falls back to dashes on empty payloads', () => {
    expect(changeLogRowMeta({ dataBefore: null, dataAfter: null, descriptionBefore: null, descriptionAfter: null })).toMatchObject({
      process: '-',
      owner: '-',
    });
  });

  it('sorts logs newest first without mutating', () => {
    const logs = [{ timestamp: 1 }, { timestamp: 3 }, { timestamp: 2 }];
    expect(sortChangeLogsDesc(logs).map((l) => l.timestamp)).toEqual([3, 2, 1]);
    expect(logs[0]?.timestamp).toBe(1);
  });

  it('resolves finding rows, controls, and exposure text', () => {
    expect(findingRowId({}, 0)).toBe('DEF-001');
    expect(findingRowId({ id: 'D-9' }, 4)).toBe('D-9');
    const controls = [{ id: 'c1', code: 'C-01', name: 'Opname' }];
    expect(resolveFindingControlName({ controlId: 'c1' }, controls)).toBe('C-01 - Opname');
    expect(resolveFindingControlName({ controlName: 'Manual' }, controls)).toBe('Manual');
    expect(resolveFindingControlName({}, controls)).toBe('-');
    expect(formatExposureValue(1500)).toBe(new Intl.NumberFormat('id-ID').format(1500));
    expect(formatExposureValue('x')).toBe('-');
    expect(findingSeverityTone('Material Weakness')).toBe('mw');
    expect(findingSeverityTone('Significant Deficiency')).toBe('sd');
    expect(findingSeverityTone('other')).toBe('cd');
  });

  it('keeps screen and Excel resolvers in parity (single seam)', async () => {
    const screen = await import('./findings-helpers');
    const lib = await import('@/lib/findings-excel-export');
    const controls = [
      { id: 'c1', code: 'C-01', name: 'Opname' },
      { id: 'c2', name: 'Tanpa kode' },
    ];
    const cases = [
      { controlId: 'c1' },
      { controlId: 'c2' },
      { controlCode: 'C-01' },
      { controlName: 'Manual' },
      {},
    ];
    for (const [i, d] of cases.entries()) {
      expect(screen.resolveFindingControlName(d, controls)).toBe(lib.resolveFindingControlName(d, controls));
      expect(screen.findingRowId(d, i)).toBe(lib.findingRowId(d, i));
    }
    expect(screen.resolveFindingControlName({ controlId: 'c2' }, controls)).toBe('c2 - Tanpa kode');
  });

  it('summarizes Lampiran 11 effectiveness from severities', () => {
    const items = [
      { severity: 'Material Weakness' },
      { severity: 'Significant Deficiency' },
      { severity: 'Control Deficiency' },
    ] as Deficiency[];
    const summary = summarizeEffectiveness(items);
    expect(summary).toMatchObject({ mwCount: 1, sdCount: 1, cdCount: 1, total: 3, isEffective: false });
    expect(summary.significant).toHaveLength(2);
    expect(summary.aggregateLine).toBe('CD: 1 | SD: 1 | MW: 1 | Total: 3');
    expect(summarizeEffectiveness([]).isEffective).toBe(true);
    expect(isAssessmentSigned(true)).toBe(true);
    expect(isAssessmentSigned(undefined)).toBe(false);
  });
});
