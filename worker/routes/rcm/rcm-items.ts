import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok } from '../../lib/utils';
import { getDb } from '../../db';
import { RcmService } from "../../services/rcm-service";
import { runWorkflowTransition } from "../../services/workflow/workflow-drizzle-adapter";
import { rbac } from "../../lib/guard";
import type { WorkflowAction } from "@shared/types";

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

// Same shape as bpm.ts: runWorkflowTransition decides the action's roles, the
// route guard admits every role an RCM change transition can belong to.
rcmItemsRoute.post('/rcm/:id/workflow', rbac(['Line 1', 'Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const body = await c.req.json<{ action: WorkflowAction; note?: string; assigneeId?: string; category?: string; effectiveDate?: string }>();

  const result = await runWorkflowTransition(db, c.env, {
    entityType: 'RCM_CHANGE',
    entityId: id,
    organizationId: c.get('organizationId'),
    userId: c.get('userId'),
    role: c.get('userRole'),
    action: body.action,
    note: body.note,
    assigneeId: body.assigneeId,
    category: body.category,
    effectiveDate: body.effectiveDate,
  });
  return ok(c, result);
});

rcmItemsRoute.delete('/rcm/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const result = await rcmService.delete(c.get('organizationId'), id);
  return ok(c, result);
});
