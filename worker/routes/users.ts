import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  user, organization, auditLogs, member, departments,
  testRecords, testSamples, userPreferences
} from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import type { Settings } from "@shared/types";
import { seedDatabase } from '../db/seed';
import { ScopingService } from '../services/scoping-service';
import { sendEmail } from '../services/email';
import { rbac } from '../lib/guard';

const users = new Hono<HonoEnv>();

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
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name: body.name,
    email: body.email,
    emailVerified: false,
    level: body.level || 'Staff',
    departmentId: body.departmentId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: id,
    role: body.role || 'Line 1',
    createdAt: new Date(),
  });

  return ok(c, { id });
});

users.put('/users/:id', rbac(['Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id')!;
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
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

// --- DEV TOOLS (Admin Only) ---

users.get('/dev/fix-db', rbac(['Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    await db.execute(sql`ALTER TABLE simulations ADD COLUMN IF NOT EXISTS significant_accounts jsonb;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en';`);
    await db.execute(sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS itgc_areas jsonb DEFAULT '[]';`);
    await db.execute(sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'info';`);
    await db.execute(sql`ALTER TABLE gl_snapshots ADD COLUMN IF NOT EXISTS year integer;`);
    await db.execute(sql`ALTER TABLE gl_snapshots ADD COLUMN IF NOT EXISTS "benchmarkFsliNames" jsonb;`);
    await db.execute(sql`ALTER TABLE "account_assertions" ADD COLUMN IF NOT EXISTS "year" integer;`);
    await db.execute(sql`ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "change_category" text;`);
    await db.execute(sql`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "metadata" jsonb;`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS "user_preferences" (
      "user_id" text PRIMARY KEY NOT NULL,
      "layout" jsonb,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`);
    
    // Task 3.4: Legacy Data Migration
    const legacyTests = await db.select().from(testRecords);
    let migratedCount = 0;
    
    for (const test of legacyTests) {
        const existingSamples = await db.select().from(testSamples).where(eq(testSamples.testRecordId, test.id)).limit(1);
        if (existingSamples.length === 0) {
            await db.insert(testSamples).values({
                id: crypto.randomUUID(),
                organizationId: test.organizationId,
                testRecordId: test.id,
                sampleRef: 'LEGACY-SUMMARY',
                attrA: true,
                attrB: true,
                attrC: true,
                attrD: true,
                status: test.result === 'Effective' || test.result === 'Pass' ? 'Pass' : 'Fail',
                comments: 'Auto-generated from legacy test record result.'
            });
            migratedCount++;
        }
    }


    return ok(c, { 
        message: "Database fixed and legacy tests migrated!",
        migratedTests: migratedCount
    });
  } catch (e: any) {
    return ok(c, { error: e.message });
  }
});


users.get('/dev/re-seed', rbac(['Admin']), async (c) => {
  const mode = c.req.query('mode') || 'full';
  const isSyncOnly = mode === 'auth';
  
  try {
    await seedDatabase(c.env.DATABASE_URL, c.env.BETTER_AUTH_SECRET, 'true', isSyncOnly);
    return ok(c, { message: isSyncOnly ? 'Auth synced!' : 'Database re-seeded successfully' });
  } catch (e: any) {
    console.error('Seed error:', e);
    return ok(c, { error: e.message });
  }
});

users.get('/dev/purge-all', rbac(['Admin']), async (c) => {
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
    return ok(c, { error: e.message });
  }
});

users.delete('/dev/purge-scoping', rbac(['Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const scopingService = new ScopingService(db);
  try {
    const result = await scopingService.purgeData(c.get('organizationId'), c.get('userId'));
    return ok(c, result);
  } catch (e: any) {
    return ok(c, { error: e.message });
  }
});

export default users;
