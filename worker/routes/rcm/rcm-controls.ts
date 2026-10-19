import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import { ControlService } from "../../services/control-service";
import { rbac } from "../../lib/guard";

export const rcmControlsRoute = new Hono<HonoEnv>();

rcmControlsRoute.get('/controls', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const year = c.req.query('year');
  const items = await controlService.getAll(
    c.get('organizationId'), 
    c.req.query('level'),
    year ? parseInt(year) : undefined
  );
  return ok(c, { items });
});

rcmControlsRoute.get('/controls/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const item = await controlService.getById(c.get('organizationId'), c.req.param('id'));
  if (!item) return notFound(c);
  return ok(c, item);
});

rcmControlsRoute.post('/controls', rbac(['Line 2', 'Admin', 'Line 1']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const body = await c.req.json();
  const newItem = await controlService.create(
    c.get('organizationId'), 
    c.get('userId'), 
    c.get('userLevel'), 
    c.get('userRole'), 
    body
  );
  return ok(c, newItem);
});

rcmControlsRoute.put('/controls/:id', rbac(['Line 2', 'Admin', 'Line 1']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const body = await c.req.json();
  const id = c.req.param('id') as string;
  const result = await controlService.update(c.get('organizationId'), c.get('userId'), id, body);
  return ok(c, result);
});

rcmControlsRoute.post('/controls/:id/approve', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const id = c.req.param('id') as string;
  let body: { category?: string; effectiveDate?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // empty body fallback
  }
  const effectiveDate = body.effectiveDate ? new Date(body.effectiveDate) : undefined;
  const result = await controlService.approve(c.get('organizationId'), c.get('userId'), id, body.category, effectiveDate);
  return ok(c, result);
});

rcmControlsRoute.post('/controls/:id/submit-for-approval', rbac(['Line 1', 'Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const id = c.req.param('id') as string;
  const result = await controlService.submitForApproval(c.get('organizationId'), c.get('userId'), id);
  return ok(c, result);
});

rcmControlsRoute.post('/controls/:id/reject', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const { note } = await c.req.json();
  const id = c.req.param('id') as string;
  const result = await controlService.reject(c.get('organizationId'), c.get('userId'), id, note);
  return ok(c, result);
});

rcmControlsRoute.post('/controls/:id/request-deletion', rbac(['Line 1', 'Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const id = c.req.param('id') as string;
  let body: { reason?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // empty body fallback
  }
  const result = await controlService.requestDeletion(c.get('organizationId'), c.get('userId'), id, body.reason);
  return ok(c, result);
});

rcmControlsRoute.delete('/controls/:id', rbac(['Line 1', 'Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const id = c.req.param('id') as string;
  // No bypass query flag: the service decides by the caller's role, because a
  // client-supplied flag cannot be an authorization decision (see control-service).
  const result = await controlService.delete(c.get('organizationId'), id, c.get('userRole'));
  return ok(c, result);
});
