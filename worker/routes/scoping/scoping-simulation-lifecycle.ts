import { Hono, type Context } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound, AppError } from '../../lib/utils';
import { getDb } from '../../db';
import { simulations } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { ApprovalHistoryEntry, WorkflowAction } from "@shared/types";
import { decideSimulationTransition, resolveSimulationStatus, simulationStatusColumns, SIMULATION_DELETION_STATUS } from "@shared/scoping-simulation-status";
import { decideTransition, entityRoles } from "@shared/workflow-transitions";
import { AuditService } from "../../services/audit-service";
import { invalidateAiCachesForOrg } from "../../services/ai-service";
import { createNotificationAndSendEmail } from '../../services/email';
import { runWorkflowTransition } from "../../services/workflow/workflow-drizzle-adapter";
import { rbac } from "../../lib/guard";

const simulationLifecycle = new Hono<HonoEnv>();

/**
 * Every route in this file declares `:id`. Hono types `param()` as
 * `string | undefined`, so a missing id is a 400 with a stable code rather than
 * an escape cast (HEAD carried four `as string` casts here). `app.onError` maps
 * the `AppError` to a safe code+message response.
 */
function requireSimulationId(c: Context<HonoEnv>): string {
  const raw = c.req.param('id');
  if (!raw) throw new AppError('SIMULATION_ID_REQUIRED', 'Simulation id is required', 400);
  return raw;
}

simulationLifecycle.post('/simulations/:id/approve', rbac(['CFO', 'Commissioner', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = requireSimulationId(c);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = await c.req.json<{ note?: string }>();

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  const status = resolveSimulationStatus(sim);
  const decision = decideSimulationTransition({ status, role: userRole, action: 'Approve', note: body.note });
  if (decision.ok === false) return bad(c, decision.code, decision.status, decision.message);

  // Approving the deletion request removes the row; it is not a status transition.
  if (decision.kind === 'delete') {
    await db.delete(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

    const auditService = new AuditService(db);
    await auditService.logAction({
      organizationId: orgId,
      userId,
      action: 'APPROVE_DELETION',
      entityType: 'Simulation',
      entityId: id,
      description: `Approved deletion request for simulation "${sim.name}". Reason: ${body.note || 'Approved deletion'}`,
      dataBefore: sim,
    });

    await createNotificationAndSendEmail({
      db,
      orgId,
      userId: sim.createdBy ?? userId,
      message: `Your deletion request for simulation "${sim.name}" has been approved and permanently removed.`,
      type: 'info',
      link: `/scoping`,
      env: c.env,
    });

    return ok(c, { success: true, deleted: true });
  }

  const history = Array.isArray(sim.history) ? sim.history : [];
  const newHistoryEntry: ApprovalHistoryEntry = {
    id: crypto.randomUUID(),
    action: decision.historyAction,
    role: userRole,
    userId,
    timestamp: Date.now(),
    note: body.note || 'Approved',
  };

  await db.update(simulations)
    .set({
      ...simulationStatusColumns(decision.nextStatus),
      history: [...history, newHistoryEntry],
      updatedAt: new Date(),
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  if (decision.nextStatus === 'Approved') {
    // Materiality baseline changed: drop this org's AI caches (version bump covers reads too).
    invalidateAiCachesForOrg(orgId);
  }

  await createNotificationAndSendEmail({
    db,
    orgId,
    userId: sim.createdBy ?? userId,
    message: `Your scoping simulation "${sim.name}" has been ${decision.nextStatus === 'Approved' ? 'approved' : 'moved to next approval stage'}.`,
    type: 'success',
    link: `/scoping?id=${id}`,
    env: c.env,
  });

  return ok(c, { success: true });
});

simulationLifecycle.post('/simulations/:id/reject', rbac(['CFO', 'Commissioner', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = requireSimulationId(c);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = await c.req.json<{ note?: string }>();

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  const status = resolveSimulationStatus(sim);
  const decision = decideSimulationTransition({ status, role: userRole, action: 'Reject', note: body.note });
  if (decision.ok === false) return bad(c, decision.code, decision.status, decision.message);

  const history = Array.isArray(sim.history) ? sim.history : [];
  const newHistoryEntry: ApprovalHistoryEntry = {
    id: crypto.randomUUID(),
    action: decision.historyAction,
    role: userRole,
    userId,
    timestamp: Date.now(),
    note: body.note ?? '',
  };

  await db.update(simulations)
    .set({
      ...simulationStatusColumns(decision.nextStatus),
      history: [...history, newHistoryEntry],
      updatedAt: new Date(),
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  const rejectionNote = body.note ?? '';
  await createNotificationAndSendEmail({
    db,
    orgId,
    userId: sim.createdBy ?? userId,
    message: decision.historyAction === 'Reject Deletion'
      ? `Your deletion request for simulation "${sim.name}" was rejected. The simulation remains Approved. Note: ${rejectionNote}`
      : `Your scoping simulation "${sim.name}" has been rejected. Reason: ${rejectionNote}`,
    type: 'error',
    link: `/scoping?id=${id}`,
    env: c.env,
  });

  return ok(c, { success: true });
});

simulationLifecycle.post('/simulations/:id/request-deletion', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = requireSimulationId(c);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  let body: { reason?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // empty
  }

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  // Only an Approved simulation can enter deletion review, and the authority
  // comes from the canonical table like every other step.
  const status = resolveSimulationStatus(sim);
  const decision = decideTransition({
    entityType: 'SCOPING', currentStatus: status, action: 'Request Deletion', role: userRole,
  });
  if (decision.ok === false) return bad(c, decision.code, decision.status, decision.message);

  const history = Array.isArray(sim.history) ? sim.history : [];
  const newHistoryEntry: ApprovalHistoryEntry = {
    id: crypto.randomUUID(),
    action: 'Request Deletion',
    role: userRole,
    userId,
    timestamp: Date.now(),
    note: body.reason || "Requested deletion of simulation",
  };

  await db.update(simulations)
    .set({
      ...simulationStatusColumns(SIMULATION_DELETION_STATUS),
      history: [...history, newHistoryEntry],
      updatedAt: new Date(),
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  const auditService = new AuditService(db);
  await auditService.logAction({
    organizationId: orgId,
    userId,
    action: 'REQUEST_DELETION',
    entityType: 'Simulation',
    entityId: id,
    description: `Requested deletion for simulation "${sim.name}". Reason: ${body.reason || 'None specified'}`,
    dataBefore: sim,
  });

  return ok(c, { success: true, status: SIMULATION_DELETION_STATUS });
});

// The canonical SCOPING table's `requiredRole` is the per-action authority; this
// route-level `rbac` is the union of every role that appears in any SCOPING step,
// read from that table. A role a stage does not admit still gets 403 from the
// matrix, never from a second copy of the rules.
simulationLifecycle.post('/simulations/:id/workflow', rbac(entityRoles('SCOPING')), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = requireSimulationId(c);
  const orgId = c.get('organizationId');
  const { action, note, assigneeId } = await c.req.json<{ action: WorkflowAction; note?: string; assigneeId?: string }>();

  const [sim] = await db.select().from(simulations)
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) throw new AppError('SIMULATION_NOT_FOUND', 'Simulation not found', 404);

  // A submit must carry a derived PM — including a simulation with no snapshot
  // at all, which used to slip past the `glSnapshotId` test and reach CFO review
  // (and the Asesmen Manajemen) with a silent 0.
  if (action === 'Submit' && !sim.pmValue) {
    return bad(c, 'MATERIALITY_NOT_CALCULATED', 400, 'Derive the materiality (snapshot + basis) before submitting the simulation');
  }

  const result = await runWorkflowTransition(db, c.env, {
    entityType: 'SCOPING',
    entityId: id,
    organizationId: orgId,
    userId: c.get('userId'),
    role: c.get('userRole'),
    action,
    note,
    assigneeId,
  });
  return ok(c, result);
});

export default simulationLifecycle;
