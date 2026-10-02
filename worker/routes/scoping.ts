import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb, type DrizzleDb } from '../db';
import { 
  simulations, glSnapshots, glRows, organization, auditLogs,
  bpmDiagrams, rcms, controls, rcmControls, bpmNodeRcms,
  simulationAccountApplications, applications, notifications,
  user
} from '../db/schema';
import { eq, and, sql, SQL } from 'drizzle-orm';
import type { 
  MaterialitySimulation, SimulationStatus, Settings 
} from "@shared/types";
import { ScopingService } from '../services/scoping-service';
import { AuditService } from "../services/audit-service";
import { getQualitativeDefaults } from '../services/scoping-defaults';
import { createNotificationAndSendEmail } from '../services/email';


import { rbac } from "../lib/guard";

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
  const id = c.req.param('id') as string;
  const orgId = c.get('organizationId');
  const item = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (item.length === 0) return notFound(c);
  return ok(c, item[0]);
});

scoping.post('/simulations', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<MaterialitySimulation>>();
  
  const targetYear = body.year || new Date().getFullYear();
  
  // Use ScopingService for Carry Forward logic (Encapsulated & Transactional)
  const scopingService = new ScopingService(db);
  const cloned = await scopingService.carryForward(orgId, userId, targetYear);

  if (cloned) {
    await createNotificationAndSendEmail({
      db,
      orgId,
      userId: userId,
      message: `Successfully carried forward RCM and BPM data from ${targetYear - 1} to ${targetYear}.`,
      type: 'success',
      env: c.env,
    });
  }

  const id = crypto.randomUUID();
  const glSnapshotId = body.glSnapshotId || '';
  let assessmentData: Record<string, any> = {};

  // Auto-populate qualitative factors from library
  if (glSnapshotId) {
    const rows = await db.select({ fsliName: glRows.fsliName })
      .from(glRows)
      .where(eq(glRows.snapshotId, glSnapshotId));
    
    const uniqueFslis = Array.from(new Set(rows.map((r: any) => r.fsliName).filter(Boolean) as string[]));
    
    uniqueFslis.forEach(fsli => {
      assessmentData[fsli] = getQualitativeDefaults(fsli);
    });
  }

  const newSim = {
    id, organizationId: orgId,
    name: body.name || "New Simulation",
    year: targetYear,
    status: "Draft" as any,
    omValue: body.omValue || 0,
    pmValue: body.pmValue || 0,
    glSnapshotId,
    locationCount: body.locationCount || 1,
    omPercentage: body.omPercentage ?? 5,
    haircutPercentage: body.haircutPercentage ?? 25,
    basis: (body.basis as any) || "Revenue",
    assessmentData,
    createdAt: new Date() as any,
    createdBy: userId,
  };
  await db.insert(simulations).values(newSim as any);
  return ok(c, newSim);
});

scoping.put('/simulations/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id') as string;
  const orgId = c.get('organizationId');
  const body = await c.req.json<Partial<MaterialitySimulation>>();
  
  const [existingSim] = await db.select({ assessmentData: simulations.assessmentData, glSnapshotId: simulations.glSnapshotId })
    .from(simulations)
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)))
    .limit(1);

  let finalAssessment: Record<string, any> = body.assessmentData !== undefined 
    ? { ...(body.assessmentData || {}) }
    : { ...((existingSim?.assessmentData as Record<string, any>) || {}) };

  const snapshotId = body.glSnapshotId || existingSim?.glSnapshotId;
  if (snapshotId && Object.keys(finalAssessment).length === 0) {
    const rows = await db.select({ fsliName: glRows.fsliName })
      .from(glRows)
      .where(eq(glRows.snapshotId, snapshotId));
    const uniqueFslis = Array.from(new Set(rows.map((r: any) => r.fsliName).filter(Boolean) as string[]));
    uniqueFslis.forEach(fsli => {
      finalAssessment[fsli] = getQualitativeDefaults(fsli);
    });
  }

  await db.update(simulations)
    .set({
      name: body.name,
      basis: body.basis as any,
      omPercentage: body.omPercentage,
      haircutPercentage: body.haircutPercentage,
      locationCount: body.locationCount,
      omValue: body.omValue,
      pmValue: body.pmValue,
      significantAccounts: body.significantAccounts,
      assessmentData: finalAssessment,
      updatedAt: new Date() as any,
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
  
  return ok(c, { success: true });
});

scoping.post('/simulations/:id/submit', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const scopingService = new ScopingService(db);
  const id = c.req.param('id') as string;
  const body = await c.req.json<Partial<MaterialitySimulation>>();
  
  try {
    const updated = await scopingService.submitSimulation(
      c.get('organizationId'),
      c.get('userId'),
      c.get('userRole'),
      id,
      body
    );
    return ok(c, updated);
  } catch (e: any) {
    if (e.message === 'Simulation not found') return notFound(c, e.message);
    return bad(c, e.message);
  }
});

scoping.post('/simulations/:id/approve', rbac(['CFO', 'Commissioner', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id') as string;
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = await c.req.json<{ note: string }>();

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  // Handle Deletion Approval
  if (sim.status === 'Pending Deletion Approval') {
    await db.delete(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
    
    const auditService = new AuditService(db);
    await auditService.logAction({
      organizationId: orgId,
      userId: userId,
      action: 'APPROVE_DELETION',
      entityType: 'Simulation',
      entityId: id,
      description: `Approved deletion request for simulation "${sim.name}". Reason: ${body.note || 'Approved deletion'}`,
      dataBefore: sim
    });

    await createNotificationAndSendEmail({
      db,
      orgId,
      userId: sim.createdBy!,
      message: `Your deletion request for simulation "${sim.name}" has been approved and permanently removed.`,
      type: 'info',
      link: `/scoping`,
      env: c.env,
    });

    return ok(c, { success: true, deleted: true });
  }

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
      updatedAt: new Date() as any,
      ...(nextStatus === 'Approved' ? { approvedBy: userId, approvedDate: new Date().getTime() } : {})
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  // Notify creator
  await createNotificationAndSendEmail({
    db,
    orgId,
    userId: sim.createdBy!,
    message: `Your scoping simulation "${sim.name}" has been ${nextStatus === 'Approved' ? 'approved' : 'moved to next approval stage'}.`,
    type: 'success',
    link: `/scoping?id=${id}`,
    env: c.env,
  });

  return ok(c, { success: true });
});

scoping.post('/simulations/:id/reject', rbac(['CFO', 'Commissioner', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id') as string;
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = await c.req.json<{ note: string }>();

  if (!body.note) return bad(c, 'Note is required for rejection');

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  const history = (sim.history as any[]) || [];
  const isDeletionRejection = sim.status === 'Pending Deletion Approval';

  const newHistoryEntry = {
    id: crypto.randomUUID(),
    action: isDeletionRejection ? "Reject Deletion" : "Reject",
    role: userRole,
    userId: userId,
    timestamp: Date.now(),
    note: body.note
  };

  // If rejecting a deletion request, revert back to Approved
  const targetStatus = isDeletionRejection ? 'Approved' : 'Rejected';

  await db.update(simulations)
    .set({
      status: targetStatus,
      history: [...history, newHistoryEntry],
      updatedAt: new Date() as any
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  // Notify creator
  await createNotificationAndSendEmail({
    db,
    orgId,
    userId: sim.createdBy!,
    message: isDeletionRejection
      ? `Your deletion request for simulation "${sim.name}" was rejected. The simulation remains Approved. Note: ${body.note}`
      : `Your scoping simulation "${sim.name}" has been rejected. Reason: ${body.note}`,
    type: 'error',
    link: `/scoping?id=${id}`,
    env: c.env,
  });

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
    .set({ assignedDepartmentIds: [body.departmentId] })
    .where(and(
      eq(glRows.snapshotId, sim.glSnapshotId!),
      eq(glRows.noGL, body.accountName),
      eq(glRows.organizationId, orgId)
    ));

  const auditService = new AuditService(db);
  await auditService.logAction({
    organizationId: orgId,
    userId: c.get('userId'),
    action: 'ASSIGN_DEPARTMENT',
    entityType: 'GL_Account',
    entityId: `${sim.glSnapshotId}:${body.accountName}`,
    description: `Assigned department ${body.departmentId} to account ${body.accountName}`,
    dataAfter: body
  });

  return ok(c, { success: true });
});

scoping.post('/simulations/:id/request-deletion', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id') as string;
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  let body: { reason?: string } = {};
  try {
    body = await c.req.json();
  } catch (e) {
    // empty
  }

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  // If already approved, transition to 'Pending Deletion Approval'
  const history = (sim.history as any[]) || [];
  const newHistoryEntry = {
    id: crypto.randomUUID(),
    action: "Request Deletion",
    role: userRole,
    userId: userId,
    timestamp: Date.now(),
    note: body.reason || "Requested deletion of simulation"
  };

  await db.update(simulations)
    .set({
      status: 'Pending Deletion Approval',
      history: [...history, newHistoryEntry],
      updatedAt: new Date() as any
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  const auditService = new AuditService(db);
  await auditService.logAction({
    organizationId: orgId,
    userId: userId,
    action: 'REQUEST_DELETION',
    entityType: 'Simulation',
    entityId: id,
    description: `Requested deletion for simulation "${sim.name}". Reason: ${body.reason || 'None specified'}`,
    dataBefore: sim
  });

  return ok(c, { success: true, status: 'Pending Deletion Approval' });
});

scoping.delete('/simulations/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userRole = c.get('userRole');
  const bypassWorkflow = c.req.query('bypassWorkflow') === 'true';

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  // If item is Approved and workflow is NOT bypassed, prevent direct physical deletion
  if (sim.status === 'Approved' && !bypassWorkflow && userRole !== 'Admin') {
    return bad(c, 'Cannot delete an Approved simulation directly. Please submit a Deletion Request for approval or confirm deletion with workflow disabled.', 403);
  }

  await db.delete(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  const auditService = new AuditService(db);
  await auditService.logAction({
    organizationId: orgId,
    userId: c.get('userId'),
    action: 'DELETE',
    entityType: 'Simulation',
    entityId: id,
    description: `Permanently deleted simulation "${sim.name}"`,
    dataBefore: sim
  });

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
    // Sequential updates to avoid transaction issues and overwhelming the DB
    for (const m of mappings) {
      await db.update(glRows)
        .set({ assignedDepartmentIds: m.departmentIds })
        .where(and(
          eq(glRows.snapshotId, sim.glSnapshotId!),
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
  const yearStr = c.req.query('year');
  
  let conditions = eq(glSnapshots.organizationId, orgId);
  if (yearStr) {
    const yearVal = parseInt(yearStr);
    if (!isNaN(yearVal)) {
      conditions = and(eq(glSnapshots.organizationId, orgId), eq(glSnapshots.year, yearVal)) as any;
    }
  }

  const items = await db.select().from(glSnapshots).where(conditions);
  return ok(c, { items });
});

scoping.post('/gl-snapshots', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const { filename, rows, year } = await c.req.json<{ filename: string, rows: any[], year?: number }>();

  const snapshotId = crypto.randomUUID();
  const now = new Date();

  // 1. Create the snapshot record
  await db.insert(glSnapshots).values({
    id: snapshotId,
    organizationId: orgId,
    filename,
    uploadDate: now,
    status: 'Draft',
    isActive: false,
    year: year ? parseInt(year as any) : null,
    benchmarkFsliNames: null,
  });

  // 2. Insert rows in batches to avoid overwhelming the DB
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map(r => ({
      id: crypto.randomUUID(),
      snapshotId,
      organizationId: orgId,
      ymd: r.ymd,
      entityCode: r.entityCode,
      noGL: r.noGL,
      glDesc: r.glDesc,
      currency: r.currency,
      balance: r.balance,
      fsliBalance: r.fsliBalance,
      fsliCode: r.fsliCode,
      fsliName: r.fsliName,
      category: r.category,
      subKategori: r.subKategori,
      noUrut: r.noUrut,
      assignedDepartmentIds: r.assignedDepartmentIds || [],
      ownerAcceptance: r.ownerAcceptance
    }));
    await db.insert(glRows).values(batch);
  }

  return ok(c, { id: snapshotId, filename, uploadDate: now, status: 'Draft' });
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

scoping.put('/gl-snapshots/:id/mapping', async (c) => {
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

scoping.post('/simulations/:id/workflow', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const id = c.req.param('id');
  const { action, note, assigneeId } = await c.req.json<{ action: string, note?: string, assigneeId?: string }>();

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  const history = (sim.workflowHistory as any[]) || [];
  const currentStatus = sim.workflowStatus || 'Draft';
  let nextStatus = currentStatus;

  // Simple State Machine for Scoping
  if (action === 'Submit') nextStatus = 'Pending CFO';
  else if (action === 'Review') nextStatus = 'Pending Komut';
  else if (action === 'Approve') nextStatus = 'Approved';
  else if (action === 'Reject') nextStatus = 'Rejected';
  else if (action === 'Rollback') nextStatus = 'Draft';

  const newHistoryEntry = {
    id: crypto.randomUUID(),
    fromStatus: currentStatus,
    toStatus: nextStatus,
    action,
    role: userRole,
    userId,
    assigneeId,
    timestamp: Date.now(),
    note: note || `${action} action performed`
  };

  await db.update(simulations)
    .set({
      workflowStatus: nextStatus,
      workflowHistory: [...history, newHistoryEntry],
      updatedAt: new Date() as any,
      // Keep legacy status synced for now
      status: nextStatus as any
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  // Notifications
  if (nextStatus === 'Approved') {
      await createNotificationAndSendEmail({
        db,
        orgId,
        userId: sim.createdBy!,
        message: `Your scoping simulation "${sim.name}" has been fully approved.`,
        type: 'success',
        link: `/scoping?id=${id}`,
        env: c.env,
      });
  } else if (nextStatus === 'Rejected') {
      await createNotificationAndSendEmail({
        db,
        orgId,
        userId: sim.createdBy!,
        message: `Scoping simulation "${sim.name}" was rejected: ${note}`,
        type: 'error',
        link: `/scoping?id=${id}`,
        env: c.env,
      });
  }

  return ok(c, { nextStatus });
});

export default scoping;
