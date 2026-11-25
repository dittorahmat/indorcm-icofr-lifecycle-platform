import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad } from '../../lib/utils';
import { getDb } from '../../db';
import { rbac } from "../../lib/guard";
import * as schema from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";

const generateId = () => crypto.randomUUID();

export const rcmImportRoute = new Hono<HonoEnv>();

interface ImportRowPayload {
  processName: string;
  subProcessName: string;
  bpmNodeRef?: string;
  riskDescription: string;
  isFraudRelated?: boolean;
  riskRating?: string;
  controlCode?: string;
  controlName: string;
  controlDescription?: string;
  supportingDocs?: string;
  isKeyControl?: boolean;
  ipoC?: string;
  ipoA?: string;
  ipoV?: string;
  ipoRa?: string;
  assertionC?: string;
  assertionA?: string;
  assertionE?: string;
  assertionCo?: string;
  assertionVa?: string;
  assertionRo?: string;
  assertionPd?: string;
  controlType?: string;
  controlNature?: string;
  frequency?: string;
  supportingApp?: string;
  executorRole?: string;
  affectedFsliItem?: string;
  effectivePeriod?: string;
  cosoPrinciples?: number[];
  itgcDomain?: string;
  targetBpmNodeId?: string;
}

interface ImportRequestBody {
  rcmType: 'TLC' | 'ELC' | 'ITGC';
  year: number | string;
  bpmProcessId?: string;
  diagramId?: string;
  rows: ImportRowPayload[];
}

rcmImportRoute.post('/rcm/import', rbac(['Line 1', 'Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  const body = await c.req.json<ImportRequestBody>();
  const { rcmType, year, bpmProcessId, diagramId, rows } = body;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return bad(c, 'No rows provided for import');
  }

  const numericYear = typeof year === 'string' ? parseInt(year, 10) : year;
  if (!numericYear || isNaN(numericYear)) {
    return bad(c, 'Valid year is required');
  }

  try {
    let createdProcesses = 0;
    let createdRisks = 0;
    let createdControls = 0;
    let createdNodeLinks = 0;

    await db.transaction(async (tx) => {
      const affectedProcessIds = new Set<string>();
      if (bpmProcessId) {
        affectedProcessIds.add(bpmProcessId);
      }

      // Group rows by process + subProcess
      const processMap = new Map<string, ImportRowPayload[]>();
      for (const row of rows) {
        const procKey = `${row.processName || 'General'}|||${row.subProcessName || row.processName || 'General'}`;
        const existing = processMap.get(procKey) || [];
        existing.push(row);
        processMap.set(procKey, existing);
      }

      for (const [procKey, procRows] of processMap.entries()) {
        const [procName, subProcName] = procKey.split('|||');

        let activeProcessId = bpmProcessId;

        // If not provided in body, check or create bpmProcess
        if (!activeProcessId) {
          const existingProc = await tx
            .select({ id: schema.bpmProcesses.id })
            .from(schema.bpmProcesses)
            .where(
              and(
                eq(schema.bpmProcesses.organizationId, orgId),
                eq(schema.bpmProcesses.name, subProcName),
                eq(schema.bpmProcesses.year, numericYear)
              )
            )
            .limit(1);

          if (existingProc.length > 0) {
            activeProcessId = existingProc[0].id;
          } else {
            activeProcessId = `proc_${generateId()}`;
            await tx.insert(schema.bpmProcesses).values({
              id: activeProcessId,
              organizationId: orgId,
              noGL: procRows[0].affectedFsliItem || '',
              fsliName: procRows[0].affectedFsliItem || null,
              name: subProcName,
              year: numericYear,
              workflowStatus: 'Draft',
              createdBy: userId,
              createdAt: new Date(),
            });
            createdProcesses++;
          }
        }

        if (activeProcessId) {
          affectedProcessIds.add(activeProcessId);
        }

        // Group rows by risk description
        const riskMap = new Map<string, ImportRowPayload[]>();
        for (const r of procRows) {
          const rDesc = r.riskDescription?.trim() || `Identified Risk for ${subProcName}`;
          const existing = riskMap.get(rDesc) || [];
          existing.push(r);
          riskMap.set(rDesc, existing);
        }

        for (const [riskDesc, riskRows] of riskMap.entries()) {
          const riskId = `risk_${generateId()}`;
          await tx.insert(schema.rcms).values({
            id: riskId,
            organizationId: orgId,
            process: procName,
            subProcess: subProcName,
            year: numericYear,
            riskDescription: riskDesc,
            isFraudRelated: riskRows[0].isFraudRelated ?? false,
            riskRating: riskRows[0].riskRating || 'Medium',
            status: 'Active',
            diagramId: diagramId || null,
            workflowStatus: 'Draft',
          });
          createdRisks++;

          for (const row of riskRows) {
            const controlId = `ctrl_${generateId()}`;
            const generatedCode = row.controlCode?.trim() || `CTRL-${generateId().substring(0, 8).toUpperCase()}`;

            await tx.insert(schema.controls).values({
              id: controlId,
              organizationId: orgId,
              bpmProcessId: rcmType === 'ELC' ? null : activeProcessId,
              year: numericYear,
              code: generatedCode,
              name: row.controlName || 'Control Activity',
              description: row.controlDescription || '',
              nature: row.controlNature || 'Manual',
              type: row.controlType || 'Preventif',
              frequency: row.frequency || 'Bulanan',
              level: rcmType,
              isKeyControl: row.isKeyControl ?? false,
              isFraudRelated: row.isFraudRelated ?? false,
              supportingDocs: row.supportingDocs || null,
              supportingApp: row.supportingApp || null,
              executorRole: row.executorRole || null,
              cosoPrinciples: row.cosoPrinciples || [],
              itgcDomain: row.itgcDomain || null,
              ipos: rcmType === 'TLC' ? [
                { type: 'C', value: row.ipoC === 'Y' || row.ipoC === '1' || row.ipoC === 'true' },
                { type: 'A', value: row.ipoA === 'Y' || row.ipoA === '1' || row.ipoA === 'true' },
                { type: 'V', value: row.ipoV === 'Y' || row.ipoV === '1' || row.ipoV === 'true' },
                { type: 'RA', value: row.ipoRa === 'Y' || row.ipoRa === '1' || row.ipoRa === 'true' }
              ] : [],
              assertions: rcmType === 'TLC' ? [
                { type: 'C', value: row.assertionC === 'Y' || row.assertionC === '1' || row.assertionC === 'true' },
                { type: 'A', value: row.assertionA === 'Y' || row.assertionA === '1' || row.assertionA === 'true' },
                { type: 'E', value: row.assertionE === 'Y' || row.assertionE === '1' || row.assertionE === 'true' },
                { type: 'CO', value: row.assertionCo === 'Y' || row.assertionCo === '1' || row.assertionCo === 'true' },
                { type: 'RO', value: row.assertionRo === 'Y' || row.assertionRo === '1' || row.assertionRo === 'true' },
                { type: 'VA', value: row.assertionVa === 'Y' || row.assertionVa === '1' || row.assertionVa === 'true' },
                { type: 'PD', value: row.assertionPd === 'Y' || row.assertionPd === '1' || row.assertionPd === 'true' }
              ] : [],
            });
            createdControls++;

            await tx.insert(schema.rcmControls).values({
              id: generateId(),
              organizationId: orgId,
              rcmId: riskId,
              controlId: controlId,
              year: numericYear,
              controlName: row.controlName,
              controlDescription: row.controlDescription,
              supportingDocs: row.supportingDocs,
              isKeyControl: row.isKeyControl ?? false,
              ipoC: row.ipoC || 'N',
              ipoA: row.ipoA || 'N',
              ipoV: row.ipoV || 'N',
              ipoRa: row.ipoRa || 'N',
              assertionE: row.assertionE || 'N',
              assertionC: row.assertionC || 'N',
              assertionA: row.assertionA || 'N',
              assertionCo: row.assertionCo || 'N',
              assertionVa: row.assertionVa || 'N',
              assertionRo: row.assertionRo || 'N',
              assertionPd: row.assertionPd || 'N',
              controlType: row.controlType,
              controlNature: row.controlNature,
              frequency: row.frequency,
              supportingApp: row.supportingApp,
              executorRole: row.executorRole,
              affectedFsliItem: row.affectedFsliItem,
              effectivePeriod: row.effectivePeriod,
              cosoPrinciples: row.cosoPrinciples || [],
              itgcDomain: row.itgcDomain || null,
            });

            // If a target diagram and node ID are provided, link to BPM
            if (diagramId && row.targetBpmNodeId) {
              await tx.insert(schema.bpmNodeRcms).values({
                id: generateId(),
                organizationId: orgId,
                diagramId: diagramId,
                nodeId: row.targetBpmNodeId,
                rcmId: riskId,
              });
              createdNodeLinks++;
            }
          }
        }
      }

      // Recalculate summary counts for all affected processes in this import batch
      for (const procId of affectedProcessIds) {
        const [procRecord] = await tx
          .select({ name: schema.bpmProcesses.name })
          .from(schema.bpmProcesses)
          .where(
            and(
              eq(schema.bpmProcesses.organizationId, orgId),
              eq(schema.bpmProcesses.id, procId)
            )
          )
          .limit(1);

        const procName = procRecord?.name || '';

        const [ctrlResult] = await tx
          .select({ count: sql<number>`count(distinct ${schema.controls.id})` })
          .from(schema.controls)
          .where(
            and(
              eq(schema.controls.organizationId, orgId),
              eq(schema.controls.bpmProcessId, procId)
            )
          );

        const [riskResult] = await tx
          .select({ count: sql<number>`count(distinct ${schema.rcms.id})` })
          .from(schema.rcms)
          .where(
            and(
              eq(schema.rcms.organizationId, orgId),
              sql`(${schema.rcms.process} = ${procName} OR ${schema.rcms.subProcess} = ${procName})`
            )
          );

        const liveControls = Number(ctrlResult?.count || 0);
        const liveRisks = Number(riskResult?.count || 0);

        await tx
          .update(schema.bpmProcesses)
          .set({
            controlCount: liveControls,
            riskCount: liveRisks,
          })
          .where(
            and(
              eq(schema.bpmProcesses.organizationId, orgId),
              eq(schema.bpmProcesses.id, procId)
            )
          );
      }
    });

    return ok(c, {
      success: true,
      summary: {
        createdProcesses,
        createdRisks,
        createdControls,
        createdNodeLinks,
        totalRows: rows.length,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[RCM IMPORT ERROR]', err);
    return bad(c, `Failed to import RCM: ${errorMsg}`, 500);
  }
});
