import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import { ok } from '../../lib/utils';
import { getDb } from '../../db';
import { userPreferences } from '../../db/schema';
import { eq } from 'drizzle-orm';

interface NotificationPreferencesBody {
  inApp?: boolean;
  email?: boolean;
  slack?: boolean;
  msTeams?: boolean;
  genericWebhook?: boolean;
}

const notificationPreferences = new Hono<HonoEnv>();

notificationPreferences.get('/users/me/notification-preferences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');

  const rows = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  const defaultPrefs = {
    inApp: true,
    email: true,
    slack: true,
    msTeams: true,
    genericWebhook: true,
  };

  if (rows.length === 0 || !rows[0].notificationPreferences) {
    return ok(c, defaultPrefs);
  }

  return ok(c, { ...defaultPrefs, ...rows[0].notificationPreferences });
});

// rbac-exempt: self-scoped — the caller's own preference row. A role list here
// would lock some roles out of their own notification settings.
notificationPreferences.put('/users/me/notification-preferences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json<NotificationPreferencesBody>();

  const existing = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);

  const updatedPrefs = {
    inApp: body.inApp ?? true,
    email: body.email ?? true,
    slack: body.slack ?? true,
    msTeams: body.msTeams ?? true,
    genericWebhook: body.genericWebhook ?? true,
  };

  if (existing.length === 0) {
    await db.insert(userPreferences).values({
      userId,
      notificationPreferences: updatedPrefs,
      updatedAt: new Date(),
    });
  } else {
    await db.update(userPreferences)
      .set({
        notificationPreferences: updatedPrefs,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  }

  return ok(c, { success: true, preferences: updatedPrefs });
});

export default notificationPreferences;
