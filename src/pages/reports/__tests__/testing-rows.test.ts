import { describe, it, expect } from 'vitest';
import {
  buildTestingRows,
  testingColumns,
  toTestingExportRecord,
  TESTING_COLUMNS,
  type TestingControlRef,
  type TestingRcmRef,
  type TestingTestRef,
} from '../testing-rows';
import { strictT, validateI18nKey } from '@/test/mock-i18n';

const dateFormat = (timestamp: number) => `D${timestamp}`;

function control(over: Partial<TestingControlRef> = {}): TestingControlRef {
  return {
    id: 'CTRL-1',
    code: 'PRC-01',
    name: 'Persetujuan Vendor',
    rcmId: 'RCM-1',
    assertions: ['Completeness', 'Accuracy'],
    businessProcess: null,
    subProcess: null,
    ...over,
  };
}

function rcm(over: Partial<TestingRcmRef> = {}): TestingRcmRef {
  return { id: 'RCM-1', process: 'Pengadaan', subProcess: 'Vendor', ...over };
}

function testRecord(over: Partial<TestingTestRef> = {}): TestingTestRef {
  return {
    id: 'TEST-1',
    controlId: 'CTRL-1',
    testType: 'TOD',
    method: 'Inquiry',
    result: 'Effective',
    comments: null,
    sampleSize: null,
    evaluationAttributes: undefined,
    testDate: 1700000000000,
    ...over,
  };
}

const context = { controls: [control()], rcms: [rcm()] };

describe('buildTestingRows', () => {
  it('derives a TOD row from the RCM/control lookups and counts satisfied attributes', () => {
    const rows = buildTestingRows(
      [testRecord({
        evaluationAttributes: {
          objectiveAchieved: true,
          timingAccuracy: true,
          authorityCompetence: false,
          infoReliability: true,
          periodCoverage: false,
          evidenceAvailability: false,
        },
      })],
      context,
      { dateFormat },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'TEST-1',
      no: 1,
      controlCode: 'PRC-01',
      controlName: 'Persetujuan Vendor',
      process: 'Pengadaan',
      subProcess: 'Vendor',
      assertions: ['Completeness', 'Accuracy'],
      type: 'TOD',
      method: 'Inquiry',
      attributeCount: 3,
      sample: 'N/A',
      result: 'Effective',
      date: 'D1700000000000',
    });
  });

  it('carries the TOE sample size and falls back to "-" when it is absent', () => {
    const [withSample] = buildTestingRows(
      [testRecord({ testType: 'TOE', sampleSize: 25 })],
      context,
      { dateFormat },
    );
    const [withoutSample] = buildTestingRows(
      [testRecord({ testType: 'TOE', sampleSize: null })],
      context,
      { dateFormat },
    );

    expect(withSample.sample).toBe(25);
    expect(withoutSample.sample).toBe('-');
  });

  it('falls back to "-"/"N/A" for an unknown control and to the control process when no RCM matches', () => {
    const orphan = testRecord({ controlId: 'MISSING' });

    const [noControl] = buildTestingRows([orphan], { controls: [], rcms: [] }, { dateFormat });
    expect(noControl).toMatchObject({
      controlCode: '-',
      controlName: '-',
      process: 'N/A',
      subProcess: 'N/A',
      assertions: [],
    });

    const [controlOnly] = buildTestingRows(
      [orphan],
      {
        controls: [control({ id: 'MISSING', rcmId: null, businessProcess: 'Treasury', subProcess: 'Payments' })],
        rcms: [],
      },
      { dateFormat },
    );
    expect(controlOnly.process).toBe('Treasury');
    expect(controlOnly.subProcess).toBe('Payments');
  });

  it('applies the filter exactly once, before numbering', () => {
    const tests = [
      testRecord({ id: 'T1', testType: 'TOD' }),
      testRecord({ id: 'T2', testType: 'TOE' }),
      testRecord({ id: 'T3', testType: 'TOE' }),
    ];

    const rows = buildTestingRows(tests, context, { filter: (t) => t.testType === 'TOE', dateFormat });

    expect(rows.map((r) => r.id)).toEqual(['T2', 'T3']);
    expect(rows.map((r) => r.no)).toEqual([1, 2]);
  });

  it('falls back to "-" when the test date is missing', () => {
    const [row] = buildTestingRows([testRecord({ testDate: 0, comments: 'Catatan' })], context, { dateFormat });

    expect(row.date).toBe('-');
    expect(row.notes).toBe('Catatan');
  });
});

describe('toTestingExportRecord', () => {
  it('projects the row onto the ONE column key set, in column order', () => {
    const [row] = buildTestingRows(
      [testRecord({
        evaluationAttributes: {
          objectiveAchieved: true,
          timingAccuracy: false,
          authorityCompetence: false,
          infoReliability: false,
          periodCoverage: false,
          evidenceAvailability: false,
        },
      })],
      context,
      { dateFormat },
    );

    const record = toTestingExportRecord(row);

    expect(Object.keys(record)).toEqual(TESTING_COLUMNS.map((c) => c.key));
    expect(record.process).toBe('Pengadaan / Vendor');
    expect(record.control).toBe('PRC-01 - Persetujuan Vendor');
    expect(record.assertion).toBe('Completeness, Accuracy');
    expect(record.criteria).toBe('1/6');
    expect(record.sample).toBe('N/A');
    expect(record.date).toBe('D1700000000000');
  });
});

describe('testingColumns', () => {
  it('is the single 11-column workpaper set (the drift this round kills)', () => {
    expect(testingColumns(strictT).map((c) => c.key)).toEqual([
      'no',
      'process',
      'control',
      'assertion',
      'type',
      'method',
      'criteria',
      'sample',
      'result',
      'notes',
      'date',
    ]);
    expect(testingColumns(strictT)[0].numeric).toBe(true);
    expect(TESTING_COLUMNS).toHaveLength(11);
  });

  it('resolves every data-carried header key in the en bundle (no defaultValue escape)', () => {
    for (const column of TESTING_COLUMNS) {
      validateI18nKey(column.headerKey);
    }
  });
});
