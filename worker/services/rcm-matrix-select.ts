/** Single SQL owner for the RCM matrix reads (arch-09 R9-3, hot-spot C7).
 *  The TLC / ELC / ITGC selects used to be three near-copies in
 *  rcm-matrix-service.ts; they are one parameterized builder now, so the
 *  column map, the join graph and the WHERE clauses cannot drift apart.
 *  Everything that differs per kind lives in MATRIX_KIND_SPECS — as data.
 *  SQL semantics are unchanged (same joins, same order, same filters); the
 *  only textual difference is whitespace inside the subProcessName CASE. */
import { eq, and, or, sql, like, aliasedTable, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import {
  rcms, controls, rcmControls, bpmProcesses, bpmDiagrams, bpmNodeRcms, accountAssertions,
} from '../db/schema';
import type { DrizzleDb } from '../db';

/** The three control levels the ICOFR matrix exposes (SK-5/DKU.MBU/11/2024). */
export type MatrixKind = 'TLC' | 'ELC' | 'ITGC';

export interface MatrixReadInput {
  kind: MatrixKind;
  orgId: string;
  year?: string;
  bpmProcessId?: string;
  noGL?: string;
}

/** Optional WHERE clauses, emitted in the order the kind lists them. */
type MatrixFilter = 'level' | 'year' | 'bpmProcessId' | 'noGL';
/** Column groups a kind selects; `coso` is applied last so the ELC column
 *  order is identical to the pre-builder select. */
type MatrixColumnGroup = 'fsli' | 'tlcElcAssertions' | 'deficiencyAssertions' | 'coso' | 'itgc';
/** Joins a kind adds after the shared prelude, in join order. `parentProcess`
 *  is listed explicitly rather than implied because `deficiencyAssertions`
 *  must follow it (its ON clause reads `parent_process`). */
type MatrixJoinName = 'process' | 'parentProcess' | 'deficiencyAssertions';

interface MatrixKindSpec {
  /** Value compared against `controls.level`. */
  readonly level: MatrixKind;
  /** Ordered optional filters (the organization scope is always first). */
  readonly filters: readonly MatrixFilter[];
  readonly columns: readonly MatrixColumnGroup[];
  readonly joins: readonly MatrixJoinName[];
}

/** The per-kind difference as data. TLC is the only kind that resolves the
 *  account-level (FSLI) default assertions and the noGL suffix/jsonb filter;
 *  ELC is the only kind that derives a COSO component; ITGC never joins
 *  `bpmProcesses` — its `parent_process` ON clause still references
 *  `bpm_processes`, which is preserved verbatim from the pre-builder query.
 *  Changing a getter means changing this table, not copying a query. */
export const MATRIX_KIND_SPECS: Record<MatrixKind, MatrixKindSpec> = {
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
    joins: ['parentProcess'],
  },
};

export interface MatrixJoin {
  readonly type: 'inner' | 'left';
  readonly table: PgTable | SQL;
  readonly on: SQL | undefined;
}

export interface MatrixReadPlan {
  /** Select-list for this kind (drizzle maps result keys by name). */
  readonly columns: ReturnType<typeof selectColumns>;
  /** Shared prelude + per-kind joins, in join order. */
  readonly joins: MatrixJoin[];
  /** Organization scope + the kind's filters, in WHERE order. */
  readonly conditions: SQL[];
}

/** Parent-process alias shared by the select list, the joins and TLC's
 *  account-assertions ON clause (one alias per query, joined at most once). */
const parentProcess = aliasedTable(bpmProcesses, 'parent_process');
const PROCESS_NAME = sql<string>`COALESCE(${parentProcess.name}, ${bpmProcesses.name}, ${rcms.process})`;
const SUB_PROCESS_NAME = sql<string>`CASE WHEN ${parentProcess.id} IS NOT NULL THEN ${bpmProcesses.name} ELSE COALESCE(${bpmDiagrams.name}, ${rcms.subProcess}, '-') END`;

/** The four joins every kind shares, in order. */
function sharedJoins(): MatrixJoin[] {
  return [
    { type: 'inner', table: rcms, on: eq(rcmControls.rcmId, rcms.id) },
    { type: 'inner', table: controls, on: eq(rcmControls.controlId, controls.id) },
    { type: 'left', table: bpmNodeRcms, on: eq(rcms.id, bpmNodeRcms.rcmId) },
    { type: 'left', table: bpmDiagrams, on: eq(bpmNodeRcms.diagramId, bpmDiagrams.id) },
  ];
}

function extraJoin(name: MatrixJoinName, input: MatrixReadInput): MatrixJoin {
  switch (name) {
    case 'process':
      return {
        type: 'left', table: bpmProcesses,
        on: or(
          eq(controls.bpmProcessId, bpmProcesses.id),
          eq(bpmDiagrams.subProcess, bpmProcesses.name),
        ),
      };
    case 'parentProcess':
      return { type: 'left', table: parentProcess, on: eq(bpmProcesses.parentId, parentProcess.id) };
    case 'deficiencyAssertions':
      // FSLI default assertions, matched on the resolved FSLI name and on the
      // requested noGL (which overrides the process noGL when it is present).
      return {
        type: 'left', table: accountAssertions,
        on: and(
          eq(sql`COALESCE(${parentProcess.fsliName}, ${bpmProcesses.fsliName})`, accountAssertions.fsliName),
          eq(accountAssertions.noGL, input.noGL ? input.noGL : sql`COALESCE(${parentProcess.noGL}, ${bpmProcesses.noGL})`),
          eq(bpmProcesses.organizationId, accountAssertions.organizationId),
        ),
      };
  }
}

function filterCondition(name: MatrixFilter, input: MatrixReadInput): SQL | undefined {
  switch (name) {
    case 'level':
      return eq(controls.level, MATRIX_KIND_SPECS[input.kind].level);
    case 'year':
      return input.year ? eq(rcms.year, parseInt(input.year)) : undefined;
    case 'bpmProcessId': {
      const bpmProcessId = input.bpmProcessId;
      return bpmProcessId && bpmProcessId !== 'undefined' ? eq(controls.bpmProcessId, bpmProcessId) : undefined;
    }
    case 'noGL': {
      const noGL = input.noGL;
      return noGL && noGL !== 'undefined'
        ? or(like(rcms.id, `%-${noGL}`), sql`${controls.fsliCodes}::jsonb ? ${noGL}`)
        : undefined;
    }
  }
}

function selectColumns(input: MatrixReadInput) {
  const groups = MATRIX_KIND_SPECS[input.kind].columns;
  const group = (name: MatrixColumnGroup) => groups.includes(name);
  const noGL = input.noGL || null;
  return {
    mappingId: rcmControls.id,
    rcmId: rcms.id,
    controlId: controls.id,
    bpmProcessId: bpmProcesses.id,
    parentId: bpmProcesses.parentId,
    level: bpmProcesses.level,
    parentProcessName: PROCESS_NAME,
    parentBpmCode: sql<string>`COALESCE(${parentProcess.bpmCode}, ${bpmProcesses.bpmCode})`,
    processName: PROCESS_NAME,
    subProcessName: SUB_PROCESS_NAME,
    ...(group('fsli') ? {
      fsliName: sql<string>`COALESCE(${parentProcess.fsliName}, ${bpmProcesses.fsliName})`,
      noGL: sql<string>`COALESCE(${noGL}, ${parentProcess.noGL}, ${bpmProcesses.noGL})`,
    } : {}),
    riskDescription: rcms.riskDescription,
    isFraudRelated: rcms.isFraudRelated,
    riskRating: rcms.riskRating,
    controlCode: controls.code,
    baseControlName: controls.name,
    baseControlDescription: controls.description,
    mappedControlName: rcmControls.controlName,
    mappedControlDescription: rcmControls.controlDescription,
    ...(group('itgc') ? {
      itgcDomain: rcmControls.itgcDomain,
      itgcAssertions: rcmControls.itgcAssertions,
    } : {}),
    ...(group('tlcElcAssertions') ? {
      ipoC: rcmControls.ipoC,
      ipoA: rcmControls.ipoA,
      ipoV: rcmControls.ipoV,
      ipoRa: rcmControls.ipoRa,
      assertionE: rcmControls.assertionE,
      assertionC: rcmControls.assertionC,
      assertionA: rcmControls.assertionA,
      assertionCo: rcmControls.assertionCo,
      assertionVa: rcmControls.assertionVa,
      assertionRo: rcmControls.assertionRo,
      assertionPd: rcmControls.assertionPd,
    } : {}),
    ...(group('deficiencyAssertions') ? {
      defE: accountAssertions.assertionE,
      defC: accountAssertions.assertionC,
      defA: accountAssertions.assertionA,
      defCo: accountAssertions.assertionCo,
      defRo: accountAssertions.assertionRo,
      defVa: accountAssertions.assertionVa,
      defPd: accountAssertions.assertionPd,
    } : {}),
    controlType: rcmControls.controlType,
    controlNature: rcmControls.controlNature,
    automatedSubNature: rcmControls.automatedControlType,
    frequency: rcmControls.frequency,
    isKeyControl: rcmControls.isKeyControl,
    supportingDocs: rcmControls.supportingDocs,
    supportingApp: rcmControls.supportingApp,
    applicationId: rcmControls.applicationId,
    executingFunction: rcmControls.executingFunction,
    executorRole: rcmControls.executorRole,
    affectedFsliItem: rcmControls.affectedFsliItem,
    effectivePeriod: rcmControls.effectivePeriod,
    // Last on purpose: the pre-builder ELC select appended cosoPrinciples
    // after effectivePeriod, and the column order is kept byte-for-byte.
    ...(group('coso') ? { cosoPrinciples: rcmControls.cosoPrinciples } : {}),
  };
}

/** The whole read as data: select list, join order and WHERE order per kind.
 *  Pure — no db, so the SQL can be asserted without Postgres. */
export function planMatrixRead(input: MatrixReadInput): MatrixReadPlan {
  const spec = MATRIX_KIND_SPECS[input.kind];
  const conditions: SQL[] = [eq(rcmControls.organizationId, input.orgId)];
  for (const name of spec.filters) {
    const condition = filterCondition(name, input);
    if (condition) conditions.push(condition);
  }
  const joins = sharedJoins();
  for (const name of spec.joins) joins.push(extraJoin(name, input));
  return { columns: selectColumns(input), joins, conditions };
}

/** The one builder for the three matrix reads: applies the plan to a dynamic
 *  select (joins mutate and return it) and hangs the WHERE on it. Await it to
 *  execute; the caller owns attachTods / org enrichment / projection tails. */
export function buildMatrixSelect(db: DrizzleDb, input: MatrixReadInput) {
  const plan = planMatrixRead(input);
  const query = db.select(plan.columns).from(rcmControls).$dynamic();
  for (const join of plan.joins) {
    if (join.type === 'inner') query.innerJoin(join.table, join.on);
    else query.leftJoin(join.table, join.on);
  }
  return query.where(and(...plan.conditions));
}
