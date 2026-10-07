import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok } from '../../lib/utils';
import { getDb } from '../../db';
import { csaSchedules } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { CsaDomainService } from "../../services/csa-domain-service";

export const csaSchedulesRoute = new Hono<HonoEnv>();

csaSchedulesRoute.get('/csa/schedules', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const service = new CsaDomainService(db);
  const items = await service.getSchedules(orgId);
  return ok(c, { items });
});

csaSchedulesRoute.post('/csa/schedules', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  const service = new CsaDomainService(db);
  const result = await service.createSchedules(orgId, body, c.env);
  return ok(c, result);
});

csaSchedulesRoute.patch('/csa/schedules/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();

  const updateData = { ...body };
  if (updateData.bpmProcessId === '') updateData.bpmProcessId = null;
  if (updateData.plannedDate) updateData.plannedDate = new Date(updateData.plannedDate);

  await db.update(csaSchedules)
    .set(updateData)
    .where(and(eq(csaSchedules.id, id), eq(csaSchedules.organizationId, orgId)));
  return ok(c, { success: true });
});

csaSchedulesRoute.delete('/csa/schedules/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  await db.delete(csaSchedules)
    .where(and(eq(csaSchedules.id, id), eq(csaSchedules.organizationId, orgId)));
  return ok(c, { success: true });
});
