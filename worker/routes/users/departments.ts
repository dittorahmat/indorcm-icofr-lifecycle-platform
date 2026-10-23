import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import { ok } from '../../lib/utils';
import { getDb } from '../../db';
import { departments } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { rbac } from '../../lib/guard';

const departmentRoutes = new Hono<HonoEnv>();

departmentRoutes.get('/departments', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(departments).where(eq(departments.organizationId, orgId));
  return ok(c, { items });
});

departmentRoutes.post('/departments', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<{ name: string }>();

  const id = crypto.randomUUID();
  await db.insert(departments).values({
    id,
    organizationId: orgId,
    name: body.name,
  });

  return ok(c, { id });
});

departmentRoutes.put('/departments/:id', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const body = await c.req.json<{ name: string }>();

  await db.update(departments).set({ name: body.name }).where(eq(departments.id, id));
  return ok(c, { success: true });
});

departmentRoutes.delete('/departments/:id', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  await db.delete(departments).where(eq(departments.id, id));
  return ok(c, { success: true });
});

export default departmentRoutes;
