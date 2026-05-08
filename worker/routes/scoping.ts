import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  simulations, glSnapshots, glRows, organization, auditLogs,
  bpmDiagrams, rcms, controls, rcmControls, bpmNodeRcms,
  simulationAccountApplications, applications
} from '../db/schema';
import { eq, and, sql, SQL } from 'drizzle-orm';
import type { 
  MaterialitySimulation, SimulationStatus, Settings 
} from "@shared/types";

const scoping = new Hono<HonoEnv>();

// --- Simulations Refactored ---

scoping.get('/simulations', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');
  
  let conditions: SQL = eq(simulations.organizationId, orgId);
  if (year) {
    conditions = and(conditions, eq(simulations.year, parseInt(year))) as SQL;
  }

  const items = await db.select().from(simulations).where(conditions);
  return ok(c, { items });
});

scoping.get('/simulations/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const item = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (item.length === 0) return notFound(c);
  return ok(c, item[0]);
});

scoping.post('/simulations', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<MaterialitySimulation>>();
  
  const targetYear = body.year || new Date().getFullYear();
  const prevYear = targetYear - 1;

  // --- Carry Forward Logic ---
  const existingBpm = await db.select({ id: bpmDiagrams.id })
    .from(bpmDiagrams)
    .where(and(eq(bpmDiagrams.organizationId, orgId), eq(bpmDiagrams.year, targetYear)))
    .limit(1);

  if (existingBpm.length === 0) {
    const sourceBpms = await db.select().from(bpmDiagrams)
      .where(and(eq(bpmDiagrams.organizationId, orgId), eq(bpmDiagrams.year, prevYear)));

    if (sourceBpms.length > 0) {
      console.log(`[CARRY_FORWARD] Cloning data from ${prevYear} to ${targetYear} for Org: ${orgId}`);
      
      try {
        const diagramMap = new Map<string, string>();
        const rcmMap = new Map<string, string>();
        const controlMap = new Map<string, string>();

        for (const source of sourceBpms) {
          const newId = crypto.randomUUID();
          diagramMap.set(source.id, newId);
          await db.insert(bpmDiagrams).values({
            ...source,
            id: newId,
            year: targetYear,
            createdAt: new Date(),
            createdBy: userId,
            updatedAt: new Date()
          });
        }

        const sourceRcms = await db.select().from(rcms)
          .where(and(eq(rcms.organizationId, orgId), eq(rcms.year, prevYear)));
        
        for (const source of sourceRcms) {
          const newId = crypto.randomUUID();
          rcmMap.set(source.id, newId);
          await db.insert(rcms).values({
            ...source,
            id: newId,
            year: targetYear,
            status: "Draft",
            diagramId: source.diagramId ? diagramMap.get(source.diagramId) : null,
            auditTrail: []
          });
        }

        const sourceControls = await db.select().from(controls)
          .where(and(eq(controls.organizationId, orgId), eq(controls.year, prevYear)));
        
        for (const source of sourceControls) {
          const newId = crypto.randomUUID();
          controlMap.set(source.id, newId);
          await db.insert(controls).values({
            ...source,
            id: newId,
            year: targetYear,
            rcmId: source.rcmId ? rcmMap.get(source.rcmId) : null,
            bpmStatus: "Draft"
          });
        }

        const sourceMappings = await db.select().from(rcmControls)
          .where(eq(rcmControls.organizationId, orgId));
        
        for (const source of sourceMappings) {
          const newRcmId = rcmMap.get(source.rcmId);
          const newControlId = controlMap.get(source.controlId);
          
          if (newRcmId && newControlId) {
            await db.insert(rcmControls).values({
              ...source,
              id: crypto.randomUUID(),
              rcmId: newRcmId,
              controlId: newControlId,
              year: targetYear
            });
          }
        }

        const sourceNodeRcms = await db.select().from(bpmNodeRcms)
          .where(eq(bpmNodeRcms.organizationId, orgId));
        
        for (const source of sourceNodeRcms) {
          const newDiagramId = diagramMap.get(source.diagramId);
          const newRcmId = rcmMap.get(source.rcmId);
          
          if (newDiagramId && newRcmId) {
            await db.insert(bpmNodeRcms).values({
              ...source,
              id: crypto.randomUUID(),
              diagramId: newDiagramId,
              rcmId: newRcmId
            });
          }
        }
      } catch (e: any) {
        console.error('[CARRY_FORWARD] Failed during sequential operations:', e);
      }
    }
  }

  const id = crypto.randomUUID();
  const newSim = {
    id, organizationId: orgId,
    name: body.name || "New Simulation",
    year: targetYear,
    status: "Draft" as any,
    omValue: body.omValue || 0,
    pmValue: body.pmValue || 0,
    glSnapshotId: body.glSnapshotId,
    locationCount: body.locationCount || 1,
    omPercentage: body.omPercentage ?? 5,
    haircutPercentage: body.haircutPercentage ?? 25,
    basis: body.basis || "Revenue",
    createdAt: new Date(),
    createdBy: userId,
  };
  await db.insert(simulations).values(newSim);
  return ok(c, newSim);
});

scoping.put('/simulations/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<Partial<MaterialitySimulation>>();
  
  await db.update(simulations)
    .set({
      name: body.name,
      basis: body.basis,
      omPercentage: body.omPercentage,
      haircutPercentage: body.haircutPercentage,
      locationCount: body.locationCount,
      omValue: body.omValue,
      pmValue: body.pmValue,
      significantAccounts: body.significantAccounts,
      assessmentData: body.assessmentData,
      updatedAt: new Date(),
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
  
  return ok(c, { success: true });
});

scoping.post('/simulations/:id/submit', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = await c.req.json<Partial<MaterialitySimulation>>();
  
  const [existing] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!existing) return notFound(c, 'Simulation not found');

  const history = (existing.history as any[]) || [];
  const newHistoryEntry = {
    id: crypto.randomUUID(),
    action: "Submit",
    role: userRole,
    userId: userId,
    timestamp: Date.now(),
    note: body.history?.[0]?.note || "Submitted for approval"
  };

  await db.update(simulations)
    .set({ 
      status: 'Pending CFO', 
      updatedAt: new Date(),
      omValue: body.omValue,
      pmValue: body.pmValue,
      significantAccounts: body.significantAccounts,
      history: [...history, newHistoryEntry]
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
      
  const updated = await db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
  return ok(c, updated[0]);
});

scoping.post('/simulations/:id/approve', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = await c.req.json<{ note: string }>();

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  let nextStatus: SimulationStatus = sim.status as SimulationStatus;
  if (userRole === 'CFO' && sim.status === 'Pending CFO') {
    nextStatus = 'Pending Komut';
  } else if (userRole === 'Commissioner' && sim.status === 'Pending Komut') {
    nextStatus = 'Approved';
  } else if (userRole === 'Admin') {
    nextStatus = sim.status === 'Pending CFO' ? 'Pending Komut' : 'Approved';
  }

  const history = (sim.history as any[]) || [];
  const newHistoryEntry = {
    id: crypto.randomUUID(),
    action: "Approve",
    role: userRole,
    userId: userId,
    timestamp: Date.now(),
    note: body.note || "Approved"
  };

  await db.update(simulations)
    .set({
      status: nextStatus,
      history: [...history, newHistoryEntry],
      updatedAt: new Date(),
      ...(nextStatus === 'Approved' ? { approvedBy: userId, approvedDate: new Date().getTime() } : {})
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  return ok(c, { success: true });
});

scoping.post('/simulations/:id/reject', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = await c.req.json<{ note: string }>();

  if (!body.note) return bad(c, 'Note is required for rejection');

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  const history = (sim.history as any[]) || [];
  const newHistoryEntry = {
    id: crypto.randomUUID(),
    action: "Reject",
    role: userRole,
    userId: userId,
    timestamp: Date.now(),
    note: body.note
  };

  await db.update(simulations)
    .set({
      status: 'Rejected',
      history: [...history, newHistoryEntry],
      updatedAt: new Date()
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  return ok(c, { success: true });
});

scoping.post('/simulations/assign-department', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<{ scopingId: string, accountName: string, departmentId: string }>();

  const [sim] = await db.select()
    .from(simulations)
    .where(and(
      eq(simulations.id, body.scopingId),
      eq(simulations.organizationId, orgId)
    ))
    .limit(1);

  if (!sim) return notFound(c, 'Simulation not found');
  if (!sim.glSnapshotId) return bad(c, 'Simulation has no associated snapshot');

  await db.update(glRows)
    .set({ assignedDepartmentId: body.departmentId })
    .where(and(
      eq(glRows.snapshotId, sim.glSnapshotId),
      eq(glRows.noGL, body.accountName),
      eq(glRows.organizationId, orgId)
    ));

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: c.get('userId'),
    action: 'ASSIGN_DEPARTMENT',
    entityType: 'GL_Account',
    entityId: `${sim.glSnapshotId}:${body.accountName}`,
    descriptionAfter: `Assigned department ${body.departmentId} to account ${body.accountName}`,
    dataAfter: body
  });

  return ok(c, { success: true });
});

scoping.delete('/simulations/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  
  await db.delete(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
  return ok(c, { success: true });
});

scoping.post('/simulations/:id/account-departments/sync', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const simId = c.req.param('id');
  const orgId = c.get('organizationId');
  const { mappings } = await c.req.json<{ mappings: { noGL: string, departmentIds: string[] }[] }>();

  const sim = await db.query.simulations.findFirst({
    where: and(eq(simulations.id, simId), eq(simulations.organizationId, orgId))
  });

  if (!sim) return bad(c, "Simulation not found", 404);

  try {
    for (const m of mappings) {
      await db.update(glRows)
        .set({ assignedDepartmentIds: m.departmentIds })
        .where(and(
          eq(glRows.snapshotId, sim.glSnapshotId),
          eq(glRows.noGL, m.noGL),
          eq(glRows.organizationId, orgId)
        ));
    }
    return ok(c, { success: true });
  } catch (e: any) {
    return bad(c, `Sync failed: ${e.message}`);
  }
});

scoping.get('/simulations/:id/account-applications', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const simId = c.req.param('id');
  const orgId = c.get('organizationId');

  const items = await db.select().from(simulationAccountApplications).where(and(
    eq(simulationAccountApplications.simulationId, simId),
    eq(simulationAccountApplications.organizationId, orgId)
  ));

  return ok(c, { items });
});

scoping.post('/simulations/:id/account-applications/sync', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const simId = c.req.param('id');
  const orgId = c.get('organizationId');
  const { mappings } = await c.req.json<{ mappings: { accountCode: string, applicationIds: string[] }[] }>();

  try {
    for (const m of mappings) {
      await db.delete(simulationAccountApplications).where(and(
        eq(simulationAccountApplications.simulationId, simId),
        eq(simulationAccountApplications.accountCode, m.accountCode),
        eq(simulationAccountApplications.organizationId, orgId)
      ));

      if (m.applicationIds.length > 0) {
        for (const appId of m.applicationIds) {
          await db.insert(simulationAccountApplications).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            simulationId: simId,
            accountCode: m.accountCode,
            applicationId: appId
          });

          await db.update(applications)
            .set({ isSignificant: true })
            .where(and(eq(applications.id, appId), eq(applications.organizationId, orgId)));
        }
      }
    }
    return ok(c, { success: true });
  } catch (e: any) {
    return bad(c, `Sync failed: ${e.message}`);
  }
});

// --- GL Snapshots Refactored ---

scoping.get('/gl-snapshots', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');
  
  let conditions: SQL = eq(glSnapshots.organizationId, orgId);
  if (year) {
    conditions = and(conditions, eq(glSnapshots.year, parseInt(year))) as SQL;
  }
  
  const items = await db.select().from(glSnapshots).where(conditions);
  return ok(c, { items });
});

scoping.get('/gl-snapshots/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const item = await db.select().from(glSnapshots).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId))).limit(1);
  if (item.length === 0) return notFound(c);
  
  const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, id));
  
  return ok(c, {
    ...item[0],
    rows
  });
});

scoping.post('/gl-snapshots/:id/mapping', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<{ benchmarkFsliNames: string[] }>();
  
  await db.update(glSnapshots)
    .set({ benchmarkFsliNames: body.benchmarkFsliNames, status: 'Mapped' })
    .where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));
  
  return ok(c, { success: true });
});

scoping.post('/gl-snapshots/:id/set-active', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  
  // Reset all to false first
  await db.update(glSnapshots).set({ isActive: false }).where(eq(glSnapshots.organizationId, orgId));
  // Set current to true
  await db.update(glSnapshots).set({ isActive: true }).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));
  
  return ok(c, { success: true });
});

scoping.get('/gl-snapshots/:id/rows', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const items = await db.select().from(glRows).where(and(eq(glRows.snapshotId, id), eq(glRows.organizationId, orgId)));
  return ok(c, { items });
});

scoping.delete('/gl-snapshots/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  
  await db.delete(glSnapshots).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));
  // Cascade will handle glRows
  return ok(c, { success: true });
});

// --- GL Rows Routes ---

scoping.put('/gl-rows/:noGL/owner-acceptance', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const noGL = c.req.param('noGL');
  const { ownerAcceptance } = await c.req.json<{ ownerAcceptance: 'Accepted' | 'Rejected' }>();

  await db.update(glRows)
    .set({ ownerAcceptance })
    .where(and(eq(glRows.noGL, noGL), eq(glRows.organizationId, orgId)));

  return ok(c, { success: true });
});

export default scoping;
