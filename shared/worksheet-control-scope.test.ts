import { describe, expect, it } from 'vitest';
import {
  filterWorksheetControls,
  type WorksheetControlLike,
} from './worksheet-control-scope';

/**
 * Known-good fixture table for the worksheet control scope.
 *
 * Behaviour is asserted as OUTCOMES here (which ids come back), never by
 * re-declaring the predicate the module implements — the previous
 * `BPMModalScoping.test.ts` embedded a copy of the filter and asserted against
 * that copy, so it could never disagree with production.
 */
interface Fixture extends WorksheetControlLike {
  id: string;
}

const REVENUE_GL = '4101';
const CASH_GL = '1101';

const controls: Fixture[] = [
  { id: 'revenue-2026', year: 2026, bpmProcessId: 'proc-revenue', subProcess: 'Penerimaan Pendapatan', fsliCodes: [REVENUE_GL] },
  { id: 'revenue-2025', year: 2025, bpmProcessId: 'proc-revenue', subProcess: 'Penerimaan Pendapatan', fsliCodes: [REVENUE_GL] },
  { id: 'revenue-other-gl', year: 2026, bpmProcessId: 'proc-revenue', subProcess: 'Penerimaan Pendapatan', fsliCodes: ['9999'] },
  { id: 'revenue-no-fsli-tag', year: 2026, bpmProcessId: 'proc-revenue', subProcess: 'Penerimaan Pendapatan', fsliCodes: [] },
  { id: 'revenue-untagged-year', bpmProcessId: 'proc-revenue', subProcess: 'Penerimaan Pendapatan', fsliCodes: [REVENUE_GL] },
  { id: 'revenue-name-only', year: 2026, subProcess: 'Penerimaan Pendapatan', fsliCodes: [REVENUE_GL] },
  { id: 'treasury-2026', year: 2026, bpmProcessId: 'proc-treasury', subProcess: 'Rekonsiliasi Kas & Bank', fsliCodes: [CASH_GL] },
  { id: 'treasury-2025', year: 2025, bpmProcessId: 'proc-treasury', subProcess: 'Rekonsiliasi Kas & Bank', fsliCodes: [CASH_GL] },
  { id: 'treasury-name-only-no-tag', year: 2026, subProcess: 'Rekonsiliasi Kas & Bank', fsliCodes: [] },
  { id: 'petty-cash-2026', year: 2026, bpmProcessId: 'proc-petty-cash', subProcess: 'Pengelolaan Kas Kecil', fsliCodes: [CASH_GL] },
  { id: 'orphan-cash', year: 2026, fsliCodes: [CASH_GL] },
  { id: 'orphan-cash-2025', year: 2025, fsliCodes: [CASH_GL] },
];

const ids = (rows: readonly Fixture[]): string[] => rows.map((row) => row.id);

const revenueScope = { bpmProcessId: 'proc-revenue', subProcessName: 'Penerimaan Pendapatan', noGL: REVENUE_GL, year: '2026' };

/** Exactly what the BPM worksheet / Execution Hub adapters pass. */
const bpmScope = { bpmProcessId: 'proc-treasury', subProcessName: 'Rekonsiliasi Kas & Bank', noGL: CASH_GL, year: '2026' };

/** Exactly what the CSA workspace adapter passes: the orphan fallback on. */
const csaScope = { ...bpmScope, allowOrphanFallback: true };

describe('filterWorksheetControls — year guard', () => {
  it('excludes a control tagged with another fiscal year (BPM scope)', () => {
    expect(ids(filterWorksheetControls(controls, bpmScope))).toEqual(['treasury-2026']);
  });

  it('excludes wrong-year controls in the CSA scope — cross-year regression', () => {
    const result = ids(filterWorksheetControls(controls, csaScope));

    // The old CSAModal filter had no year guard at all, so `treasury-2025`
    // (id + name match) and `orphan-cash-2025` reached CSA assessments.
    expect(result).not.toContain('treasury-2025');
    expect(result).not.toContain('orphan-cash-2025');
    expect(result).toEqual(['treasury-2026', 'orphan-cash']);
  });

  it('admits a control with no year tag in any working year', () => {
    const in2026 = ids(filterWorksheetControls(controls, { ...revenueScope, year: '2026' }));
    const in2027 = ids(filterWorksheetControls(controls, { ...revenueScope, year: '2027' }));

    expect(in2026).toContain('revenue-untagged-year');
    expect(in2027).toContain('revenue-untagged-year');
  });

  it('accepts a numeric scope year', () => {
    expect(ids(filterWorksheetControls(controls, { bpmProcessId: 'proc-treasury', noGL: CASH_GL, year: 2026 })))
      .toEqual(['treasury-2026']);
  });
});

describe('filterWorksheetControls — process match and strict isolation', () => {
  it('keeps only the matching process when two sub-processes share one GL', () => {
    expect(ids(filterWorksheetControls(controls, bpmScope))).toEqual(['treasury-2026']);
    expect(ids(filterWorksheetControls(controls, { bpmProcessId: 'proc-petty-cash', subProcessName: 'Pengelolaan Kas Kecil', noGL: CASH_GL, year: '2026' })))
      .toEqual(['petty-cash-2026']);
  });

  it('rejects a control from another GL even when bpmProcessId matches', () => {
    expect(filterWorksheetControls(controls, { ...bpmScope, noGL: '9999' })).toEqual([]);
  });

  it('matches by normalized sub-process name when no process id is given', () => {
    expect(ids(filterWorksheetControls(controls, { subProcessName: '  rekonsiliasi kas & BANK ', noGL: CASH_GL, year: '2026' })))
      .toEqual(['treasury-2026']);
  });

  it('rejects everything when neither process id nor sub-process name is given', () => {
    expect(filterWorksheetControls(controls, { noGL: CASH_GL, year: '2026' })).toEqual([]);
  });
});

describe('filterWorksheetControls — FSLI restriction', () => {
  it('keeps the hard process link when the control carries no FSLI tag', () => {
    const result = ids(filterWorksheetControls(controls, revenueScope));

    expect(result).toContain('revenue-no-fsli-tag');
    expect(result).toEqual(['revenue-2026', 'revenue-no-fsli-tag', 'revenue-untagged-year', 'revenue-name-only']);
  });

  it('rejects an untagged control and another GL on the name fallback', () => {
    const result = ids(filterWorksheetControls(controls, { subProcessName: 'Penerimaan Pendapatan', noGL: REVENUE_GL, year: '2026' }));

    expect(result).not.toContain('revenue-no-fsli-tag');
    expect(result).not.toContain('revenue-other-gl');
    expect(result).toEqual(['revenue-2026', 'revenue-untagged-year', 'revenue-name-only']);
  });

  it('applies the FSLI restriction to the name fallback for CSA too — drift regression', () => {
    // The old CSAModal name match skipped the FSLI check, so this untagged
    // name twin entered a GL-filtered CSA assessment.
    expect(ids(filterWorksheetControls(controls, csaScope))).not.toContain('treasury-name-only-no-tag');
  });

  it('admits an untagged name match only when no GL is in scope', () => {
    const withoutGl = ids(filterWorksheetControls(controls, { subProcessName: 'Rekonsiliasi Kas & Bank', year: '2026' }));

    expect(withoutGl).toEqual(['treasury-2026', 'treasury-name-only-no-tag']);
  });
});

describe('filterWorksheetControls — orphan fallback is the only view difference', () => {
  it('excludes the orphan control in the BPM scope and includes it in the CSA scope', () => {
    expect(ids(filterWorksheetControls(controls, bpmScope))).not.toContain('orphan-cash');
    expect(ids(filterWorksheetControls(controls, { ...csaScope, allowOrphanFallback: undefined }))).not.toContain('orphan-cash');
    expect(ids(filterWorksheetControls(controls, csaScope))).toContain('orphan-cash');
  });

  it('requires a GL code for the orphan fallback', () => {
    const result = ids(filterWorksheetControls(controls, { bpmProcessId: 'proc-treasury', year: '2026', allowOrphanFallback: true }));

    expect(result).not.toContain('orphan-cash');
    expect(result).toEqual(['treasury-2026']);
  });

  it('never routes a control that still carries process metadata through the orphan path', () => {
    const result = ids(filterWorksheetControls(controls, { bpmProcessId: 'proc-none', noGL: CASH_GL, year: '2026', allowOrphanFallback: true }));

    expect(result).toEqual(['orphan-cash']);
  });
});

describe('filterWorksheetControls — result shape', () => {
  it('returns the caller item type unchanged and preserves source order', () => {
    const rows: Fixture[] = [
      { id: 'b', subProcess: 'X', year: 2026 },
      { id: 'a', subProcess: 'X', year: 2026 },
      { id: 'c', subProcess: 'Y', year: 2026 },
    ];

    const result = filterWorksheetControls(rows, { subProcessName: 'x', year: '2026' });

    expect(ids(result)).toEqual(['b', 'a']);
    expect(result[0]).toBe(rows[0]);
  });

  it('does not mutate the input array', () => {
    const rows: Fixture[] = [{ id: 'a', subProcess: 'X', year: 2026 }];
    filterWorksheetControls(rows, { subProcessName: 'x', year: '2026' });

    expect(rows).toHaveLength(1);
  });
});
