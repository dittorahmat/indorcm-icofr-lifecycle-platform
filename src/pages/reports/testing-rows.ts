/**
 * Single owner for the TOD/TOE test-result row and its Excel column set.
 *
 * Before this module the same row was derived three times inside `ReportsPage`
 * (Excel rows, mobile card, desktop table) and a SECOND, disagreeing 7-column
 * Excel list lived in `TestWorkbench`. Both workpaper exports now cross this
 * one seam: one `buildTestingRows`, one `TESTING_COLUMNS`.
 *
 * Not in the interface: the `<Table>`/mobile-card JSX, the filter *state*,
 * `date-fns`, or the filename/title strings (per-caller metadata).
 */
import type { Control, RCM, TestRecord } from '@shared/types';
import type { RegulatoryExportColumn } from '@/lib/rcm-excel-export';

/**
 * Narrow projections of the domain rows this seam reads. Keeping them minimal
 * (rather than the full `Control`/`RCM`/`TestRecord`) is what makes the seam
 * cheap to test with known-good fixtures while still being domain types.
 */
export type TestingControlRef = Pick<
  Control,
  'id' | 'code' | 'name' | 'rcmId' | 'assertions' | 'businessProcess' | 'subProcess'
>;
export type TestingRcmRef = Pick<RCM, 'id' | 'process' | 'subProcess'>;
export type TestingTestRef = Pick<
  TestRecord,
  'id' | 'controlId' | 'testType' | 'method' | 'result' | 'comments' | 'sampleSize' | 'evaluationAttributes' | 'testDate'
>;

export interface TestingRowContext {
  controls: readonly TestingControlRef[];
  rcms: readonly TestingRcmRef[];
}

export interface BuildTestingRowsOptions {
  /** The ONE filter owner: applied exactly once, before derivation. */
  filter?: (test: TestingTestRef) => boolean;
  /** Injected so the module stays free of `date-fns`. */
  dateFormat: (timestamp: number) => string;
}

/** One normalized test-result row, consumed by both views and the export. */
export interface TestingResultRow {
  /** Source test id (React key + audit reference). */
  id: string;
  /** 1-based ordinal within the derived set. */
  no: number;
  controlCode: string;
  controlName: string;
  process: string;
  subProcess: string;
  assertions: Control['assertions'];
  type: TestRecord['testType'];
  method: string;
  /** Count of satisfied Lampiran-8 evaluation attributes (0..6). */
  attributeCount: number;
  sample: string | number;
  result: TestRecord['result'];
  notes: string;
  date: string;
}

function countTrue(attributes: TestingTestRef['evaluationAttributes']): number {
  return attributes ? Object.values(attributes).filter(Boolean).length : 0;
}

/**
 * Builds the one test-result row set. The RCM owns the process context; the
 * control's own denormalized process/sub-process is the documented fallback
 * (the Testing Workbench has no RCM collection in scope).
 */
export function buildTestingRows(
  tests: readonly TestingTestRef[],
  ctx: TestingRowContext,
  opts: BuildTestingRowsOptions,
): TestingResultRow[] {
  const source = opts.filter ? tests.filter(opts.filter) : tests;
  return source.map((test, index) => {
    const control = ctx.controls.find((c) => c.id === test.controlId);
    const rcm = control?.rcmId ? ctx.rcms.find((r) => r.id === control.rcmId) : undefined;
    return {
      id: test.id,
      no: index + 1,
      controlCode: control?.code || '-',
      controlName: control?.name || '-',
      process: rcm?.process || control?.businessProcess || 'N/A',
      subProcess: rcm?.subProcess || control?.subProcess || 'N/A',
      assertions: control?.assertions ?? [],
      type: test.testType,
      method: test.method || '-',
      attributeCount: countTrue(test.evaluationAttributes),
      sample: test.testType === 'TOE' ? (test.sampleSize ?? '-') : 'N/A',
      result: test.result,
      notes: test.comments ?? '',
      date: test.testDate ? opts.dateFormat(test.testDate) : '-',
    };
  });
}

/**
 * The Excel column keys, exhaustive by construction: every column key must
 * appear here (type alias, not interface, so the writer's
 * `Record<string, unknown>` rows accept it).
 */
export type TestingExportRecord = {
  no: number;
  process: string;
  control: string;
  assertion: string;
  type: string;
  method: string;
  criteria: string;
  sample: string | number;
  result: string;
  notes: string;
  date: string;
};

export type TestingExportKey = keyof TestingExportRecord;

/**
 * Flattens a derived row into the exact column-keyed record the workpaper
 * writer consumes. The ONLY place the combined process/control/assertion/criteria
 * strings are formed. Empty values fall back to `REGULATORY_EMPTY_CELL` ('-')
 * inside `buildRegulatoryAoA`.
 */
export function toTestingExportRecord(row: TestingResultRow): TestingExportRecord {
  return {
    no: row.no,
    process: `${row.process} / ${row.subProcess}`,
    control: `${row.controlCode} - ${row.controlName}`,
    assertion: row.assertions.join(', '),
    type: row.type,
    method: row.method,
    criteria: `${row.attributeCount}/6`,
    sample: row.sample,
    result: row.result,
    notes: row.notes,
    date: row.date,
  };
}

/** i18n keys the column config carries as data — a typo is a `tsc` error. */
export type TestingColumnKey =
  | 'reports:testing.table.no'
  | 'reports:testing.table.process'
  | 'reports:testing.table.control'
  | 'reports:testing.table.assertion'
  | 'reports:testing.table.type'
  | 'reports:testing.table.method'
  | 'reports:testing.table.criteria'
  | 'reports:testing.table.sample'
  | 'reports:testing.table.result'
  | 'reports:testing.table.notes'
  | 'reports:testing.table.date';

export interface TestingColumnDef {
  key: TestingExportKey;
  headerKey: TestingColumnKey;
  numeric?: boolean;
}

/** The ONE column set shared by `ReportsPage` and `TestWorkbench`. */
export const TESTING_COLUMNS: readonly TestingColumnDef[] = [
  { key: 'no', headerKey: 'reports:testing.table.no', numeric: true },
  { key: 'process', headerKey: 'reports:testing.table.process' },
  { key: 'control', headerKey: 'reports:testing.table.control' },
  { key: 'assertion', headerKey: 'reports:testing.table.assertion' },
  { key: 'type', headerKey: 'reports:testing.table.type' },
  { key: 'method', headerKey: 'reports:testing.table.method' },
  { key: 'criteria', headerKey: 'reports:testing.table.criteria' },
  { key: 'sample', headerKey: 'reports:testing.table.sample' },
  { key: 'result', headerKey: 'reports:testing.table.result' },
  { key: 'notes', headerKey: 'reports:testing.table.notes' },
  { key: 'date', headerKey: 'reports:testing.table.date' },
];

export type TestingTFunction = (key: string) => string;

/** Resolves the single column set to localized export columns. */
export function testingColumns(t: TestingTFunction): RegulatoryExportColumn[] {
  return TESTING_COLUMNS.map((col) => ({ key: col.key, header: t(col.headerKey), numeric: col.numeric }));
}
