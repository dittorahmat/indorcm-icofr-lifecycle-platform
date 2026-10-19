import { Hono, type Context } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound, AppError } from '../lib/utils';
import { getDb } from '../db';
import {
  user, organization, member, departments,
  userPreferences
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { Settings } from "@shared/types";
import { sendEmail } from '../services/email';
import { rbac } from '../lib/guard';
import { isUserLevel, isUserRole } from '@shared/role-options';
import { buildWebhookPayload, buildSmtpTestEmailHtml, isWebhookProvider } from '../services/notifications/payloads';
import devRoutes from './users/dev';

const users = new Hono<HonoEnv>();

/** Map a typed `AppError` through `bad()` — this barrel is mounted without `app.onError` in tests. */
const rejectOption = (c: Context<HonoEnv>, err: AppError) =>
  bad(c, err.code, err.status, err.message);

// --- User Routes ---

users.get('/user/me', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const orgId = c.get('organizationId');

  const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (currentUser.length === 0) return notFound(c, 'User not found');

  return ok(c, {
    ...currentUser[0],
    organizationId: orgId
  });
});

users.get('/user/preferences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');

  const pref = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (pref.length === 0) {
    return ok(c, { layout: null });
  }

  return ok(c, { layout: pref[0].layout });
});

// rbac-exempt: self-scoped — writes the row keyed by the caller's own userId.
users.put('/user/preferences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json<any>();

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

users.get('/users', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  
  const results = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: member.role,
    level: user.level,
    departmentId: user.departmentId,
  })
  .from(user)
  .innerJoin(member, eq(user.id, member.userId))
  .where(eq(member.organizationId, orgId));

  return ok(c, { items: results });
});

users.post('/users', rbac(['Admin']), async (c) => {
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();

  const role = body.role || 'Line 1';
  if (!isUserRole(role)) return rejectOption(c, new AppError('INVALID_USER_ROLE', `Unknown role: ${String(role)}`, 400));
  const level = body.level || 'Staff';
  if (!isUserLevel(level)) return rejectOption(c, new AppError('INVALID_USER_LEVEL', `Unknown level: ${String(level)}`, 400));

  const db = getDb(c.env.DATABASE_URL);
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name: body.name,
    email: body.email,
    emailVerified: false,
    level,
    departmentId: body.departmentId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: id,
    role,
    createdAt: new Date(),
  });

  return ok(c, { id });
});

users.put('/users/:id', rbac(['Admin']), async (c) => {
  const id = c.req.param('id')!;
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();

  if (body.role !== undefined && !isUserRole(body.role)) return rejectOption(c, new AppError('INVALID_USER_ROLE', `Unknown role: ${String(body.role)}`, 400));
  if (body.level !== undefined && !isUserLevel(body.level)) return rejectOption(c, new AppError('INVALID_USER_LEVEL', `Unknown level: ${String(body.level)}`, 400));

  const db = getDb(c.env.DATABASE_URL);
  await db.update(user).set({
    name: body.name,
    email: body.email,
    level: body.level,
    departmentId: body.departmentId,
    updatedAt: new Date(),
  }).where(eq(user.id, id));

  if (body.role) {
    await db.update(member).set({ role: body.role }).where(and(eq(member.userId, id), eq(member.organizationId, orgId)));
  }

  return ok(c, { success: true });
});

users.delete('/users/:id', rbac(['Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id')!;
  const orgId = c.get('organizationId');
  await db.delete(member).where(and(eq(member.userId, id), eq(member.organizationId, orgId)));
  await db.delete(user).where(eq(user.id, id));
  return ok(c, { success: true });
});

// --- Department Routes ---

users.get('/departments', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(departments).where(eq(departments.organizationId, orgId));
  return ok(c, { items });
});

users.post('/departments', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
  const id = crypto.randomUUID();
  await db.insert(departments).values({
    id,
    organizationId: orgId,
    name: body.name,
  });

  return ok(c, { id });
});

users.put('/departments/:id', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id')!;
  const body = await c.req.json<any>();
  
  await db.update(departments).set({ name: body.name }).where(eq(departments.id, id));
  return ok(c, { success: true });
});

users.delete('/departments/:id', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id')!;
  await db.delete(departments).where(eq(departments.id, id));
  return ok(c, { success: true });
});

// rbac-exempt: self-scoped — updates the caller's own user row (eq(user.id, userId)).
users.put('/user/profile', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json<{ language: string }>();

  if (!body.language) return bad(c, 'Language is required');

  await db.update(user).set({
    language: body.language,
    updatedAt: new Date(),
  }).where(eq(user.id, userId));

  return ok(c, { success: true });
});

// --- Settings Route ---

users.get('/settings', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');

  const orgs = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
  if (orgs.length === 0) return notFound(c, 'Organization not found');

  const org = orgs[0];
  const meta = (org.metadata as any) || {};

  const settings: Settings = {
    id: org.id,
    companyName: org.name,
    logoUrl: org.logo || undefined,
    ceoName: meta.ceoName || "Direktur Utama",
    cfoName: meta.cfoName || "Direktur Keuangan",
    fiscalYear: meta.fiscalYear || meta.periodYear || new Date().getFullYear(),
    isPeriodLocked: meta.isPeriodLocked || false,
    verificationHash: meta.verificationHash,
    signedOffDate: meta.signedOffDate ? (typeof meta.signedOffDate === 'string' ? new Date(meta.signedOffDate).getTime() : meta.signedOffDate) : undefined,
    emailProvider: meta.emailProvider || 'system',
    senderEmail: meta.senderEmail || '',
    senderName: meta.senderName || '',
    smtpHost: meta.smtpHost || '',
    smtpPort: meta.smtpPort || 587,
    smtpUser: meta.smtpUser || '',
    smtpPass: meta.smtpPass || '',
    customYears: meta.customYears || [],
    slackWebhookUrl: meta.slackWebhookUrl || '',
    slackEnabled: meta.slackEnabled ?? false,
    msTeamsWebhookUrl: meta.msTeamsWebhookUrl || '',
    msTeamsEnabled: meta.msTeamsEnabled ?? false,
    genericWebhookUrl: meta.genericWebhookUrl || '',
    genericWebhookEnabled: meta.genericWebhookEnabled ?? false,
  };

  return ok(c, settings);
});

users.put('/settings', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<Partial<Settings>>();

  const orgs = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
  if (orgs.length === 0) return notFound(c, 'Organization not found');

  const org = orgs[0];
  const meta = (org.metadata as any) || {};

  const updatedMeta = {
    ...meta,
    ceoName: body.ceoName,
    cfoName: body.cfoName,
    fiscalYear: body.fiscalYear,
    isPeriodLocked: body.isPeriodLocked,
    emailProvider: body.emailProvider,
    senderEmail: body.senderEmail,
    senderName: body.senderName,
    smtpHost: body.smtpHost,
    smtpPort: body.smtpPort,
    smtpUser: body.smtpUser,
    smtpPass: body.smtpPass,
    customYears: body.customYears,
    slackWebhookUrl: body.slackWebhookUrl,
    slackEnabled: body.slackEnabled,
    msTeamsWebhookUrl: body.msTeamsWebhookUrl,
    msTeamsEnabled: body.msTeamsEnabled,
    genericWebhookUrl: body.genericWebhookUrl,
    genericWebhookEnabled: body.genericWebhookEnabled,
  };

  await db.update(organization)
    .set({ 
      name: body.companyName, 
      logo: body.logoUrl,
      metadata: updatedMeta 
    })
    .where(eq(organization.id, orgId));
    
  return ok(c, { success: true });
});

users.post('/settings/test-email', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json<Partial<Settings>>();

  const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (currentUser.length === 0) return notFound(c, 'User not found');

  try {
    await sendEmail({
      to: currentUser[0].email,
      subject: 'IndoGRC Pro - Test SMTP Connection',
      html: buildSmtpTestEmailHtml(body),
      settings: body,
      env: c.env,
    });
    return ok(c, { success: true });
  } catch (error: unknown) {
    console.error('SMTP Test Error:', error);
    return bad(c, 'SMTP_TEST_FAILED', 502, error instanceof Error ? error.message : 'Failed to send test email');
  }
});

users.post('/settings/test-webhook', rbac(['Admin', 'Line 2']), async (c) => {
  const body = await c.req.json<{ provider: unknown; webhookUrl: string }>();
  if (!body.webhookUrl) return bad(c, 'WEBHOOK_URL_REQUIRED', 400, 'Webhook URL is required');
  if (!isWebhookProvider(body.provider)) {
    return bad(c, 'WEBHOOK_PROVIDER_UNKNOWN', 400, 'Unknown webhook provider');
  }

  // The test endpoint sends the SAME body a real notification sends: that is the
  // point of the button, and the body shape has one owner
  // (`worker/services/notifications/payloads.ts`).
  const payload = buildWebhookPayload(body.provider, {
    appUrl: c.env.BETTER_AUTH_URL || 'http://localhost:3000',
    title: 'IndoGRC Pro - Webhook Test Connection',
    message: 'Selamat! Koneksi webhook notifikasi IndoGRC Pro berhasil terhubung dengan sukses.',
    type: 'success',
    link: '/notifications',
  });

  try {
    const response = await fetch(body.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return bad(c, 'WEBHOOK_TEST_FAILED', 502, `Webhook provider returned HTTP ${response.status}`);
    }

    return ok(c, { success: true });
  } catch (err: unknown) {
    console.error('Webhook Test Error:', err);
    return bad(c, 'WEBHOOK_TEST_FAILED', 502, err instanceof Error ? err.message : 'Failed to send test webhook');
  }
});

// --- User Notification Preferences ---

users.get('/users/me/notification-preferences', async (c) => {
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

  return ok(c, { ...defaultPrefs, ...(rows[0].notificationPreferences as any) });
});

// rbac-exempt: self-scoped — the caller's own preference row. A role list here
// would lock some roles out of their own notification settings.
users.put('/users/me/notification-preferences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json<{
    inApp?: boolean;
    email?: boolean;
    slack?: boolean;
    msTeams?: boolean;
    genericWebhook?: boolean;
  }>();

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

// --- DEV TOOLS: extracted to `worker/routes/users/dev.ts` (URLs unchanged) ---
users.route('/', devRoutes);

export default users;
