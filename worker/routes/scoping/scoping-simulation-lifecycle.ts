import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import {
  simulations, glRows, simulationAccountApplications,
  applications,
} from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type {
  SimulationStatus,
  WorkflowAction,
} from "@shared/types";
import { AuditService } from "../../services/audit-service";
import { createNotificationAndSendEmail } from '../../services/email';
import { runWorkflowTransition } from "../../services/workflow/workflow-drizzle-adapter";
import { rbac } from "../../lib/guard";

const simulationLifecycle = new Hono<HonoEnv>();

simulationLifecycle.post('/simulations/:id/approve', rbac(['CFO', 'Commissioner', 'Admin']), async (c) => {
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

  const history = (sim.history as Array<Record<string, unknown>>) || [];
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
      updatedAt: new Date() as never,
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

simulationLifecycle.post('/simulations/:id/reject', rbac(['CFO', 'Commissioner', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id') as string;
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = await c.req.json<{ note: string }>();

  if (!body.note) return bad(c, 'Note is required for rejection');

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  const history = (sim.history as Array<Record<string, unknown>>) || [];
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
      updatedAt: new Date() as never
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

simulationLifecycle.post('/simulations/:id/request-deletion', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id') as string;
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

  // If already approved, transition to 'Pending Deletion Approval'
  const history = (sim.history as Array<Record<string, unknown>>) || [];
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
      updatedAt: new Date() as never
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

simulationLifecycle.post('/simulations/:id/workflow', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const { action, note, assigneeId } = await c.req.json<{ action: WorkflowAction; note?: string; assigneeId?: string }>();

  const result = await runWorkflowTransition(db, c.env, {
    entityType: 'SCOPING',
    entityId: id,
    organizationId: c.get('organizationId'),
    userId: c.get('userId'),
    role: c.get('userRole'),
    action,
    note,
    assigneeId,
  });
  return ok(c, result);
});

export default simulationLifecycle;
