import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok } from '../lib/utils';
import { getDb } from '../db';
import { notifications } from '../db/schema';
import { and, eq, desc, sql } from 'drizzle-orm';
import { createNotificationAndSendEmail } from '../services/email';

const notificationsApp = new Hono<HonoEnv>();

notificationsApp.get('/notifications/unread-count', async (c) => {
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

notificationsApp.get('/notifications', async (c) => {
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

notificationsApp.post('/notifications', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<{ message: string; type?: string; link?: string; userId?: string }>();

  const targetUserId = body.userId || userId;

  const id = await createNotificationAndSendEmail({
    db,
    orgId,
    userId: targetUserId,
    message: body.message,
    type: body.type,
    link: body.link,
    env: c.env,
  });

  return ok(c, { id });
});

notificationsApp.post('/notifications/:id/read', async (c) => {
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

notificationsApp.post('/notifications/read-all', async (c) => {
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

notificationsApp.delete('/notifications/:id', async (c) => {
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

notificationsApp.post('/notifications/clear-all', async (c) => {
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
