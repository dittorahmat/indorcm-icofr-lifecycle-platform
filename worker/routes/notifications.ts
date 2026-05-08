import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok } from '../lib/utils';
import { getDb } from '../db';
import { notifications } from '../db/schema';
import { and, eq, desc, sql } from 'drizzle-orm';

const notificationsApp = new Hono<HonoEnv>();

notificationsApp.get('/unread-count', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  const result = await db.select({
    count: sql<number>`count(*)`
  })
    .from(notifications)
    .where(and(
      eq(notifications.organizationId, orgId),
      eq(notifications.userId, userId),
      eq(notifications.readStatus, false)
    ));

  return ok(c, { count: Number(result[0]?.count || 0) });
});

notificationsApp.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  const items = await db.select()
    .from(notifications)
    .where(and(
      eq(notifications.organizationId, orgId),
      eq(notifications.userId, userId)
    ))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return ok(c, items);
});

notificationsApp.post('/:id/read', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  await db.update(notifications)
    .set({ readStatus: true })
    .where(and(
      eq(notifications.id, id),
      eq(notifications.organizationId, orgId),
      eq(notifications.userId, userId)
    ));

  return ok(c, { success: true });
});

notificationsApp.post('/read-all', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  await db.update(notifications)
    .set({ readStatus: true })
    .where(and(
      eq(notifications.organizationId, orgId),
      eq(notifications.userId, userId)
    ));

  return ok(c, { success: true });
});

notificationsApp.delete('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  await db.delete(notifications)
    .where(and(
      eq(notifications.id, id),
      eq(notifications.organizationId, orgId),
      eq(notifications.userId, userId)
    ));

  return ok(c, { success: true });
});

notificationsApp.post('/clear-all', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  await db.delete(notifications)
    .where(and(
      eq(notifications.organizationId, orgId),
      eq(notifications.userId, userId)
    ));

  return ok(c, { success: true });
});

export default notificationsApp;
