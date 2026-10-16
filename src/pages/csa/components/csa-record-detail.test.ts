import { describe, expect, it } from 'vitest';
import {
  buildRcmPayload,
  buildTodPayload,
  csaMatrixKey,
  csaRecordDetailKey,
  csaWorklistKey,
  dedupeMatrixControls,
  findTodEvaluation,
  resolveWorkflowStatus,
  type TodFormValues,
} from './csa-record-detail';

const VALUES: TodFormValues = {
  riskDescription: 'r',
  isFraudRelated: false,
  riskRating: 'H',
  mappedControlName: 'Kontrol A',
  mappedControlDescription: 'd',
  supportingDocs: null,
  isKeyControl: true,
  controlType: 'Preventif',
  controlNature: 'Manual',
  automatedSubNature: null,
  frequency: 'Harian',
  supportingApp: null,
  executingFunction: 'Teller',
  executorRole: 'Staff',
  affectedFsliItem: null,
  effectivePeriod: null,
  ipoC: true,
  ipoA: true,
  ipoV: true,
  ipoRa: false,
  assertionE: true,
  assertionC: true,
  assertionA: true,
  assertionCo: true,
  assertionVa: true,
  assertionRo: true,
  assertionPd: true,
  pilarObjective: 'o',
  pilarTiming: 't',
  pilarAuthority: 'a',
  pilarReliability: 'r',
  pilarCoverage: 'c',
  pilarEvidence: 'e',
  kkReference: 'KK-1',
  conclusion: 'Effective',
  comment: 'ok',
};

describe('csa-record-detail seam', () => {
  it('dedupes on controlId||id', () => {
    const items = [
      { id: 'a', controlId: 'c1', mappingId: 'm1' },
      { id: 'b', controlId: 'c1', mappingId: 'm2' },
      { id: 'c2', controlId: '', mappingId: 'm3' },
    ];
    expect(dedupeMatrixControls(items)).toHaveLength(2);
  });

  it('builds RCM + TOD payloads from one form value', () => {
    expect(buildRcmPayload('m1', VALUES)).toMatchObject({ mappingId: 'm1', controlName: 'Kontrol A' });
    expect(buildTodPayload('c1', VALUES)).toMatchObject({ controlId: 'c1', conclusion: 'Effective' });
  });

  it('resolves workflow fallback Draft/In Review/Validated', () => {
    expect(resolveWorkflowStatus({ workflowStatus: 'X' })).toBe('X');
    expect(resolveWorkflowStatus({ line2Status: 'Validated' })).toBe('Validated');
    expect(resolveWorkflowStatus({ isDraft: true })).toBe('Draft');
    expect(resolveWorkflowStatus({})).toBe('In Review');
  });

  it('keys are stable and year-scoped', () => {
    expect(csaRecordDetailKey('r1')).toEqual(['csa-record-detail', 'r1']);
    expect(csaMatrixKey('p1', '2026')).toEqual(['rcm-matrix-tlc-process', 'p1', '2026']);
    expect(csaWorklistKey('2026')).toEqual(['csa-worklist', '2026']);
  });

  it('finds TOD evaluation by canonical controlId', () => {
    const list = [{ controlId: 'c1' }, { controlId: 'c2' }];
    expect(findTodEvaluation(list, { controlId: 'c2' })).toEqual({ controlId: 'c2' });
  });
});
