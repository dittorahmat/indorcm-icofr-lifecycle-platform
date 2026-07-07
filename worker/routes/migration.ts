import { Hono } from 'hono';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { HonoEnv } from '../app';
import { ok } from '../lib/utils';

const migration = new Hono<HonoEnv>();

// Helper for generating IDs in worker context if needed
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

migration.post('/migration/finalize', async (c) => {
  const { sessionId, year, tbData, rcmData, simulationParams, tbFileName } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  try {
    // 1. Process TB Data
    if (tbData && tbData.length > 0) {
      const snapshotId = `snap_${generateId()}`;
      
      // Create GL Snapshot
      await db.insert(schema.glSnapshots).values({
        id: snapshotId,
        organizationId: orgId,
        filename: tbFileName || `Migration_${year}_TB`,
        uploadDate: new Date(),
        status: 'Mapped',
        isActive: true,
      });

      // Prepare GL Rows for Batch Insert
      const glRowsToInsert = tbData.map((row: any, idx: number) => ({
        id: generateId(),
        snapshotId: snapshotId,
        organizationId: orgId,
        ymd: row.ymd || String(year),
        entityCode: row.entityCode,
        parentEntityCode: row.parentEntityCode,
        entityId: null,
        noGL: row.accountCode,
        glDesc: row.accountName,
        currency: row.currency || 'IDR',
        balance: parseFloat(row.balance) || 0,
        fsliBalance: parseFloat(row.fsliBalance) || 0,
        fsliCode: row.fsliCode,
        fsliName: row.suggestedFsli,
        category: row.category,
        subKategori: row.subKategori,
        noUrut: row.noUrut || (idx + 1),
        mappingConfidence: row.confidence,
        assignedDepartmentIds: [],
        ownerAcceptance: null
      }));

      // Batch insert rows (chunks of 100)
      const batchSize = 100;
      for (let i = 0; i < glRowsToInsert.length; i += batchSize) {
        const batch = glRowsToInsert.slice(i, i + batchSize);
        await db.insert(schema.glRows).values(batch);
      }

      // Calculate significant accounts based on PM threshold (aggregated by FSLI)
      const pmValue = simulationParams?.pmValue || 0;
      const fsliAggregation = new Map<string, { name: string, balance: number, fsliBalance: number, fsliCode?: string }>();
      
      tbData.forEach((row: any) => {
        const name = row.suggestedFsli || row.accountName;
        const balance = Math.abs(parseFloat(row.balance)) || 0;
        const fBal = Math.abs(parseFloat(row.fsliBalance)) || 0;
        
        const existing = fsliAggregation.get(name);
        if (existing) {
          existing.balance += balance;
          if (existing.fsliBalance === 0 && fBal > 0) {
            existing.fsliBalance = fBal;
          }
        } else {
          fsliAggregation.set(name, {
            name,
            balance,
            fsliBalance: fBal,
            fsliCode: row.fsliCode
          });
        }
      });

      const significantAccounts = Array.from(fsliAggregation.values())
        .map(item => {
          const finalBalance = (item.fsliBalance > 0) ? item.fsliBalance : item.balance;
          return {
            name: item.name,
            balance: finalBalance,
            fsliCode: item.fsliCode,
            isQuantitative: finalBalance >= pmValue,
            assignedDepartmentIds: []
          };
        })
        .filter(item => item.isQuantitative);

      // Create Approved Materiality Simulation
      await db.insert(schema.simulations).values({
        id: `sim_${generateId()}`,
        organizationId: orgId,
        glSnapshotId: snapshotId,
        name: `Baseline ${year}`,
        year: parseInt(year),
        status: 'Approved',
        workflowStatus: 'Approved',
        basis: simulationParams?.basis || null,
        omPercentage: simulationParams?.omPercentage || 0,
        haircutPercentage: simulationParams?.haircutPercentage || 0,
        locationCount: simulationParams?.locationCount || 1,
        omValue: simulationParams?.omValue || 0,
        pmValue: simulationParams?.pmValue || 0,
        createdBy: userId,
        createdAt: new Date(),
        significantAccounts: significantAccounts
      });
    }

    // 2. Process RCM Data
    if (rcmData && rcmData.length > 0) {
      const processes = Array.from(new Set(rcmData.map((r: any) => r.processName)));
      
      for (const procName of processes) {
        const processId = `proc_${generateId()}`;
        const procRows = rcmData.filter((r: any) => r.processName === procName);
        
        // Create Process
        await db.insert(schema.bpmProcesses).values({
          id: processId,
          organizationId: orgId,
          noGL: procRows[0].accountCode || "",
          fsliName: procRows[0].affectedFsliItem || null,
          name: procName as string,
          year: parseInt(year),
          workflowStatus: 'Draft',
          createdAt: new Date(),
        });

        // Create Diagram Placeholder
        await db.insert(schema.bpmDiagrams).values({
          id: `diag_${generateId()}`,
          organizationId: orgId,
          name: `Flow: ${procName}`,
          subProcess: procName as string,
          year: parseInt(year),
          nodes: [],
          edges: [],
          createdAt: new Date(),
        });

        const risks = Array.from(new Set(procRows.map((r: any) => r.riskDescription)));
        
        for (const riskDesc of risks) {
          const riskId = `risk_${generateId()}`;
          const riskRows = procRows.filter((r: any) => r.riskDescription === riskDesc);
          
          await db.insert(schema.rcms).values({
            id: riskId,
            organizationId: orgId,
            process: procName as string,
            subProcess: procName as string,
            year: parseInt(year),
            riskDescription: riskDesc as string,
            status: 'Active'
          });

          for (const row of riskRows) {
            const controlId = `ctrl_${generateId()}`;
            await db.insert(schema.controls).values({
              id: controlId,
              organizationId: orgId,
              bpmProcessId: row.level === 'ELC' ? null : processId,
              year: parseInt(year),
              code: row.controlCode || `CTRL-${generateId().substring(0, 8).toUpperCase()}`,
              name: row.controlName || "Migrated Control",
              description: row.controlDescription,
              nature: row.controlNature || row.nature,
              type: row.controlType || row.type,
              frequency: row.frequency,
              level: row.level || 'TLC',
              isKeyControl: row.isKeyControl ?? true,
              isMigrated: true,
              supportingApp: row.supportingApp,
              executorRole: row.executorRole,
              cosoPrinciples: row.cosoPrinciples || [],
              ipos: row.level === 'TLC' ? [
                { type: 'C', value: !!row.ipoC },
                { type: 'A', value: !!row.ipoA },
                { type: 'V', value: !!row.ipoV },
                { type: 'RA', value: !!row.ipoRa }
              ] : [],
              assertions: row.level === 'TLC' ? [
                { type: 'C', value: !!row.assertionC },
                { type: 'A', value: !!row.assertionA },
                { type: 'E', value: !!row.assertionE },
                { type: 'CO', value: !!row.assertionCo },
                { type: 'RO', value: !!row.assertionRo },
                { type: 'VA', value: !!row.assertionVa },
                { type: 'PD', value: !!row.assertionPd }
              ] : [],
              aiGuessedFields: row.guessedFields || []
            });

            await db.insert(schema.rcmControls).values({
              id: generateId(),
              organizationId: orgId,
              rcmId: riskId,
              controlId: controlId,
              year: parseInt(year),
              controlName: row.controlName,
              controlDescription: row.controlDescription,
              isKeyControl: row.isKeyControl ?? true,
              ipoC: row.ipoC ? 'Y' : 'N',
              ipoA: row.ipoA ? 'Y' : 'N',
              ipoV: row.ipoV ? 'Y' : 'N',
              ipoRa: row.ipoRa ? 'Y' : 'N',
              assertionE: row.assertionE ? 'Y' : 'N',
              assertionC: row.assertionC ? 'Y' : 'N',
              assertionA: row.assertionA ? 'Y' : 'N',
              assertionCo: row.assertionCo ? 'Y' : 'N',
              assertionVa: row.assertionVa ? 'Y' : 'N',
              assertionRo: row.assertionRo ? 'Y' : 'N',
              assertionPd: row.assertionPd ? 'Y' : 'N',
              controlType: row.controlType || row.type,
              controlNature: row.controlNature || row.nature,
              frequency: row.frequency,
              supportingApp: row.supportingApp,
              executorRole: row.executorRole,
              affectedFsliItem: row.affectedFsliItem,
              effectivePeriod: row.effectivePeriod,
              cosoPrinciples: row.cosoPrinciples || []
            });
          }
        }
      }
    }

    return ok(c, { success: true });
  } catch (err: any) {
    console.error('[MIGRATION ERROR]', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

migration.post('/migration/rollover', async (c) => {
  const { sourceYear, targetYear, force } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  const sYear = parseInt(sourceYear);
  const tYear = parseInt(targetYear);

  if (isNaN(sYear) || isNaN(tYear) || sYear === tYear) {
    return c.json({ success: false, error: 'Invalid source or target year' }, 400);
  }

  try {
    // 1. Check if target year already has data to prevent duplicate rollover
    if (!force) {
      const existingBpm = await db.select().from(schema.bpmProcesses)
        .where(and(eq(schema.bpmProcesses.organizationId, orgId), eq(schema.bpmProcesses.year, tYear)))
        .limit(1);
      const existingRcm = await db.select().from(schema.rcms)
        .where(and(eq(schema.rcms.organizationId, orgId), eq(schema.rcms.year, tYear)))
        .limit(1);

      if (existingBpm.length > 0 || existingRcm.length > 0) {
        return c.json({ 
          success: false, 
          error: 'Data already exists in target year. Use force rollover to override.' 
        }, 409);
      }
    }

    // Run everything inside a transaction
    await db.transaction(async (tx) => {
      // Keep mapping tables
      const processIdMap = new Map<string, string>();
      const riskIdMap = new Map<string, string>();
      const controlIdMap = new Map<string, string>();
      const deficiencyIdMap = new Map<string, string>();

      // 2. Clone Account Assertions
      const sourceAssertions = await tx.select().from(schema.accountAssertions)
        .where(and(eq(schema.accountAssertions.organizationId, orgId), eq(schema.accountAssertions.year, sYear)));
      
      for (const ass of sourceAssertions) {
        const newId = `ass_${generateId()}`;
        await tx.insert(schema.accountAssertions).values({
          id: newId,
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
          updatedBy: userId
        });
      }

      // 3. Clone BPM Processes
      const sourceProcesses = await tx.select().from(schema.bpmProcesses)
        .where(and(eq(schema.bpmProcesses.organizationId, orgId), eq(schema.bpmProcesses.year, sYear)));

      for (const proc of sourceProcesses) {
        const newId = `proc_${generateId()}`;
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
          createdBy: userId
        });
      }

      // 4. Clone BPM Diagrams
      const sourceDiagrams = await tx.select().from(schema.bpmDiagrams)
        .where(and(eq(schema.bpmDiagrams.organizationId, orgId), eq(schema.bpmDiagrams.year, sYear)));

      for (const diag of sourceDiagrams) {
        const newId = `diag_${generateId()}`;
        await tx.insert(schema.bpmDiagrams).values({
          id: newId,
          organizationId: orgId,
          name: diag.name,
          subProcess: diag.subProcess,
          year: tYear,
          nodes: diag.nodes,
          edges: diag.edges,
          metadata: diag.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId
        });
      }

      // 5. Clone RCMs
      const sourceRcms = await tx.select().from(schema.rcms)
        .where(and(eq(schema.rcms.organizationId, orgId), eq(schema.rcms.year, sYear)));

      for (const r of sourceRcms) {
        const newId = `risk_${generateId()}`;
        riskIdMap.set(r.id, newId);
        await tx.insert(schema.rcms).values({
          id: newId,
          organizationId: orgId,
          year: tYear,
          riskLibraryId: r.riskLibraryId,
          process: r.process,
          subProcess: r.subProcess,
          riskDescription: r.riskDescription,
          isFraudRelated: r.isFraudRelated,
          riskRating: r.riskRating,
          status: 'Active',
          diagramId: r.diagramId
        });
      }

      // 6. Clone Controls
      const sourceControls = await tx.select().from(schema.controls)
        .where(and(eq(schema.controls.organizationId, orgId), eq(schema.controls.year, sYear)));

      for (const c of sourceControls) {
        const newId = `ctrl_${generateId()}`;
        controlIdMap.set(c.id, newId);
        const mappedProcId = c.bpmProcessId ? processIdMap.get(c.bpmProcessId) || null : null;

        await tx.insert(schema.controls).values({
          id: newId,
          organizationId: orgId,
          bpmProcessId: mappedProcId,
          year: tYear,
          code: c.code,
          name: c.name,
          description: c.description,
          ownerId: c.ownerId,
          level: c.level,
          type: c.type,
          nature: c.nature,
          frequency: c.frequency,
          riskRating: c.riskRating,
          riskAssessment: c.riskAssessment,
          bpmStatus: c.bpmStatus,
          fsliCodes: c.fsliCodes,
          relatedControlIds: c.relatedControlIds,
          attachmentUrl: c.attachmentUrl,
          businessProcess: c.businessProcess,
          subProcess: c.subProcess,
          location: c.location,
          isFraudRelated: c.isFraudRelated,
          isKeyControl: c.isKeyControl,
          ipos: c.ipos,
          assertions: c.assertions,
          cosoPrinciples: c.cosoPrinciples,
          supportingDocs: c.supportingDocs,
          reference: c.reference,
          applicationId: c.applicationId,
          attributeQuestions: c.attributeQuestions,
          executorRole: c.executorRole,
          effectiveDate: c.effectiveDate,
          csaStatus: 'Not Assessed',
          lastCsaDate: null,
          itgcDomain: c.itgcDomain,
          itgcAssertions: c.itgcAssertions,
          automatedSubNature: c.automatedSubNature,
          supportingApp: c.supportingApp,
          itApplication: c.itApplication,
          eucComplexity: c.eucComplexity,
          ipeType: c.ipeType,
          isMigrated: c.isMigrated,
          aiGuessedFields: c.aiGuessedFields
        });
      }

      // 7. Clone RCM Controls Mappings
      const sourceRcmControls = await tx.select().from(schema.rcmControls)
        .where(and(eq(schema.rcmControls.organizationId, orgId), eq(schema.rcmControls.year, sYear)));

      for (const rc of sourceRcmControls) {
        const newRcmId = riskIdMap.get(rc.rcmId);
        const newControlId = controlIdMap.get(rc.controlId);

        if (newRcmId && newControlId) {
          await tx.insert(schema.rcmControls).values({
            id: `map_${generateId()}`,
            organizationId: orgId,
            rcmId: newRcmId,
            controlId: newControlId,
            year: tYear,
            controlName: rc.controlName,
            controlDescription: rc.controlDescription,
            supportingDocs: rc.supportingDocs,
            isKeyControl: rc.isKeyControl,
            ipoC: rc.ipoC,
            ipoA: rc.ipoA,
            ipoV: rc.ipoV,
            ipoRa: rc.ipoRa,
            assertionE: rc.assertionE,
            assertionC: rc.assertionC,
            assertionA: rc.assertionA,
            assertionCo: rc.assertionCo,
            assertionVa: rc.assertionVa,
            assertionRo: rc.assertionRo,
            assertionPd: rc.assertionPd,
            controlType: rc.controlType,
            controlNature: rc.controlNature,
            frequency: rc.frequency,
            supportingApp: rc.supportingApp,
            applicationId: rc.applicationId,
            executingFunction: rc.executingFunction,
            executorRole: rc.executorRole,
            affectedFsliItem: rc.affectedFsliItem,
            effectivePeriod: rc.effectivePeriod,
            cosoPrinciples: rc.cosoPrinciples,
            itgcDomain: rc.itgcDomain,
            itgcAssertions: rc.itgcAssertions,
            automatedControlType: rc.automatedControlType
          });
        }
      }

      // 8. Carry Forward Open Deficiencies and their Action Plans
      const openDeficiencies = await tx.select().from(schema.deficiencies)
        .where(and(eq(schema.deficiencies.organizationId, orgId), eq(schema.deficiencies.status, 'Open')));

      for (const def of openDeficiencies) {
        const newId = `def_${generateId()}`;
        deficiencyIdMap.set(def.id, newId);
        const mappedControlId = def.controlId ? controlIdMap.get(def.controlId) || null : null;

        await tx.insert(schema.deficiencies).values({
          id: newId,
          organizationId: orgId,
          controlId: mappedControlId,
          description: def.description,
          severity: def.severity,
          identifiedDate: def.identifiedDate,
          identifiedBy: def.identifiedBy,
          status: 'Open',
          rootCause: def.rootCause,
          magnitude: def.magnitude,
          exposureValue: def.exposureValue,
          likelihood: def.likelihood,
          assertions: def.assertions,
          flowchartPath: def.flowchartPath,
          correctiveActionTaken: def.correctiveActionTaken,
          remediationEvidence: def.remediationEvidence,
          compensatingControlIds: def.compensatingControlIds,
          source: def.source
        });

        // Clone linked Action Plans
        const plans = await tx.select().from(schema.actionPlans)
          .where(and(eq(schema.actionPlans.organizationId, orgId), eq(schema.actionPlans.deficiencyId, def.id)));

        for (const plan of plans) {
          await tx.insert(schema.actionPlans).values({
            id: `plan_${generateId()}`,
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
            rescheduleReason: plan.rescheduleReason
          });
        }
      }
    });

    return ok(c, { success: true });
  } catch (err: any) {
    console.error('[ROLLOVER ERROR]', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default migration;
