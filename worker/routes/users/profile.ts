import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import { user, userPreferences } from '../../db/schema';
import { eq } from 'drizzle-orm';

/** The caller's own profile and layout preferences. */
const profile = new Hono<HonoEnv>();

profile.get('/user/me', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const orgId = c.get('organizationId');

  const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (currentUser.length === 0) return notFound(c, 'USER_NOT_FOUND', 'User not found');

  return ok(c, {
    ...currentUser[0],
    organizationId: orgId
  });
});

profile.get('/user/preferences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');

  const pref = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (pref.length === 0) {
    return ok(c, { layout: null });
  }

  return ok(c, { layout: pref[0].layout });
});

// rbac-exempt: self-scoped — writes the row keyed by the caller's own userId.
profile.put('/user/preferences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json<{ layout?: Record<string, unknown> | null }>();

  const existing = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(userPreferences).values({
      userId,
      layout: body.layout,
      updatedAt: new Date(),
    });
  } else {
    await db.update(userPreferences).set({
      layout: body.layout,
      updatedAt: new Date(),
    }).where(eq(userPreferences.userId, userId));
  }

  return ok(c, { success: true });
});

// rbac-exempt: self-scoped — updates the caller's own user row (eq(user.id, userId)).
profile.put('/user/profile', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json<{ language: string }>();

  if (!body.language) return bad(c, 'LANGUAGE_REQUIRED', 400, 'Language is required');

  await db.update(user).set({
    language: body.language,
    updatedAt: new Date(),
  }).where(eq(user.id, userId));

  return ok(c, { success: true });
});

export default profile;
