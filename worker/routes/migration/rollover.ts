import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import type { HonoEnv } from '../../app';
import type { DrizzleDb } from '../../db';
import { getDb } from '../../db';
import * as schema from '../../db/schema';
import { bad, ok } from '../../lib/utils';
import { rbac } from '../../lib/guard';
import { normalizeYear, planPeriodRollover } from '../../services/scoping-service';

interface RolloverBody {
  sourceYear?: string | number | null;
  targetYear?: string | number | null;
  force?: boolean;
}

/** True when the target year already holds BPM processes or RCM risks. */
async function targetYearHasData(db: DrizzleDb, orgId: string, targetYear: number | null): Promise<boolean> {
  if (targetYear === null) return false;

  const bpm = await db.select({ id: schema.bpmProcesses.id }).from(schema.bpmProcesses)
    .where(and(eq(schema.bpmProcesses.organizationId, orgId), eq(schema.bpmProcesses.year, targetYear)))
    .limit(1);
  if (bpm.length > 0) return true;

  const rcm = await db.select({ id: schema.rcms.id }).from(schema.rcms)
    .where(and(eq(schema.rcms.organizationId, orgId), eq(schema.rcms.year, targetYear)))
    .limit(1);
  return rcm.length > 0;
}

const rolloverRoutes = new Hono<HonoEnv>();

/**
 * Tenant-wide destructive year clone. Guarded by RBAC; NOT interchangeable with
 * `ScopingService.carryForward` (that one clones diagrams/rcms/controls only —
 * no processes, account assertions, deficiencies or action plans, no `force`).
 */
rolloverRoutes.post('/migration/rollover', rbac(['Line 1', 'Line 2', 'Admin']), async (c) => {
  const { sourceYear, targetYear, force } = await c.req.json<RolloverBody>();
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  const forceRollover = !!force;
  const targetHasData = forceRollover ? false : await targetYearHasData(db, orgId, normalizeYear(targetYear));

  const plan = planPeriodRollover({ sourceYear, targetYear, force: forceRollover, targetHasData });
  // `strict: false` in tsconfig.app.json (which reaches this file via
  // `src/test/security.test.ts` → `worker/app`) collapses boolean literals, so
  // `!plan.ok` does NOT narrow here. Keep the explicit comparison — same
  // precedent as `workflow-execution.ts` (`decision.ok === false`).
  if (plan.ok === false) return bad(c, plan.code, plan.status, plan.message);

  const { sourceYear: sYear, targetYear: tYear } = plan;

  await db.transaction(async (tx) => {
    const processIdMap = new Map<string, string>();
    const riskIdMap = new Map<string, string>();
    const controlIdMap = new Map<string, string>();

    // 1. Clone Account Assertions
    const sourceAssertions = await tx.select().from(schema.accountAssertions)
      .where(and(eq(schema.accountAssertions.organizationId, orgId), eq(schema.accountAssertions.year, sYear)));

    for (const ass of sourceAssertions) {
      await tx.insert(schema.accountAssertions).values({
        id: `ass_${crypto.randomUUID()}`,
        organizationId: orgId,
        fsliName: ass.fsliName,
        noGL: ass.noGL,
        year: tYear,
        assertionE: ass.assertionE,
        assertionC: ass.assertionC,
        assertionA: ass.assertionA,
        assertionCo: ass.assertionCo,
        assertionRo: ass.assertionRo,
        assertionVa: ass.assertionVa,
        assertionPd: ass.assertionPd,
        updatedAt: new Date(),
        updatedBy: userId,
      });
    }

    // 2. Clone BPM Processes
    const sourceProcesses = await tx.select().from(schema.bpmProcesses)
      .where(and(eq(schema.bpmProcesses.organizationId, orgId), eq(schema.bpmProcesses.year, sYear)));

    for (const proc of sourceProcesses) {
      const newId = `proc_${crypto.randomUUID()}`;
      processIdMap.set(proc.id, newId);
      await tx.insert(schema.bpmProcesses).values({
        id: newId,
        organizationId: orgId,
        noGL: proc.noGL,
        bpmCode: proc.bpmCode,
        fsliName: proc.fsliName,
        name: proc.name,
        year: tYear,
        riskCount: proc.riskCount,
        controlCount: proc.controlCount,
        standardTestProcedure: proc.standardTestProcedure,
        workflowStatus: 'Draft',
        createdAt: new Date(),
        createdBy: userId,
      });
    }

    // 3. Clone BPM Diagrams
    const sourceDiagrams = await tx.select().from(schema.bpmDiagrams)
      .where(and(eq(schema.bpmDiagrams.organizationId, orgId), eq(schema.bpmDiagrams.year, sYear)));

    for (const diag of sourceDiagrams) {
      await tx.insert(schema.bpmDiagrams).values({
        id: `diag_${crypto.randomUUID()}`,
        organizationId: orgId,
        name: diag.name,
        subProcess: diag.subProcess,
        year: tYear,
        nodes: diag.nodes,
        edges: diag.edges,
        metadata: diag.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      });
    }

    // 4. Clone RCMs
    const sourceRcms = await tx.select().from(schema.rcms)
      .where(and(eq(schema.rcms.organizationId, orgId), eq(schema.rcms.year, sYear)));

    for (const rcm of sourceRcms) {
      const newId = `risk_${crypto.randomUUID()}`;
      riskIdMap.set(rcm.id, newId);
      await tx.insert(schema.rcms).values({
        id: newId,
        organizationId: orgId,
        year: tYear,
        riskLibraryId: rcm.riskLibraryId,
        process: rcm.process,
        subProcess: rcm.subProcess,
        riskDescription: rcm.riskDescription,
        isFraudRelated: rcm.isFraudRelated,
        riskRating: rcm.riskRating,
        status: 'Active',
        diagramId: rcm.diagramId,
      });
    }

    // 5. Clone Controls
    const sourceControls = await tx.select().from(schema.controls)
      .where(and(eq(schema.controls.organizationId, orgId), eq(schema.controls.year, sYear)));

    for (const control of sourceControls) {
      const newId = `ctrl_${crypto.randomUUID()}`;
      controlIdMap.set(control.id, newId);

      await tx.insert(schema.controls).values({
        id: newId,
        organizationId: orgId,
        bpmProcessId: control.bpmProcessId ? processIdMap.get(control.bpmProcessId) ?? null : null,
        year: tYear,
        code: control.code,
        name: control.name,
        description: control.description,
        ownerId: control.ownerId,
        level: control.level,
        type: control.type,
        nature: control.nature,
        frequency: control.frequency,
        riskRating: control.riskRating,
        riskAssessment: control.riskAssessment,
        bpmStatus: control.bpmStatus,
        fsliCodes: control.fsliCodes,
        relatedControlIds: control.relatedControlIds,
        attachmentUrl: control.attachmentUrl,
        businessProcess: control.businessProcess,
        subProcess: control.subProcess,
        location: control.location,
        isFraudRelated: control.isFraudRelated,
        isKeyControl: control.isKeyControl,
        ipos: control.ipos,
        assertions: control.assertions,
        cosoPrinciples: control.cosoPrinciples,
        supportingDocs: control.supportingDocs,
        reference: control.reference,
        applicationId: control.applicationId,
        attributeQuestions: control.attributeQuestions,
        executorRole: control.executorRole,
        effectiveDate: control.effectiveDate,
        csaStatus: 'Not Assessed',
        lastCsaDate: null,
        itgcDomain: control.itgcDomain,
        itgcAssertions: control.itgcAssertions,
        automatedSubNature: control.automatedSubNature,
        supportingApp: control.supportingApp,
        itApplication: control.itApplication,
        eucComplexity: control.eucComplexity,
        ipeType: control.ipeType,
        isMigrated: control.isMigrated,
        aiGuessedFields: control.aiGuessedFields,
      });
    }

    // 6. Clone RCM-Control Mappings
    const sourceRcmControls = await tx.select().from(schema.rcmControls)
      .where(and(eq(schema.rcmControls.organizationId, orgId), eq(schema.rcmControls.year, sYear)));

    for (const mapping of sourceRcmControls) {
      const newRcmId = riskIdMap.get(mapping.rcmId);
      const newControlId = controlIdMap.get(mapping.controlId);

      if (newRcmId && newControlId) {
        await tx.insert(schema.rcmControls).values({
          id: `map_${crypto.randomUUID()}`,
          organizationId: orgId,
          rcmId: newRcmId,
          controlId: newControlId,
          year: tYear,
          controlName: mapping.controlName,
          controlDescription: mapping.controlDescription,
          supportingDocs: mapping.supportingDocs,
          isKeyControl: mapping.isKeyControl,
          ipoC: mapping.ipoC,
          ipoA: mapping.ipoA,
          ipoV: mapping.ipoV,
          ipoRa: mapping.ipoRa,
          assertionE: mapping.assertionE,
          assertionC: mapping.assertionC,
          assertionA: mapping.assertionA,
          assertionCo: mapping.assertionCo,
          assertionVa: mapping.assertionVa,
          assertionRo: mapping.assertionRo,
          assertionPd: mapping.assertionPd,
          controlType: mapping.controlType,
          controlNature: mapping.controlNature,
          frequency: mapping.frequency,
          supportingApp: mapping.supportingApp,
          applicationId: mapping.applicationId,
          executingFunction: mapping.executingFunction,
          executorRole: mapping.executorRole,
          affectedFsliItem: mapping.affectedFsliItem,
          effectivePeriod: mapping.effectivePeriod,
          cosoPrinciples: mapping.cosoPrinciples,
          itgcDomain: mapping.itgcDomain,
          itgcAssertions: mapping.itgcAssertions,
          automatedControlType: mapping.automatedControlType,
        });
      }
    }

    // 7. Carry Forward Open Deficiencies and their Action Plans
    const openDeficiencies = await tx.select().from(schema.deficiencies)
      .where(and(eq(schema.deficiencies.organizationId, orgId), eq(schema.deficiencies.status, 'Open')));

    for (const deficiency of openDeficiencies) {
      const newId = `def_${crypto.randomUUID()}`;

      await tx.insert(schema.deficiencies).values({
        id: newId,
        organizationId: orgId,
        controlId: deficiency.controlId ? controlIdMap.get(deficiency.controlId) ?? null : null,
        description: deficiency.description,
        severity: deficiency.severity,
        identifiedDate: deficiency.identifiedDate,
        identifiedBy: deficiency.identifiedBy,
        status: 'Open',
        rootCause: deficiency.rootCause,
        magnitude: deficiency.magnitude,
        exposureValue: deficiency.exposureValue,
        likelihood: deficiency.likelihood,
        assertions: deficiency.assertions,
        flowchartPath: deficiency.flowchartPath,
        correctiveActionTaken: deficiency.correctiveActionTaken,
        remediationEvidence: deficiency.remediationEvidence,
        compensatingControlIds: deficiency.compensatingControlIds,
        source: deficiency.source,
      });

      const plans = await tx.select().from(schema.actionPlans)
        .where(and(eq(schema.actionPlans.organizationId, orgId), eq(schema.actionPlans.deficiencyId, deficiency.id)));

      for (const plan of plans) {
        await tx.insert(schema.actionPlans).values({
          id: `plan_${crypto.randomUUID()}`,
          organizationId: orgId,
          deficiencyId: newId,
          description: plan.description,
          ownerId: plan.ownerId,
          dueDate: plan.dueDate,
          status: plan.status,
          relatedFunction: plan.relatedFunction,
          picName: plan.picName,
          planDescription: plan.planDescription,
          activityDetail: plan.activityDetail,
          remediatedControlDescription: plan.remediatedControlDescription,
          targetDate: plan.targetDate,
          actualCompletionDate: plan.actualCompletionDate,
          isApprovedByLine2: plan.isApprovedByLine2,
          isBeforeYearEnd: plan.isBeforeYearEnd,
          workflowStatus: plan.workflowStatus,
          workflowHistory: plan.workflowHistory,
          severity: plan.severity,
          rescheduleReason: plan.rescheduleReason,
        });
      }
    }
  });

  return ok(c, { success: true });
});

export default rolloverRoutes;
