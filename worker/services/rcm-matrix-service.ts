import { eq, and, or, sql, like, inArray, aliasedTable, type SQL } from 'drizzle-orm';
import {
  rcms, controls, rcmControls, bpmProcesses, bpmDiagrams, bpmNodeRcms,
  accountAssertions, todEvaluations, organization
} from '../db/schema';
import type { DrizzleDb } from '../db';
import type {
  CreateVerificationDesignBody,
  VerificationBatchUpdateItem,
  VerificationDesignPatchBody,
} from '@shared/types';
import {
  applyAssertionFallback, applyBatchUpdate, applyVerificationDesignPatch, createVerificationDesign,
  matchesNoGL, projectVerificationRow,
} from './rcm-matrix-write';
import { createMatrixWriteDeps } from './rcm-matrix-drizzle';

interface TodPilarFields {
  pilarObjective: string | null;
  pilarTiming: string | null;
  pilarAuthority: string | null;
  pilarReliability: string | null;
  pilarCoverage: string | null;
  pilarEvidence: string | null;
  kkReference: string | null;
  conclusion: string | null;
  comment: string | null;
  evaluatorId: string | null;
}

/** Thin facade over the rcm-matrix-write domain module (arch-09 T4).
 *  Matrix reads stay here; verification writes (allow-lists, TOD upsert via
 *  decideTest, auto-deficiency, consolidated batch) live behind the domain
 *  seam. Routes are thin adapters. */
export class RcmMatrixService {
  constructor(private db: DrizzleDb) {}

  private async attachTods<T extends { controlId: string }>(orgId: string, rows: T[]): Promise<(T & TodPilarFields)[]> {
    const controlIds = rows.map(r => r.controlId);
    const tods: (typeof todEvaluations.$inferSelect)[] = controlIds.length > 0
      ? await this.db.select().from(todEvaluations)
        .where(and(
          inArray(todEvaluations.controlId, controlIds),
          eq(todEvaluations.organizationId, orgId)
        ))
      : [];
    const todMap = new Map<string, typeof todEvaluations.$inferSelect>(tods.map(t => [t.controlId, t]));
    return rows.map(row => {
      const tod = todMap.get(row.controlId);
      return {
        ...row,
        pilarObjective: tod?.pilarObjective ?? null,
        pilarTiming: tod?.pilarTiming ?? null,
        pilarAuthority: tod?.pilarAuthority ?? null,
        pilarReliability: tod?.pilarReliability ?? null,
        pilarCoverage: tod?.pilarCoverage ?? null,
        pilarEvidence: tod?.pilarEvidence ?? null,
        kkReference: tod?.kkReference ?? null,
        conclusion: tod?.conclusion ?? null,
        comment: tod?.comment ?? null,
        evaluatorId: tod?.evaluatorId ?? null,
      };
    });
  }

  private async orgMeta(orgId: string): Promise<{ companyName: string; locationCode: string }> {
    const org = await this.db.select().from(organization).where(eq(organization.id, orgId)).then((rows) => rows[0]);
    return { companyName: org?.name ?? 'N/A', locationCode: org?.entityCode ?? 'N/A' };
  }

  async getTlcMatrix(orgId: string, bpmProcessId?: string, year?: string, noGL?: string) {
    const parentProcess = aliasedTable(bpmProcesses, "parent_process");

    const query = this.db.select({
      mappingId: rcmControls.id,
      rcmId: rcms.id,
      controlId: controls.id,
      bpmProcessId: bpmProcesses.id,
      parentId: bpmProcesses.parentId,
      level: bpmProcesses.level,
      parentProcessName: sql<string>`COALESCE(${parentProcess.name}, ${bpmProcesses.name}, ${rcms.process})`,
      parentBpmCode: sql<string>`COALESCE(${parentProcess.bpmCode}, ${bpmProcesses.bpmCode})`,
      processName: sql<string>`COALESCE(${parentProcess.name}, ${bpmProcesses.name}, ${rcms.process})`,
      subProcessName: sql<string>`CASE 
        WHEN ${parentProcess.id} IS NOT NULL THEN ${bpmProcesses.name}
        ELSE COALESCE(${bpmDiagrams.name}, ${rcms.subProcess}, '-')
      END`,
      fsliName: sql<string>`COALESCE(${parentProcess.fsliName}, ${bpmProcesses.fsliName})`,
      noGL: sql<string>`COALESCE(${noGL || null}, ${parentProcess.noGL}, ${bpmProcesses.noGL})`,
      riskDescription: rcms.riskDescription,
      isFraudRelated: rcms.isFraudRelated,
      riskRating: rcms.riskRating,
      controlCode: controls.code,
      baseControlName: controls.name,
      baseControlDescription: controls.description,
      mappedControlName: rcmControls.controlName,
      mappedControlDescription: rcmControls.controlDescription,
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
      defE: accountAssertions.assertionE,
      defC: accountAssertions.assertionC,
      defA: accountAssertions.assertionA,
      defCo: accountAssertions.assertionCo,
      defRo: accountAssertions.assertionRo,
      defVa: accountAssertions.assertionVa,
      defPd: accountAssertions.assertionPd,
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
    })
    .from(rcmControls)
    .innerJoin(rcms, eq(rcmControls.rcmId, rcms.id))
    .innerJoin(controls, eq(rcmControls.controlId, controls.id))
    .leftJoin(bpmNodeRcms, eq(rcms.id, bpmNodeRcms.rcmId))
    .leftJoin(bpmDiagrams, eq(bpmNodeRcms.diagramId, bpmDiagrams.id))
    .leftJoin(bpmProcesses, or(
      eq(controls.bpmProcessId, bpmProcesses.id),
      eq(bpmDiagrams.subProcess, bpmProcesses.name)
    ))
    .leftJoin(parentProcess, eq(bpmProcesses.parentId, parentProcess.id))
    .leftJoin(accountAssertions, and(
      eq(sql`COALESCE(${parentProcess.fsliName}, ${bpmProcesses.fsliName})`, accountAssertions.fsliName),
      eq(accountAssertions.noGL, noGL ? noGL : sql`COALESCE(${parentProcess.noGL}, ${bpmProcesses.noGL})`),
      eq(bpmProcesses.organizationId, accountAssertions.organizationId)
    ));

    const conds: SQL[] = [
      eq(rcmControls.organizationId, orgId),
      eq(controls.level, 'TLC')
    ];
    if (bpmProcessId && bpmProcessId !== 'undefined') conds.push(eq(controls.bpmProcessId, bpmProcessId));
    if (year) conds.push(eq(rcms.year, parseInt(year)));
    if (noGL && noGL !== 'undefined') {
      conds.push(or(
        like(rcms.id, `%-${noGL}`),
        sql`${controls.fsliCodes}::jsonb ? ${noGL}`
      ) as SQL);
    }

    const results = await query.where(and(...conds));
    const withTods = await this.attachTods(orgId, results);
    const org = await this.orgMeta(orgId);
    return withTods.map((row) => ({ ...applyAssertionFallback(row), ...org }));
  }

  async getElcMatrix(orgId: string, year?: string) {
    const parentProcess = aliasedTable(bpmProcesses, "parent_process");

    const conds: SQL[] = [
      eq(rcmControls.organizationId, orgId),
      eq(controls.level, 'ELC')
    ];
    if (year) conds.push(eq(rcms.year, parseInt(year)));

    const results = await this.db.select({
      mappingId: rcmControls.id,
      rcmId: rcms.id,
      controlId: controls.id,
      bpmProcessId: bpmProcesses.id,
      parentId: bpmProcesses.parentId,
      level: bpmProcesses.level,
      parentProcessName: sql<string>`COALESCE(${parentProcess.name}, ${bpmProcesses.name}, ${rcms.process})`,
      parentBpmCode: sql<string>`COALESCE(${parentProcess.bpmCode}, ${bpmProcesses.bpmCode})`,
      processName: sql<string>`COALESCE(${parentProcess.name}, ${bpmProcesses.name}, ${rcms.process})`,
      subProcessName: sql<string>`CASE 
        WHEN ${parentProcess.id} IS NOT NULL THEN ${bpmProcesses.name}
        ELSE COALESCE(${bpmDiagrams.name}, ${rcms.subProcess}, '-')
      END`,
      riskDescription: rcms.riskDescription,
      isFraudRelated: rcms.isFraudRelated,
      riskRating: rcms.riskRating,
      controlCode: controls.code,
      baseControlName: controls.name,
      baseControlDescription: controls.description,
      mappedControlName: rcmControls.controlName,
      mappedControlDescription: rcmControls.controlDescription,
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
      cosoPrinciples: rcmControls.cosoPrinciples,
      cosoComponent: sql<string>`CASE 
        WHEN ${rcmControls.cosoPrinciples}::text ILIKE '%P1%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P2%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P3%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P4%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P5%' THEN 'Control Environment'
        WHEN ${rcmControls.cosoPrinciples}::text ILIKE '%P6%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P7%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P8%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P9%' THEN 'Risk Assessment'
        WHEN ${rcmControls.cosoPrinciples}::text ILIKE '%P10%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P11%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P12%' THEN 'Control Activities'
        WHEN ${rcmControls.cosoPrinciples}::text ILIKE '%P13%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P14%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P15%' THEN 'Information & Communication'
        WHEN ${rcmControls.cosoPrinciples}::text ILIKE '%P16%' OR ${rcmControls.cosoPrinciples}::text ILIKE '%P17%' THEN 'Monitoring Activities'
        ELSE 'Entity-Level Control'
      END`,
    })
    .from(rcmControls)
    .innerJoin(rcms, eq(rcmControls.rcmId, rcms.id))
    .innerJoin(controls, eq(rcmControls.controlId, controls.id))
    .leftJoin(bpmNodeRcms, eq(rcms.id, bpmNodeRcms.rcmId))
    .leftJoin(bpmDiagrams, eq(bpmNodeRcms.diagramId, bpmDiagrams.id))
    .leftJoin(bpmProcesses, or(
      eq(controls.bpmProcessId, bpmProcesses.id),
      eq(bpmDiagrams.subProcess, bpmProcesses.name)
    ))
    .leftJoin(parentProcess, eq(bpmProcesses.parentId, parentProcess.id))
    .where(and(...conds));

    const withTods = await this.attachTods(orgId, results);
    const org = await this.orgMeta(orgId);
    return withTods.map((row) => ({ ...row, ...org }));
  }

  async getItgcMatrix(orgId: string, year?: string, bpmProcessId?: string) {
    const parentProcess = aliasedTable(bpmProcesses, "parent_process");

    const conds: SQL[] = [
      eq(rcmControls.organizationId, orgId),
      eq(controls.level, 'ITGC')
    ];
    if (year) conds.push(eq(rcms.year, parseInt(year)));
    if (bpmProcessId && bpmProcessId !== 'undefined') conds.push(eq(controls.bpmProcessId, bpmProcessId));

    const results = await this.db.select({
      mappingId: rcmControls.id,
      rcmId: rcms.id,
      controlId: controls.id,
      bpmProcessId: bpmProcesses.id,
      parentId: bpmProcesses.parentId,
      level: bpmProcesses.level,
      parentProcessName: sql<string>`COALESCE(${parentProcess.name}, ${bpmProcesses.name}, ${rcms.process})`,
      parentBpmCode: sql<string>`COALESCE(${parentProcess.bpmCode}, ${bpmProcesses.bpmCode})`,
      processName: sql<string>`COALESCE(${parentProcess.name}, ${bpmProcesses.name}, ${rcms.process})`,
      subProcessName: sql<string>`CASE 
        WHEN ${parentProcess.id} IS NOT NULL THEN ${bpmProcesses.name}
        ELSE COALESCE(${bpmDiagrams.name}, ${rcms.subProcess}, '-')
      END`,
      riskDescription: rcms.riskDescription,
      isFraudRelated: rcms.isFraudRelated,
      riskRating: rcms.riskRating,
      controlCode: controls.code,
      baseControlName: controls.name,
      baseControlDescription: controls.description,
      mappedControlName: rcmControls.controlName,
      mappedControlDescription: rcmControls.controlDescription,
      itgcDomain: rcmControls.itgcDomain,
      itgcAssertions: rcmControls.itgcAssertions,
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
    })
    .from(rcmControls)
    .innerJoin(rcms, eq(rcmControls.rcmId, rcms.id))
    .innerJoin(controls, eq(rcmControls.controlId, controls.id))
    .leftJoin(bpmNodeRcms, eq(rcms.id, bpmNodeRcms.rcmId))
    .leftJoin(bpmDiagrams, eq(bpmNodeRcms.diagramId, bpmDiagrams.id))
    .leftJoin(parentProcess, eq(bpmProcesses.parentId, parentProcess.id))
    .where(and(...conds));

    const withTods = await this.attachTods(orgId, results);
    const org = await this.orgMeta(orgId);
    return withTods.map((row) => ({ ...row, ...org }));
  }

  async getVerificationDesign(orgId: string, filters: { bpmProcessId?: string; year?: string; noGL?: string }) {
    const { bpmProcessId, year, noGL } = filters;
    const results = await this.db.query.rcmControls.findMany({
      where: and(
        eq(rcmControls.organizationId, orgId),
        bpmProcessId && bpmProcessId !== 'undefined' ? eq(rcmControls.rcmId, bpmProcessId) : undefined,
        year && year !== 'undefined' ? eq(rcmControls.year, parseInt(year)) : undefined
      ),
      with: {
        rcm: true,
        control: {
          with: {
            todEvaluations: true
          }
        }
      }
    });
    const org = await this.orgMeta(orgId);
    return results
      .filter((m) => matchesNoGL(m.control?.fsliCodes ?? null, noGL))
      .map((m) => projectVerificationRow(
        {
          ...m,
          control: m.control ? {
            code: m.control.code,
            fsliCodes: m.control.fsliCodes,
            todEvaluations: m.control.todEvaluations,
          } : null,
        },
        { name: org.companyName, entityCode: org.locationCode },
      ));
  }

  /** Write seam delegates — allow-lists, TOD decideTest, deficiency fan-out and
   *  consolidated batch live in the domain module. AppError propagates to onError. */
  async patchVerificationDesign(orgId: string, userId: string, mappingId: string, body: VerificationDesignPatchBody) {
    return applyVerificationDesignPatch(createMatrixWriteDeps(this.db, orgId), {
      mappingId, organizationId: orgId, userId, body,
    });
  }

  async batchUpdateMatrix(orgId: string, items: VerificationBatchUpdateItem[]) {
    return applyBatchUpdate(createMatrixWriteDeps(this.db, orgId), { items, organizationId: orgId });
  }

  async saveVerificationDesign(orgId: string, userId: string, body: CreateVerificationDesignBody) {
    return createVerificationDesign(createMatrixWriteDeps(this.db, orgId), {
      ...body, organizationId: orgId, userId,
    });
  }
}
