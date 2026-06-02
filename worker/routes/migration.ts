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
  const { sessionId, year, tbData, rcmData } = await c.req.json();
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
        filename: `Migration_${year}_TB`,
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

      // Create Approved Materiality Simulation
      await db.insert(schema.simulations).values({
        id: `sim_${generateId()}`,
        organizationId: orgId,
        glSnapshotId: snapshotId,
        name: `Baseline ${year}`,
        year: parseInt(year),
        status: 'Approved',
        workflowStatus: 'Approved',
        createdBy: userId,
        createdAt: new Date(),
        significantAccounts: []
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
              bpmProcessId: processId,
              year: parseInt(year),
              code: `CTRL-${generateId().substring(0, 8).toUpperCase()}`,
              name: row.controlName || "Migrated Control",
              description: row.controlDescription,
              nature: row.nature,
              type: row.type,
              frequency: row.frequency,
              isKey: true,
              isMigrated: true,
              aiGuessedFields: row.guessedFields || []
            });

            await db.insert(schema.rcmControls).values({
              id: generateId(),
              organizationId: orgId,
              rcmId: riskId,
              controlId: controlId
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

export default migration;
