import { describe, expect, it } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/pg-proxy';
import * as schema from '../../db/schema';
import {
  MATRIX_KIND_SPECS,
  buildMatrixSelect,
  planMatrixRead,
  type MatrixKind,
  type MatrixReadInput,
} from '../rcm-matrix-select';

/** No DB and no HTTP: pg-proxy only needs a callback, and `.toSQL()` renders
 *  the statement without ever calling it. */
const db = drizzle(async () => ({ rows: [] }), { schema });
const dialect = new PgDialect();
const KINDS = ['TLC', 'ELC', 'ITGC'] as const;

/** Known-good input: every optional filter filled, so absent filters below
 *  prove the kind dropped them rather than the caller. */
const full = (kind: MatrixKind): MatrixReadInput => ({
  kind, orgId: 'org-1', year: '2025', bpmProcessId: 'bp-9', noGL: '4100',
});

const keysOf = (kind: MatrixKind) => Object.keys(planMatrixRead({ kind, orgId: 'org-1' }).columns);
const render = (kind: MatrixKind, input: MatrixReadInput = full(kind)) =>
  buildMatrixSelect(db, input).toSQL();
const paramsOf = (input: MatrixReadInput) => planMatrixRead(input)
  .conditions.map((condition) => dialect.sqlToQuery(condition).params).flat();
const flat = (value: string) => value.replace(/\s+/g, ' ').toLowerCase();

describe('rcm-matrix-select: one builder for TLC / ELC / ITGC', () => {
  it('pins the per-kind difference as data (transcribed from the pre-builder getters)', () => {
    expect(MATRIX_KIND_SPECS).toEqual({
      TLC: {
        level: 'TLC',
        filters: ['level', 'bpmProcessId', 'year', 'noGL'],
        columns: ['fsli', 'tlcElcAssertions', 'deficiencyAssertions'],
        joins: ['process', 'parentProcess', 'deficiencyAssertions'],
      },
      ELC: {
        level: 'ELC',
        filters: ['level', 'year'],
        columns: ['tlcElcAssertions', 'coso'],
        joins: ['process', 'parentProcess'],
      },
      ITGC: {
        level: 'ITGC',
        filters: ['level', 'year', 'bpmProcessId'],
        columns: ['itgc'],
        joins: ['process', 'parentProcess'],
      },
    });
  });

  it('keeps the shared columns identical across the three kinds', () => {
    const shared = keysOf('ITGC').filter((key) => !['itgcDomain', 'itgcAssertions'].includes(key));
    expect(shared).toHaveLength(32);
    for (const kind of KINDS) expect(keysOf(kind)).toEqual(expect.arrayContaining(shared));
  });

  it('carries only the column groups its kind declares', () => {
    // Column counts with diagramId and nodeId included (TLC 52 / ELC 44 / ITGC 34):
    expect(keysOf('TLC')).toHaveLength(52);
    expect(keysOf('ELC')).toHaveLength(44);
    expect(keysOf('ITGC')).toHaveLength(34);

    expect(keysOf('TLC')).toEqual(expect.arrayContaining(['fsliName', 'noGL', 'ipoC', 'assertionPd', 'defE', 'defPd']));
    expect(keysOf('ELC')).toEqual(expect.arrayContaining(['ipoC', 'assertionPd', 'cosoPrinciples']));
    expect(keysOf('ITGC')).toEqual(expect.arrayContaining(['itgcDomain', 'itgcAssertions']));

    for (const kind of ['TLC', 'ELC'] as const) expect(keysOf(kind)).not.toContain('itgcDomain');
    for (const kind of ['ELC', 'ITGC'] as const) expect(keysOf(kind)).not.toContain('defE');
    for (const kind of ['TLC', 'ITGC'] as const) expect(keysOf(kind)).not.toContain('cosoPrinciples');
    for (const kind of ['ELC', 'ITGC'] as const) expect(keysOf(kind)).not.toContain('fsliName');
  });

  it('shares the join prelude and adds only its own joins, in order', () => {
    const joinTypes = (kind: MatrixKind) => planMatrixRead(full(kind)).joins.map((join) => join.type);
    const joinOn = (kind: MatrixKind) => flat(planMatrixRead(full(kind)).joins.map((join) =>
      (join.on ? dialect.sqlToQuery(join.on).sql : '')).join(' | '));

    for (const kind of KINDS) {
      expect(joinTypes(kind).slice(0, 4)).toEqual(['inner', 'inner', 'left', 'left']);
      expect(joinTypes(kind)).toHaveLength(MATRIX_KIND_SPECS[kind].joins.length + 4);
      expect(joinOn(kind)).toContain('"rcm_controls"."rcm_id" = "icofr"."rcms"."id"');
      expect(joinOn(kind)).toContain('"rcm_controls"."control_id" = "icofr"."controls"."id"');
      expect(joinOn(kind)).toContain('"bpm_node_rcms"."diagram_id" = "icofr"."bpm_diagrams"."id"');
      expect(joinOn(kind)).toContain('"bpm_processes"."parent_id" = "parent_process"."id"');
    }

    // The process link (control OR BPM sub-process name) is TLC/ELC/ITGC.
    expect(joinOn('TLC')).toContain('"controls"."bpm_process_id" = "icofr"."bpm_processes"."id" or "icofr"."bpm_diagrams"."sub_process" = "icofr"."bpm_processes"."name"');
    expect(joinOn('ELC')).toContain('"icofr"."bpm_diagrams"."sub_process" = "icofr"."bpm_processes"."name"');
    expect(joinOn('ITGC')).toContain('"controls"."bpm_process_id" = "icofr"."bpm_processes"."id"');
    expect(joinOn('ITGC')).toContain('"bpm_processes"."parent_id" = "parent_process"."id"');

    for (const kind of ['ELC', 'ITGC'] as const) expect(joinOn(kind)).not.toContain('account_assertions');
    expect(joinOn('TLC')).toContain('"account_assertions"."no_gl"');
    expect(joinOn('TLC')).toContain('"account_assertions"."organization_id"');
  });

  it('applies the organization scope plus the filters of the kind, in order', () => {
    expect(paramsOf(full('TLC'))).toEqual(['org-1', 'TLC', 'bp-9', 2025, '%-4100', '4100']);
    expect(paramsOf(full('ELC'))).toEqual(['org-1', 'ELC', 2025]);
    expect(paramsOf(full('ITGC'))).toEqual(['org-1', 'ITGC', 2025, 'bp-9']);

    // ELC has no bpmProcessId / noGL filter; ITGC has no noGL filter.
    expect(paramsOf(full('ELC'))).not.toContain('bp-9');
    expect(paramsOf(full('ITGC'))).not.toContain('4100');
    expect(flat(planMatrixRead(full('ITGC')).conditions.map((c) => dialect.sqlToQuery(c).sql).join(' | ')))
      .not.toContain('::jsonb ?');
  });

  it('renders the TLC read with the account-assertions join and the noGL filter', () => {
    const { sql, params } = render('TLC');
    const text = flat(sql);

    expect(text).toContain('from "icofr"."rcm_controls"');
    expect(text).toContain('left join "icofr"."bpm_processes" on');
    expect(text).toContain('left join "icofr"."bpm_processes" "parent_process" on');
    expect(text).toContain('left join "icofr"."account_assertions" on');
    expect(text).toContain('"controls"."level" = $');
    expect(text).toContain('"icofr"."rcms"."id" like $');
    expect(text).toContain('"controls"."fsli_codes"::jsonb ? $');
    // `noGL` is bound three times: the select column, the join override, the filter.
    expect(params).toEqual(['4100', '4100', 'org-1', 'TLC', 'bp-9', 2025, '%-4100', '4100']);
  });

  it('renders the ELC read without the account-assertions join and with coso last', () => {
    const { sql, params } = render('ELC');
    const text = flat(sql);

    expect(text).not.toContain('account_assertions');
    expect(text).not.toContain('::jsonb ?');
    expect(text).toContain('"controls"."level" = $');
    expect(text).toMatch(/"effective_period", "icofr"\."rcm_controls"\."coso_principles" from/);
    expect(params).toEqual(['org-1', 'ELC', 2025]);
  });

  it('drops the "undefined" query sentinels and an absent year from the WHERE', () => {
    const sentinel: MatrixReadInput = { kind: 'TLC', orgId: 'org-1', bpmProcessId: 'undefined', noGL: 'undefined' };
    const text = flat(render('TLC', sentinel).sql);

    expect(text).not.toContain('::jsonb ?');
    expect(text).not.toContain('bpm_process_id" = $');
    expect(text).not.toContain('"rcms"."year" =');
    // Only the organization scope and the level survive the sentinels.
    expect(paramsOf(sentinel)).toEqual(['org-1', 'TLC']);
  });

  it('joins bpmProcesses and parentProcess for ITGC read', () => {
    const text = flat(render('ITGC').sql);
    expect(text).toContain('"bpm_processes"');
    expect(text).toContain('"parent_process"');
    expect(() => render('ITGC')).not.toThrow();
  });
});
