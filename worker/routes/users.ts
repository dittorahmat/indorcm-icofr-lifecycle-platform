import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  user, organization, auditLogs, member, departments,
  testRecords, testSamples
} from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import type { Settings } from "@shared/types";
import { seedDatabase } from '../db/seed';
import { ScopingService } from '../services/scoping-service';

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

users.post('/users', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name: body.name,
    email: body.email,
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

users.put('/users/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const body = await c.req.json<any>();
  
  await db.update(user).set({
    name: body.name,
    email: body.email,
    level: body.level,
    departmentId: body.departmentId,
    updatedAt: new Date(),
  }).where(eq(user.id, id));

  if (body.role) {
    await db.update(member).set({ role: body.role }).where(eq(member.userId, id));
  }

  return ok(c, { success: true });
});

users.delete('/users/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  await db.delete(member).where(eq(member.userId, id));
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

users.post('/departments', async (c) => {
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

users.put('/departments/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const body = await c.req.json<any>();
  
  await db.update(departments).set({ name: body.name }).where(eq(departments.id, id));
  return ok(c, { success: true });
});

users.delete('/departments/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
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
    ceoName: meta.ceoName || "Direktur Utama",
    cfoName: meta.cfoName || "Direktur Keuangan",
    fiscalYear: meta.fiscalYear || meta.periodYear || new Date().getFullYear(),
    isPeriodLocked: meta.isPeriodLocked || false,
    verificationHash: meta.verificationHash,
    signedOffDate: meta.signedOffDate ? (typeof meta.signedOffDate === 'string' ? new Date(meta.signedOffDate).getTime() : meta.signedOffDate) : undefined,
  };

  return ok(c, settings);
});

users.post('/settings', async (c) => {
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
  };

  await db.update(organization).set({ name: body.companyName, metadata: updatedMeta }).where(eq(organization.id, orgId));
  return ok(c, { success: true });
});

// --- DEV TOOLS (Purge) ---

users.get('/dev/fix-db', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  try {
    await db.execute(sql`ALTER TABLE simulations ADD COLUMN IF NOT EXISTS significant_accounts jsonb;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en';`);
    await db.execute(sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS itgc_areas jsonb DEFAULT '[]';`);
    await db.execute(sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'info';`);
    
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


users.get('/dev/re-seed', async (c) => {
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

users.get('/dev/purge-all', async (c) => {
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

users.delete('/dev/purge-scoping', async (c) => {
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
