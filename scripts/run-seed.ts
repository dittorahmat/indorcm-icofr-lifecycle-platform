import 'dotenv/config';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../worker/db';
import * as schema from '../worker/db/schema';
import { MOCK_USERS, MOCK_DEPARTMENTS, MOCK_RCM, MOCK_CONTROLS } from '../shared/mock-data';
import { toMemberRole } from '@shared/member-role';

const getFriendlyEmail = (u: any): string => {
  if (u.role === 'Line 2') return 'line2@bumn.go.id';
  if (u.role === 'Line 3') return 'line3@bumn.go.id';
  if (u.role === 'CFO') return 'cfo@bumn.go.id';
  if (u.role === 'Commissioner' || u.role === 'Komisaris') return 'komisaris@bumn.go.id';
  if (u.role === 'Admin') return 'admin@bumn.go.id';
  if (u.role === 'External Auditor') return 'external@bumn.go.id';
  const deptSuffix = u.departmentId?.replace('dept-', '') || 'ops';
  const levelPrefix = u.level?.toLowerCase() || 'staff';
  return `${levelPrefix}.${deptSuffix}@bumn.go.id`.toLowerCase();
};

export const runSeed = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is missing!');
    process.exit(1);
  }

  console.log(`🌱 Seeding On-Premise Database... Mode: NON-DESTRUCTIVE UPSERT`);
  const db = getDb(databaseUrl);
  const orgId = 'org-bumn-default';

  // 1. ENSURE ORGANIZATION
  await db
    .insert(schema.organization)
    .values({
      id: orgId,
      name: 'PT Batubara Nusantara Sejahtera',
      slug: 'pt-bns',
      entityCode: '0101',
      createdAt: new Date(),
    })
    .onConflictDoNothing();

  // 2. SYNC DEPARTMENTS
  console.log('🏢 Syncing Departments...');
  for (const dept of MOCK_DEPARTMENTS) {
    await db
      .insert(schema.departments)
      .values({ ...dept, organizationId: orgId })
      .onConflictDoUpdate({
        target: schema.departments.id,
        set: { name: dept.name },
      });
  }

  // 3. SYNC USERS & ACCOUNTS
  console.log('🔐 Syncing Credentials (Default Pass: password)...');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync('password', salt, 100, 32, 'sha256').toString('hex');
  const passwordHash = `pbkdf2$100$${salt}$${hash}`;

  for (const u of MOCK_USERS) {
    const email = getFriendlyEmail(u);
    const existing = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
    let userId: string;

    if (existing.length > 0) {
      userId = existing[0].id;
      await db
        .update(schema.user)
        .set({
          name: u.name,
          role: u.role,
          level: u.level || 'Staff',
          departmentId: u.departmentId,
          updatedAt: new Date(),
        })
        .where(eq(schema.user.id, userId));
    } else {
      userId = crypto.randomUUID();
      await db.insert(schema.user).values({
        id: userId,
        email,
        name: u.name,
        emailVerified: true,
        role: u.role,
        level: u.level || 'Staff',
        departmentId: u.departmentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Account (Password)
    const existingAccount = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.accountId, email))
      .limit(1);

    if (existingAccount.length > 0) {
      await db
        .update(schema.account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(schema.account.id, existingAccount[0].id));
    } else {
      await db.insert(schema.account).values({
        id: crypto.randomUUID(),
        userId: userId,
        accountId: email,
        providerId: 'credential',
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Org Membership
    await db
      .insert(schema.member)
      .values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: userId,
        role: toMemberRole(u.role),
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }

  console.log('📦 Syncing Master Business Data...');

  // RCM
  for (const rcm of MOCK_RCM) {
    await db
      .insert(schema.rcms)
      .values({
        id: rcm.id,
        organizationId: orgId,
        process: rcm.process,
        subProcess: rcm.subProcess,
        riskDescription: rcm.riskDescription,
        status: rcm.status as any,
      })
      .onConflictDoUpdate({
        target: schema.rcms.id,
        set: { process: rcm.process, subProcess: rcm.subProcess, riskDescription: rcm.riskDescription },
      });
  }

  // CONTROLS
  for (const ctrl of MOCK_CONTROLS) {
    await db
      .insert(schema.controls)
      .values({
        id: ctrl.id,
        organizationId: orgId,
        rcmId: ctrl.rcmId,
        code: ctrl.code,
        name: ctrl.name,
        description: ctrl.description,
        ownerId: ctrl.ownerId,
        type: ctrl.type,
        nature: ctrl.nature,
        frequency: ctrl.frequency,
        bpmStatus: ctrl.bpmStatus || 'Approved',
        fsliCodes: ctrl.fsliCodes || [],
      })
      .onConflictDoUpdate({
        target: schema.controls.id,
        set: {
          code: ctrl.code,
          name: ctrl.name,
          description: ctrl.description,
          fsliCodes: ctrl.fsliCodes || [],
          nature: ctrl.nature,
          frequency: ctrl.frequency,
        },
      });
  }

  console.log('✨ Seed database completed successfully!');
  process.exit(0);
};

runSeed().catch((err) => {
  console.error('❌ Failed to run seed:', err);
  process.exit(1);
});
