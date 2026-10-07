import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import { rcms } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { RcmService } from "../../services/rcm-service";
import { rbac } from "../../lib/guard";

export const rcmItemsRoute = new Hono<HonoEnv>();

rcmItemsRoute.get('/rcm', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');
  const items = await rcmService.getAll(orgId, year ? parseInt(year) : undefined);
  return ok(c, { items });
});

rcmItemsRoute.post('/rcm', rbac(['Line 2', 'Admin', 'Line 1']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const body = await c.req.json();
  const newItem = await rcmService.create(c.get('organizationId'), c.get('userId'), body);
  return ok(c, newItem);
});

rcmItemsRoute.put('/rcm/:id', rbac(['Line 2', 'Admin', 'Line 1']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const body = await c.req.json();
  const result = await rcmService.update(
    c.get('organizationId'), 
    c.get('userId'), 
    id, 
    body, 
    c.get('userRole')
  );
  return ok(c, result);
});

rcmItemsRoute.post('/rcm/:id/validate', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const result = await rcmService.validate(c.get('organizationId'), c.get('userId'), id);
  return ok(c, result);
});

rcmItemsRoute.post('/rcm/:id/approve-change', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  let body: { category?: string; effectiveDate?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // empty body fallback
  }
  const effectiveDate = body.effectiveDate ? new Date(body.effectiveDate) : undefined;
  const result = await rcmService.approveChange(c.get('organizationId'), c.get('userId'), id, body.category, effectiveDate);
  return ok(c, result);
});

rcmItemsRoute.post('/rcm/:id/workflow', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const role = c.get('userRole');
  const body = await c.req.json<{ action: string; note: string; assigneeId?: string; category?: string; effectiveDate?: string }>();

  const existing = await db.select().from(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c, 'RCM not found');

  const rcmRecord = existing[0];
  const currentStatus = rcmRecord.workflowStatus || "Draft";
  let nextStatus = currentStatus;

  if (body.action === "Submit") {
    nextStatus = "In Review";
  } else if (body.action === "Approve") {
    nextStatus = "Approved";
  } else if (body.action === "Reject") {
    if (!body.note) return bad(c, "Rejection requires a note");
    nextStatus = "Draft";
  } else if (body.action === "Rollback") {
    if (!body.note) return bad(c, "Rollback requires a note");
    nextStatus = "In Review";
  }

  const historyEntry = {
    id: crypto.randomUUID(),
    action: body.action,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    userId,
    role,
    timestamp: Date.now(),
    note: body.note || ''
  };

  const currentHistory = (rcmRecord.workflowHistory as Array<Record<string, unknown>>) || [];
  const newHistory = [historyEntry, ...currentHistory];

  const updateData = {
    workflowStatus: nextStatus,
    workflowHistory: newHistory,
    status: nextStatus === 'Approved' ? 'Active' : (nextStatus === 'In Review' ? 'Pending Change Approval' : 'Draft')
  };

  await db.update(rcms).set(updateData).where(eq(rcms.id, id));

  if (nextStatus === 'Approved') {
    const rcmService = new RcmService(db);
    const effDate = body.effectiveDate ? new Date(body.effectiveDate) : new Date();
    await rcmService.approveChange(orgId, userId, id, body.category || 'Maintenance', effDate);
  }

  return ok(c, { success: true, nextStatus });
});

rcmItemsRoute.delete('/rcm/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const result = await rcmService.delete(c.get('organizationId'), id);
  return ok(c, result);
});
