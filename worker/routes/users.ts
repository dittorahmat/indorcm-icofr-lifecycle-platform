import { Hono, type Context } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound, AppError } from '../lib/utils';
import { getDb } from '../db';
import {
  user, organization, auditLogs, member, departments,
  userPreferences
} from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import type { Settings } from "@shared/types";
import { seedDatabase } from '../db/seed';
import { ScopingService } from '../services/scoping-service';
import { sendEmail } from '../services/email';
import { rbac } from '../lib/guard';
import { isUserLevel, isUserRole } from '@shared/role-options';

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
      html: `
        <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">SMTP Test Connection Successful</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Congratulations! Your custom email server configuration is working perfectly on IndoGRC Pro.</p>
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0; border: 1px solid #f1f5f9;">
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Sender Address:</strong> ${body.senderEmail || 'info@dsintegra.co.id'}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Sender Name:</strong> ${body.senderName || 'IndoGRC Pro'}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>SMTP Host:</strong> ${body.smtpHost}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">This is an automated test email. Please do not reply directly.</p>
        </div>
      `,
      settings: body,
      env: c.env,
    });
    return ok(c, { success: true });
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    return bad(c, error.message || 'Failed to send test email');
  }
});

users.post('/settings/test-webhook', rbac(['Admin', 'Line 2']), async (c) => {
  const body = await c.req.json<{ provider: 'slack' | 'msTeams' | 'generic'; webhookUrl: string }>();
  if (!body.webhookUrl) return bad(c, 'Webhook URL is required');

  const appUrl = c.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const testPayload = {
    title: 'IndoGRC Pro - Webhook Test Connection',
    message: 'Selamat! Koneksi webhook notifikasi IndoGRC Pro berhasil terhubung dengan sukses.',
    type: 'success',
    link: '/notifications',
  };

  const webhookPayloads: Record<typeof body.provider, unknown> = {
    slack: {
      text: `[SUCCESS] ${testPayload.message}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '✅ IndoGRC Pro - Webhook Test Connection' } },
        { type: 'section', text: { type: 'mrkdwn', text: testPayload.message } },
      ],
    },
    msTeams: {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: testPayload.title,
      themeColor: '10B981',
      title: '✅ IndoGRC Pro - Webhook Test Connection',
      text: testPayload.message,
      potentialAction: [
        { '@type': 'OpenURI', name: 'Buka di IndoGRC Pro', targets: [{ os: 'default', uri: `${appUrl}${testPayload.link}` }] },
      ],
    },
    generic: {
      event: 'icorf.webhook.test',
      timestamp: new Date().toISOString(),
      type: 'success',
      title: testPayload.title,
      message: testPayload.message,
      link: `${appUrl}${testPayload.link}`,
    },
  };

  try {
    const response = await fetch(body.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayloads[body.provider]),
    });

    if (!response.ok) {
      return bad(c, `Webhook provider returned HTTP ${response.status}`);
    }

    return ok(c, { success: true });
  } catch (err: any) {
    console.error('Webhook Test Error:', err);
    return bad(c, err.message || 'Failed to send test webhook');
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

// --- DEV TOOLS (Admin Only, non-production, POST + confirm token) ---
// Discipline: no runtime DDL here. Single source of DDL truth is versioned
// drizzle/*.sql (see 0048_consolidate_runtime_ddl.sql). Legacy one-off
// repair/migration endpoints (e.g. /dev/fix-db) were removed after consolidation.
function assertDevAllowed(c: any): { allowed: boolean; reason?: string } {
  const env = (c.env?.ENV || c.env?.NODE_ENV || (typeof process !== 'undefined' ? process.env.NODE_ENV : '')) as string;
  if (env === 'production') return { allowed: false, reason: 'Disabled in production. Use versioned drizzle migrations + CLI scripts.' };
  return { allowed: true };
}

function assertConfirmToken(c: any): boolean {
  const expected = c.env?.DEV_CONFIRM_TOKEN || (typeof process !== 'undefined' ? process.env.DEV_CONFIRM_TOKEN : '');
  if (!expected) return true;
  const got = c.req.header('x-dev-confirm') || c.req.query('confirm');
  return got === expected;
}

users.post('/dev/re-seed', rbac(['Admin']), async (c) => {
  const gate = assertDevAllowed(c);
  if (!gate.allowed) return bad(c, gate.reason || 'Forbidden');
  if (!assertConfirmToken(c)) return bad(c, 'Missing or invalid x-dev-confirm token');
  const mode = c.req.query('mode') || 'full';
  const isSyncOnly = mode === 'auth';
  
  try {
    await seedDatabase(c.env.DATABASE_URL, c.env.BETTER_AUTH_SECRET, 'true', isSyncOnly);
    return ok(c, { message: isSyncOnly ? 'Auth synced!' : 'Database re-seeded successfully' });
  } catch (e: any) {
    console.error('Seed error:', e);
    return bad(c, 'DEV_SEED_FAILED', 500);
  }
});

users.post('/dev/purge-all', rbac(['Admin']), async (c) => {
  const gate = assertDevAllowed(c);
  if (!gate.allowed) return bad(c, gate.reason || 'Forbidden');
  if (!assertConfirmToken(c)) return bad(c, 'Missing or invalid x-dev-confirm token');
  const db = getDb(c.env.DATABASE_URL);
  try {
    await db.execute(sql`DELETE FROM bpm_diagrams`);
    await db.execute(sql`DELETE FROM bpm_node_rcms`);
    await db.execute(sql`DELETE FROM rcm_controls`);
    await db.execute(sql`DELETE FROM rcms`);
    await db.execute(sql`DELETE FROM controls`);
    await db.execute(sql`DELETE FROM bpm_processes`);
    await db.execute(sql`DELETE FROM csa_records`);
    await db.execute(sql`DELETE FROM test_records`);
    await db.execute(sql`DELETE FROM action_plans`);
    await db.execute(sql`DELETE FROM deficiencies`);
    await db.execute(sql`DELETE FROM simulations`);
    await db.execute(sql`DELETE FROM gl_snapshots`);
    await db.execute(sql`DELETE FROM gl_rows`);
    await db.execute(sql`DELETE FROM departments`);
    await db.execute(sql`DELETE FROM audit_logs`);
    await db.execute(sql`DELETE FROM aggregate_deficiencies`);
    await db.execute(sql`DELETE FROM account_assertions`);
    await db.execute(sql`DELETE FROM vendors`);
    await db.execute(sql`DELETE FROM soc_reports`);
    await db.execute(sql`DELETE FROM soc_evaluations`);
    await db.execute(sql`DELETE FROM csa_schedules`);
    await db.execute(sql`DELETE FROM transaction_details`);
    await db.execute(sql`DELETE FROM transaction_uploads`);

    return ok(c, { message: "All business data purged. Fresh start!" });
  } catch (e: any) {
    console.error('Purge-all error:', e);
    return bad(c, 'DEV_PURGE_FAILED', 500);
  }
});

users.post('/dev/purge-scoping', rbac(['Admin']), async (c) => {
  const gate = assertDevAllowed(c);
  if (!gate.allowed) return bad(c, gate.reason || 'Forbidden');
  if (!assertConfirmToken(c)) return bad(c, 'Missing or invalid x-dev-confirm token');
  const db = getDb(c.env.DATABASE_URL);
  const scopingService = new ScopingService(db);
  try {
    const result = await scopingService.purgeData(c.get('organizationId'), c.get('userId'));
    return ok(c, result);
  } catch (e: any) {
    console.error('Purge-scoping error:', e);
    return bad(c, 'DEV_PURGE_FAILED', 500);
  }
});

export default users;
