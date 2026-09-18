import { eq, and, or, sql, like, inArray, aliasedTable } from 'drizzle-orm';
import { 
  rcms, controls, rcmControls, bpmProcesses, bpmDiagrams, bpmNodeRcms, 
  accountAssertions, todEvaluations
} from '../db/schema';
import type { DrizzleDb } from '../db';
import type { RCM } from '@shared/types';
import { AuditService } from './audit-service';
import { DeficiencyService } from './deficiency-service';

export class RcmMatrixService {
  constructor(private db: DrizzleDb) {}

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

    let finalConditions = and(
      eq(rcmControls.organizationId, orgId),
      eq(controls.level, 'TLC')
    );

    if (bpmProcessId && bpmProcessId !== 'undefined') {
      finalConditions = and(finalConditions, eq(controls.bpmProcessId, bpmProcessId)) as any;
    }
    
    if (year) {
      finalConditions = and(finalConditions, eq(rcms.year, parseInt(year))) as any;
    }

    if (noGL && (!bpmProcessId || bpmProcessId === 'undefined')) {
      finalConditions = and(finalConditions, like(rcms.id, `%-${noGL}`)) as any;
    }

    const results = await query.where(finalConditions);

    const controlIds = results.map(r => r.controlId);
    let tods: any[] = [];
    if (controlIds.length > 0) {
      tods = await this.db.select().from(todEvaluations)
        .where(and(
          inArray(todEvaluations.controlId, controlIds),
          eq(todEvaluations.organizationId, orgId)
        ));
    }

    const todMap = new Map();
    tods.forEach(t => todMap.set(t.controlId, t));

    return results.map(row => {
      const tod = todMap.get(row.controlId);
      return {
        ...row,
        pilarObjective: tod?.pilarObjective,
        pilarTiming: tod?.pilarTiming,
        pilarAuthority: tod?.pilarAuthority,
        pilarReliability: tod?.pilarReliability,
        pilarCoverage: tod?.pilarCoverage,
        pilarEvidence: tod?.pilarEvidence,
        kkReference: tod?.kkReference,
        conclusion: tod?.conclusion,
        comment: tod?.comment,
        evaluatorId: tod?.evaluatorId,
      };
    });
  }

  async getElcMatrix(orgId: string, year?: string) {
    const parentProcess = aliasedTable(bpmProcesses, "parent_process");

    let finalConditions = and(
      eq(rcmControls.organizationId, orgId),
      eq(controls.level, 'ELC')
    );

    if (year) {
      finalConditions = and(finalConditions, eq(rcms.year, parseInt(year))) as any;
    }

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
    .where(finalConditions);

    const controlIds = results.map(r => r.controlId);
    let tods: any[] = [];
    if (controlIds.length > 0) {
      tods = await this.db.select().from(todEvaluations)
        .where(and(
          inArray(todEvaluations.controlId, controlIds),
          eq(todEvaluations.organizationId, orgId)
        ));
    }

    const todMap = new Map();
    tods.forEach(t => todMap.set(t.controlId, t));

    return results.map(row => {
      const tod = todMap.get(row.controlId);
      return {
        ...row,
        pilarObjective: tod?.pilarObjective,
        pilarTiming: tod?.pilarTiming,
        pilarAuthority: tod?.pilarAuthority,
        pilarReliability: tod?.pilarReliability,
        pilarCoverage: tod?.pilarCoverage,
        pilarEvidence: tod?.pilarEvidence,
        kkReference: tod?.kkReference,
        conclusion: tod?.conclusion,
        comment: tod?.comment,
        evaluatorId: tod?.evaluatorId,
      };
    });
  }

  async getItgcMatrix(orgId: string, year?: string) {
    const parentProcess = aliasedTable(bpmProcesses, "parent_process");

    let finalConditions = and(
      eq(rcmControls.organizationId, orgId),
      eq(controls.level, 'ITGC')
    );

    if (year) {
      finalConditions = and(finalConditions, eq(rcms.year, parseInt(year))) as any;
    }

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
    .leftJoin(bpmProcesses, or(
      eq(controls.bpmProcessId, bpmProcesses.id),
      eq(bpmDiagrams.subProcess, bpmProcesses.name)
    ))
    .leftJoin(parentProcess, eq(bpmProcesses.parentId, parentProcess.id))
    .where(finalConditions);

    const controlIds = results.map(r => r.controlId);
    let tods: any[] = [];
    if (controlIds.length > 0) {
      tods = await this.db.select().from(todEvaluations)
        .where(and(
          inArray(todEvaluations.controlId, controlIds),
          eq(todEvaluations.organizationId, orgId)
        ));
    }

    const todMap = new Map();
    tods.forEach(t => todMap.set(t.controlId, t));

    return results.map(row => {
      const tod = todMap.get(row.controlId);
      return {
        ...row,
        pilarObjective: tod?.pilarObjective,
        pilarTiming: tod?.pilarTiming,
        pilarAuthority: tod?.pilarAuthority,
        pilarReliability: tod?.pilarReliability,
        pilarCoverage: tod?.pilarCoverage,
        pilarEvidence: tod?.pilarEvidence,
        kkReference: tod?.kkReference,
        conclusion: tod?.conclusion,
        comment: tod?.comment,
        evaluatorId: tod?.evaluatorId,
      };
    });
  }

  async saveVerificationDesign(orgId: string, userId: string, body: any) {
    const {
      createNewRcm,
      rcmId: existingRcmId,
      process,
      subProcess,
      riskDescription,
      riskRating,
      isFraudRelated,
      controlCode,
      controlName,
      controlDescription,
      supportingDocs,
      isKeyControl,
      ipoC, ipoA, ipoV, ipoRa,
      assertionE, assertionC, assertionA, assertionCo, assertionVa, assertionRo, assertionPd,
      controlType, controlNature, automatedControlType, frequency,
      supportingApp, applicationId, executingFunction, executorRole, affectedFsliItem, effectivePeriod,
      bpmProcessId,
      pilarObjective, pilarTiming, pilarAuthority, pilarReliability, pilarCoverage, pilarEvidence,
      kkReference, conclusion, comment,
    } = body;

    let finalRcmId = existingRcmId;

    if (createNewRcm) {
      if (!process || !subProcess || !riskDescription) {
        throw new Error('Process, Sub-Process, and Risk Description are required when creating a new RCM.');
      }
      finalRcmId = crypto.randomUUID();
      await this.db.insert(rcms).values({
        id: finalRcmId,
        organizationId: orgId,
        process: process || 'New Process',
        subProcess: subProcess || 'New Sub-Process',
        riskDescription: riskDescription || 'New Risk',
        isFraudRelated: isFraudRelated ?? false,
        riskRating: riskRating || 'Medium',
        status: 'Active',
      } as any);
    }

    if (!finalRcmId) {
      throw new Error('An existing RCM must be selected or a new one must be created.');
    }

    const newControlId = crypto.randomUUID();
    const generatedCode = controlCode || `C-${newControlId.substring(0, 8)}`;

    await this.db.insert(controls).values({
      id: newControlId,
      organizationId: orgId,
      rcmId: finalRcmId,
      code: generatedCode,
      name: controlName || 'New Control',
      description: controlDescription,
      level: 'TLC',
      bpmProcessId: bpmProcessId || null,
    } as any);

    const newMappingId = crypto.randomUUID();
    await this.db.insert(rcmControls).values({
      id: newMappingId,
      organizationId: orgId,
      rcmId: finalRcmId,
      controlId: newControlId,
      controlName,
      controlDescription,
      supportingDocs,
      isKeyControl: isKeyControl ?? false,
      ipoC: ipoC || 'N', ipoA: ipoA || 'N', ipoV: ipoV || 'N', ipoRa: ipoRa || 'N',
      assertionE: assertionE || 'N', assertionC: assertionC || 'N', assertionA: assertionA || 'N',
      assertionCo: assertionCo || 'N', assertionVa: assertionVa || 'N',
      assertionRo: assertionRo || 'N', assertionPd: assertionPd || 'N',
      controlType, controlNature, automatedControlType, frequency,
      supportingApp, applicationId, executingFunction, executorRole, affectedFsliItem, effectivePeriod,
    } as any);

    const newTodId = crypto.randomUUID();
    await this.db.insert(todEvaluations).values({
      id: newTodId,
      organizationId: orgId,
      controlId: newControlId,
      evaluatorId: userId,
      csaId: null,
      pilarObjective, pilarTiming, pilarAuthority, pilarReliability, pilarCoverage, pilarEvidence,
      kkReference, conclusion, comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    if (conclusion === 'Ineffective') {
      const defService = new DeficiencyService(this.db);
      await defService.createAutoDeficiency({
        organizationId: orgId,
        controlId: newControlId,
        description: `Hasil Verifikasi Desain (TOD) Ineffective untuk kontrol baru: ${comment || 'No justification provided.'}`,
        source: 'Lini 2 - TOD Review',
        userId,
        period: 'TOD-Evaluation'
      });
    }

    return { 
      success: true, 
      mappingId: newMappingId,
      controlId: newControlId,
      rcmId: finalRcmId,
    };
  }
}
