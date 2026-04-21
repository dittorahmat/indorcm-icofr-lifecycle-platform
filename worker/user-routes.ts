import { Hono } from "hono";
import type { HonoEnv } from './app';
import { ok, bad, notFound } from './lib/utils';
import { getDb } from './db';
import * as schema from './db/schema';
import { 
  rcms, auditLogs, controls, simulations, glSnapshots, glRows, user, 
  deficiencies, actionPlans, departments, bpmProcesses, csaRecords, csaSamples, 
  applications, member, account, session, bpmDiagrams, bpmNodeRcms, 
  rcmControls, organization, testRecords, aggregateDeficiencies,
  documents, documentDepartments, documentGls, documentFslis,
  systemLicenses
} from './db/schema';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import type { 
  Control, RCM, CSARecord, TestRecord, Deficiency, ActionPlan, 
  UserRole, UserLevel, Materiality, Scoping, ChangeLog, SOCReport, Application, 
  BUMNCluster, RiskLibrary, Settings, User, GLSnapshot, MaterialitySimulation, 
  SimulationStatus, BenchmarkBasis, BPMProcess, Department, BPMWorkflowStatus,
  AggregateDeficiency
} from "@shared/types";
import { z } from "zod";
import { parseCsv, unparseCsv } from './csv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ICOFR_KNOWLEDGE_BASE } from './knowledge-base';
import { getDocumentProxy, extractText } from "unpdf";
import * as pdfjs from "pdfjs-dist";
import { getAuth } from './auth';
import { getMachineFingerprint, verifyLicense, checkLicenseStatus } from './lib/license';
import { seedDatabase } from './db/seed';

export function userRoutes(app: Hono<HonoEnv>) {
  // --- Licensing Routes ---

  app.get('/api/license/status', async (c) => {
    // 1. Check for bypass flag first
    if (c.env.SKIP_LICENSE === 'true') {
        return ok(c, {
          status: 'active', // Report as active to frontend to satisfy guard
          machineId: 'CLOUDFLARE-DEMO-BYPASS',
          daysRemaining: 999,
          clientName: 'Cloudflare Demo'
        });
    }

    const db = getDb(c.env.DATABASE_URL);
    const activeLicense = await db.select().from(systemLicenses).limit(1);
    const fingerprint = getMachineFingerprint();

    if (activeLicense.length === 0) {
      return ok(c, {
        status: 'unactivated',
        machineId: fingerprint,
        daysRemaining: 0
      });
    }

    const license = activeLicense[0];
    const publicKey = c.env.LICENSE_PUBLIC_KEY || process.env.LICENSE_PUBLIC_KEY || '';
    const payload = await verifyLicense(license.licenseKey, publicKey);

    let daysRemaining = 0;
    if (payload) {
      const expiry = new Date(payload.expiryDate);
      daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    return ok(c, {
      status: license.status,
      machineId: fingerprint,
      daysRemaining,
      clientName: payload?.clientName,
      expiryDate: payload?.expiryDate,
      tier: payload?.tier
    });
  });

  app.post('/api/license/activate', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { licenseKey } = await c.req.json<{ licenseKey: string }>();

    if (!licenseKey) return bad(c, 'License key is required');

    const publicKey = c.env.LICENSE_PUBLIC_KEY || process.env.LICENSE_PUBLIC_KEY || '';
    const payload = await verifyLicense(licenseKey, publicKey);

    if (!payload) {
      return bad(c, 'Invalid license key signature');
    }

    const fingerprint = getMachineFingerprint();
    const status = checkLicenseStatus(payload, fingerprint);

    if (status) {
      return bad(c, `Activation failed: ${status}`);
    }

    // Upsert license
    const existing = await db.select().from(systemLicenses).limit(1);
    const now = new Date();
    
    if (existing.length > 0) {
      await db.update(systemLicenses).set({
        licenseKey,
        machineCode: fingerprint,
        activatedAt: now,
        expiresAt: new Date(payload.expiryDate),
        lastHeartbeat: now,
        status: 'active'
      }).where(eq(systemLicenses.id, existing[0].id));
    } else {
      await db.insert(systemLicenses).values({
        id: crypto.randomUUID(),
        licenseKey,
        machineCode: fingerprint,
        activatedAt: now,
        expiresAt: new Date(payload.expiryDate),
        lastHeartbeat: now,
        status: 'active'
      });
    }

    return ok(c, { success: true, message: 'License activated successfully' });
  });

  app.get('/api/auth/me', async (c) => {
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

  app.put('/api/auth/profile', async (c) => {
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

  app.get('/api/settings', async (c) => {
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

  app.get('/api/dev/fix-db', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    try {
      await db.execute(sql`ALTER TABLE simulations ADD COLUMN IF NOT EXISTS significant_accounts jsonb;`);
      await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en';`);
      return ok(c, { message: "Database fixed! Columns significant_accounts and language added." });
    } catch (e: any) {
      return ok(c, { error: e.message });
    }
  });

  app.get('/api/dev/re-seed', async (c) => {
    const mode = c.req.query('mode') || 'full';
    const isSyncOnly = mode === 'auth';
    
    try {
        await seedDatabase(
            c.env.DATABASE_URL, 
            c.env.BETTER_AUTH_SECRET, 
            c.env.SKIP_LICENSE, 
            isSyncOnly
        );
        return ok(c, { 
            message: isSyncOnly 
                ? "Auth data synchronized successfully. Business data (RCM/Controls) preserved." 
                : "Database re-seeded successfully (Full Reset)." 
        });
    } catch (e: any) {
        return bad(c, `Seeding failed: ${e.message}`);
    }
  });

  // --- User Management Routes ---

  app.get('/api/users', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const db = getDb(c.env.DATABASE_URL);
    const search = c.req.query('search') || '';
    const page = Number(c.req.query('page')) || 1;
    const limit = Number(c.req.query('limit')) || 10;
    const offset = (page - 1) * limit;

    const whereClause = search ? ilike(user.name, `%${search}%`) : undefined;

    const [items, totalCount] = await Promise.all([
      db.select().from(user)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(user.createdAt)),
      db.select({ count: sql<number>`count(*)` }).from(user).where(whereClause)
    ]);

    return ok(c, { 
      items, 
      total: Number(totalCount[0]?.count || 0),
      page,
      limit
    });
  });

  app.post('/api/users', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const db = getDb(c.env.DATABASE_URL);
    const auth = getAuth(c.env);
    const body = await c.req.json();

    try {
      const newUser = await auth.api.signUpEmail({
        body: {
          email: body.email,
          password: body.password || "password123",
          name: body.name,
          role: body.role || 'Line 1',
          level: body.level || 'Staff',
          departmentId: body.departmentId || '',
          language: 'en'
        }
      } as any);

      if (newUser) {
        await db.update(user).set({
          role: body.role || 'Line 1',
          level: body.level || 'Staff',
          departmentId: body.departmentId,
        }).where(eq(user.id, (newUser as any).user.id));

        return ok(c, (newUser as any).user);
      }
    } catch (e: any) {
      return bad(c, e.message);
    }
  });

  app.put('/api/users/:id', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    const body = await c.req.json();

    await db.update(user).set({
      name: body.name,
      role: body.role,
      level: body.level,
      departmentId: body.departmentId,
      updatedAt: new Date(),
    }).where(eq(user.id, id));

    return ok(c, { success: true });
  });

  app.delete('/api/users/:id', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);

    // Better Auth cleanup if needed, but for now we delete from our DB
    await db.delete(user).where(eq(user.id, id));
    await db.delete(schema.member).where(eq(schema.member.userId, id));
    await db.delete(schema.account).where(eq(schema.account.userId, id));
    await db.delete(schema.session).where(eq(schema.session.userId, id));

    return ok(c, { success: true });
  });

  app.get('/api/departments', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    
    // Join with user table to get counts per department
    const items = await db.select({
      id: departments.id,
      name: departments.name,
      organizationId: departments.organizationId,
      userCount: sql<number>`count(${user.id})`
    })
    .from(departments)
    .leftJoin(user, eq(user.departmentId, departments.id))
    .where(eq(departments.organizationId, orgId))
    .groupBy(departments.id);

    return ok(c, { items });
  });

  app.post('/api/departments', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const newDept = { id, organizationId: orgId, name: body.name };
    await db.insert(departments).values(newDept);
    return ok(c, newDept);
  });

  app.put('/api/departments/:id', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    const body = await c.req.json();
    await db.update(departments).set({ name: body.name }).where(eq(departments.id, id));
    return ok(c, { success: true });
  });

  app.delete('/api/departments/:id', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    await db.delete(departments).where(eq(departments.id, id));
    return ok(c, { success: true });
  });

  // --- Deficiencies & Action Plans ---

  app.get('/api/deficiencies', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(deficiencies).where(eq(deficiencies.organizationId, orgId));
    return ok(c, { items });
  });

  app.get('/api/actionplans', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(actionPlans).where(eq(actionPlans.organizationId, orgId));
    return ok(c, { items });
  });

  app.get('/api/aggregatedeficiencies', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(aggregateDeficiencies).where(eq(aggregateDeficiencies.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/aggregatedeficiencies', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<AggregateDeficiency>>();

    const id = crypto.randomUUID();
    const newAgg = {
      id,
      organizationId: orgId,
      name: body.name || "New Aggregate Analysis",
      year: body.year || new Date().getFullYear(),
      deficiencyIds: body.deficiencyIds || [],
      affectedAccounts: body.affectedAccounts || [],
      affectedAssertions: body.affectedAssertions || [],
      combinedMagnitude: body.combinedMagnitude || 0,
      aggregateLikelihood: body.aggregateLikelihood || "Low",
      finalSeverity: body.finalSeverity || "Control Deficiency",
      conclusionRationale: body.conclusionRationale || "",
      createdAt: new Date(),
      createdBy: userId,
    };

    await db.insert(aggregateDeficiencies).values(newAgg);
    return ok(c, newAgg);
  });

  app.post('/api/reports/sign-off', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');

    const orgs = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
    if (orgs.length === 0) return notFound(c, 'Organization not found');

    const org = orgs[0];
    const meta = (org.metadata as any) || {};

    const signOffDate = new Date();
    const signOffDateMillis = signOffDate.getTime();
    const verificationHash = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();

    const updatedMeta = {
      ...meta,
      isPeriodLocked: true,
      signedOffDate: signOffDate.toISOString(),
      verificationHash: verificationHash,
      signedBy: userId
    };

    await db.update(organization).set({ metadata: updatedMeta }).where(eq(organization.id, orgId));

    const settings: Settings = {
      id: org.id,
      companyName: org.name,
      ceoName: updatedMeta.ceoName || "Direktur Utama",
      cfoName: updatedMeta.cfoName || "Direktur Keuangan",
      fiscalYear: updatedMeta.fiscalYear || updatedMeta.periodYear || new Date().getFullYear(),
      isPeriodLocked: true,
      verificationHash: verificationHash,
      signedOffDate: signOffDateMillis,
    };

    return ok(c, settings);
  });

  app.post('/api/reports/export', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const { format } = await c.req.json<{ format: 'csv' | 'xlsx' }>();

    const [allControls, allRcms, allDeficienciesRecords, allTests] = await Promise.all([
      db.select().from(controls).where(eq(controls.organizationId, orgId)),
      db.select().from(rcms).where(eq(rcms.organizationId, orgId)),
      db.select().from(deficiencies).where(eq(deficiencies.organizationId, orgId)),
      db.select().from(testRecords).where(eq(testRecords.organizationId, orgId))
    ]);

    // Return the combined data. The frontend will handle formatting into CSV or XLSX using 'xlsx' lib.
    return ok(c, {
      controls: allControls,
      rcms: allRcms,
      deficiencies: allDeficienciesRecords,
      tests: allTests,
      exportedAt: new Date().toISOString(),
      format
    });
  });

  // --- ICOFR Routes (RCM Refactored) ---
  
  app.get('/api/rcm', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(rcms).where(eq(rcms.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/rcm', async (c) => {
    const role = c.get('userRole');
    if (role !== 'Line 2' && role !== 'Admin') return bad(c, 'Access Denied');
    
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<RCM>>();
    
    const id = crypto.randomUUID();
    const newRcm = {
      id,
      organizationId: orgId,
      process: body.process || "New Process",
      subProcess: body.subProcess || "New Sub-Process",
      riskDescription: body.riskDescription || "New Risk",
      status: "Draft",
    };

    await db.insert(rcms).values(newRcm);

    // System Audit Log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      action: 'CREATE',
      entityType: 'RCM',
      entityId: id,
      descriptionAfter: `Created RCM: ${newRcm.process}`,
      dataAfter: newRcm,
    });

    return ok(c, newRcm);
  });

  app.put('/api/rcm/:id', async (c) => {
    const role = c.get('userRole');
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<RCM>>();
    const db = getDb(c.env.DATABASE_URL);

    const existing = await db.select().from(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    if (existing.length === 0) return notFound(c, 'RCM not found');

    if (role === 'Line 1') {
      // Logic request change (simplified for now)
      await db.update(rcms).set({ status: 'Pending Change Approval' }).where(eq(rcms.id, id));
      return ok(c, { message: "Change request submitted" });
    }

    if (role !== 'Line 2') return bad(c, 'Access Denied');

    await db.update(rcms).set(body).where(eq(rcms.id, id));

    // Audit Log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      action: 'UPDATE',
      entityType: 'RCM',
      entityId: id,
      descriptionAfter: "Updated RCM details",
      dataBefore: existing[0],
      dataAfter: { ...existing[0], ...body },
    });

    return ok(c, { success: true });
  });

  app.post('/api/rcm/:id/validate', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');

    await db.update(rcms).set({ status: 'Active' }).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(), organizationId: orgId, userId,
      action: 'VALIDATE', entityType: 'RCM', entityId: id,
      descriptionAfter: "RCM Design Validated and Activated",
    });

    return ok(c, { success: true });
  });

  app.post('/api/rcm/:id/approve-change', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');

    await db.update(rcms).set({ status: 'Active' }).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(), organizationId: orgId, userId,
      action: 'APPROVE_CHANGE', entityType: 'RCM', entityId: id,
      descriptionAfter: "RCM Change Approved",
      isRegulatory: true, effectiveDate: new Date(), approvedBy: userId
    });

    return ok(c, { success: true });
  });

  app.delete('/api/rcm/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const id = c.req.param('id');

    // We allow permanent deletion because the frontend shows a warning
    // and the relational links will be deleted via ON DELETE CASCADE.
    await db.delete(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- Controls Refactored ---

  app.get('/api/controls', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(controls).where(eq(controls.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/controls', async (c) => {
    const role = c.get('userRole');
    const userLevel = c.get('userLevel');
    if (role !== 'Line 2' && role !== 'Admin' && role !== 'Line 1') return bad(c, 'Access Denied');
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<Control>>();
    const id = crypto.randomUUID();
    const newControl = {
      id,
      organizationId: orgId,
      rcmId: body.rcmId,
      code: body.code || "CTRL-NEW",
      name: body.name || "New Control",
      description: body.description,
      ownerId: body.ownerId || userId,
      type: body.type || "Preventive",
      nature: body.nature || "Manual",
      frequency: body.frequency || "Monthly",
      bpmStatus: (role === 'Line 1' && userLevel === 'Staff') ? 'Draft' : 'Approved',
      // New worksheet fields
      fsliCodes: body.fsliCodes || [],
      businessProcessLvl1: body.businessProcessLvl1,
      // businessProcessLvl2: body.businessProcessLvl2, // Removed: doesn't exist on type
      subProcess: body.subProcess,
      location: body.location,
      isFraudRelated: body.isFraudRelated || false,
      isKeyControl: body.isKeyControl || false,
      ipos: body.ipos || [],
      assertions: body.assertions || [],
      supportingDocs: body.supportingDocs,
      reference: body.reference,
      applicationId: body.applicationId,
      bpmProcessId: body.bpmProcessId,
    };
    await db.insert(controls).values(newControl);
    return ok(c, newControl);
  });

  app.post('/api/controls/:id/approve', async (c) => {
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const userLevel = c.get('userLevel');
    const db = getDb(c.env.DATABASE_URL);
    if (userLevel !== 'Manager' && c.get('userRole') !== 'Admin') return bad(c, "Only Managers can approve changes");
    await db.update(controls).set({ bpmStatus: 'Approved' }).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(), organizationId: orgId, userId: userId,
      action: 'APPROVE_CHANGE', entityType: 'Control', entityId: id,
      descriptionAfter: "Updated & Approved via Workflow",
      isRegulatory: true, effectiveDate: new Date(), approvedBy: userId
    });
    return ok(c, { success: true });
  });

  app.post('/api/controls/:id/submit-for-approval', async (c) => {
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = getDb(c.env.DATABASE_URL);
    
    await db.update(controls).set({ bpmStatus: 'Pending Approval' }).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(), organizationId: orgId, userId,
      action: 'UPDATE', entityType: 'Control', entityId: id,
      descriptionAfter: "Submitted for approval",
      isRegulatory: true, effectiveDate: new Date()
    });
    
    return ok(c, { success: true });
  });

  app.post('/api/controls/:id/reject', async (c) => {
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const userLevel = c.get('userLevel');
    const db = getDb(c.env.DATABASE_URL);
    
    if (userLevel !== 'Manager' && c.get('userRole') !== 'Admin') return bad(c, "Only Managers can reject changes");
    
    const { note } = await c.req.json<{ note?: string }>();
    
    await db.update(controls).set({ bpmStatus: 'Rejected' }).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(), organizationId: orgId, userId,
      action: 'UPDATE', entityType: 'Control', entityId: id,
      descriptionAfter: `Rejected changes. Note: ${note || 'No note provided'}`,
      isRegulatory: true, effectiveDate: new Date()
    });
    
    return ok(c, { success: true });
  });

  // BPM Control Spreadsheet Update with Auto-Log (Lampiran 6)
  app.put('/api/controls/:id/bpm-update', async (c) => {
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const userLevel = c.get('userLevel');
    const userDeptId = c.get('departmentId');
    
    const db = getDb(c.env.DATABASE_URL);
    const body = await c.req.json<Partial<Control>>();

    const existing = await db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    if (existing.length === 0) return notFound(c, 'Control not found');

    const oldState = existing[0];

    // Validation: Lini 1 can only edit if department matches
    if (userRole === 'Line 1' && oldState.departmentId && oldState.departmentId !== userDeptId) {
      return bad(c, "Access Denied: Control belongs to another department");
    }

    // Set status based on level
    const nextStatus: BPMWorkflowStatus = (userRole === 'Line 1' && userLevel === 'Staff') ? 'Draft' : 'Approved';

    await db.update(controls).set({
      ...body,
      bpmStatus: nextStatus,
    }).where(eq(controls.id, id));

    // Audit Log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      action: 'UPDATE_BPM',
      entityType: 'Control',
      entityId: id,
      descriptionAfter: `Updated BPM Worksheet. Status: ${nextStatus}`,
      dataBefore: oldState,
      dataAfter: { ...oldState, ...body, bpmStatus: nextStatus }
    });

    return ok(c, { success: true, status: nextStatus });
  });

  app.delete('/api/controls/:id', async (c) => {
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const role = c.get('userRole');
    const db = getDb(c.env.DATABASE_URL);

    const existing = await db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    if (existing.length === 0) return notFound(c, 'Control not found');

    const control = existing[0];

    // DECISION 3: Strict Deletion for ELC
    if (control.level === 'ELC') {
      if (role !== 'Admin' && role !== 'Line 2') return bad(c, "Access Denied: Only Admin or Line 2 can delete ELC");

      // Check if any other control links to this ELC ID in their relatedControlIds (jsonb)
      // This is a simplified check for the explore phase, in production we might use specific postgres jsonb operators
      const allControls = await db.select().from(controls).where(eq(controls.organizationId, orgId));
      const isLinked = allControls.some((other: Control) => 
        other.id !== id && 
        other.relatedControlIds && 
        Array.isArray(other.relatedControlIds) && 
        other.relatedControlIds.includes(id)
      );

      if (isLinked) {
        return bad(c, "Cannot delete ELC policy while it is still linked to active Transaction Level Controls.");
      }
    }

    await db.delete(controls).where(eq(controls.id, id));
    
    // Also cleanup junction table rcmControls
    await db.delete(rcmControls).where(eq(rcmControls.controlId, id));

    return ok(c, { success: true });
  });

  // --- Simulations Refactored ---

  app.get('/api/simulations', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(simulations).where(eq(simulations.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/simulations', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<MaterialitySimulation>>();
    const id = crypto.randomUUID();
    const newSim = {
      id, organizationId: orgId,
      name: body.name || "New Simulation",
      year: body.year || new Date().getFullYear(),
      status: "Draft" as any,
      omValue: body.omValue || 0,
      pmValue: body.pmValue || 0,
      glSnapshotId: body.glSnapshotId,
      locationCount: body.locationCount || 1,
      omPercentage: body.omPercentage ?? 5,
      haircutPercentage: body.haircutPercentage ?? 25,
      basis: body.basis || "Revenue",
      createdAt: new Date(),
      createdBy: userId,
    };
    await db.insert(simulations).values(newSim);
    return ok(c, newSim);
  });

  app.put('/api/simulations/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<Partial<MaterialitySimulation>>();
    
    // Explicitly pick fields to update to avoid metadata/type mismatches
    await db.update(simulations)
      .set({
        name: body.name,
        basis: body.basis,
        omPercentage: body.omPercentage,
        haircutPercentage: body.haircutPercentage,
        locationCount: body.locationCount,
        omValue: body.omValue,
        pmValue: body.pmValue,
        significantAccounts: body.significantAccounts,
        assessmentData: body.assessmentData,
        updatedAt: new Date(),
      })
      .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
    
    return ok(c, { success: true });
  });

  app.post('/api/simulations/:id/submit', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<Partial<MaterialitySimulation>>();
    
    await db.update(simulations)
      .set({ 
        status: 'Pending CFO', 
        updatedAt: new Date(),
        omValue: body.omValue,
        pmValue: body.pmValue,
        significantAccounts: body.significantAccounts
      })
      .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
      
    const updated = await db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
    return ok(c, updated[0]);
  });

  app.post('/api/scoping/assign-department', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const body = await c.req.json<{ scopingId: string, accountName: string, departmentId: string }>();

    // 1. Find the simulation to get the snapshot ID
    const [sim] = await db.select()
      .from(simulations)
      .where(and(
        eq(simulations.id, body.scopingId),
        eq(simulations.organizationId, orgId)
      ))
      .limit(1);

    if (!sim) return notFound(c, 'Simulation not found');
    if (!sim.glSnapshotId) return bad(c, 'Simulation has no associated snapshot');

    // 2. Update all rows with this account number in that snapshot
    // Frontend sends noGL as accountName
    await db.update(glRows)
      .set({ assignedDepartmentId: body.departmentId })
      .where(and(
        eq(glRows.snapshotId, sim.glSnapshotId),
        eq(glRows.noGL, body.accountName),
        eq(glRows.organizationId, orgId)
      ));

    // 3. Log the action
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: c.get('userId'),
      action: 'ASSIGN_DEPARTMENT',
      entityType: 'GL_Account',
      entityId: `${sim.glSnapshotId}:${body.accountName}`,
      descriptionAfter: `Assigned department ${body.departmentId} to account ${body.accountName}`,
      dataAfter: body
    });

    return ok(c, { success: true });
  });

  app.delete('/api/simulations/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    
    await db.delete(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- BPM Diagram Routes ---

  app.get('/api/bpm-diagrams', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(bpmDiagrams).where(eq(bpmDiagrams.organizationId, orgId));
    return ok(c, { items });
  });

  app.get('/api/bpm-diagrams/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const diags = await db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
    if (diags.length === 0) return notFound(c);
    
    const diag = diags[0];
    const nodes = diag.nodes || [];

    // Hydrate Activity nodes with risks/controls from junction tables
    const hydratedNodes = await Promise.all(nodes.map(async (node: any) => {
      if (node.type === 'activity' || node.type === 'automated-activity') {
        // Fetch risks linked to this node
        const nodeRisks = await db.select().from(bpmNodeRcms).where(and(
          eq(bpmNodeRcms.diagramId, id),
          eq(bpmNodeRcms.nodeId, node.id)
        ));

        const risks = await Promise.all(nodeRisks.map(async (nr: any) => {
          // Fetch controls linked to each risk
          const riskControls = await db.select().from(rcmControls).where(eq(rcmControls.rcmId, nr.rcmId));
          return {
            rcmId: nr.rcmId,
            controlIds: riskControls.map((rc: any) => rc.controlId)
          };
        }));

        return {
          ...node,
          data: {
            ...node.data,
            risks
          }
        };
      }
      return node;
    }));

    return ok(c, {
      ...diag,
      nodes: hydratedNodes
    });
  });

  app.post('/api/bpm-diagrams', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<any>();
    const id = crypto.randomUUID();
    const newDiagram = {
      id,
      organizationId: orgId,
      name: body.name || "New Diagram",
      subProcess: body.subProcess,
      nodes: body.nodes || [],
      edges: body.edges || [],
      createdAt: new Date(),
      createdBy: userId,
    };
    await db.insert(bpmDiagrams).values(newDiagram);
    return ok(c, newDiagram);
  });

  app.put('/api/bpm-diagrams/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<any>();

    // 1. Update the diagram layout (JSON)
    await db.update(bpmDiagrams)
      .set({
        name: body.name,
        nodes: body.nodes,
        edges: body.edges,
        updatedAt: new Date(),
      })
      .where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));

    // 2. Sync Relational Tables (Transaction-like)
    // First, clear existing links for this diagram
    await db.delete(bpmNodeRcms).where(eq(bpmNodeRcms.diagramId, id));

    // Extract links from nodes
    const nodes = body.nodes || [];
    for (const node of nodes) {
      if ((node.type === 'activity' || node.type === 'automated-activity') && node.data?.risks) {
        for (const riskEntry of node.data.risks) {
          // riskEntry = { rcmId: string, controlIds: string[] }
          
          // Link Activity Node -> Risk
          await db.insert(bpmNodeRcms).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            diagramId: id,
            nodeId: node.id,
            rcmId: riskEntry.rcmId
          });

          // Link Risk -> Controls
          if (riskEntry.controlIds && riskEntry.controlIds.length > 0) {
            for (const ctrlId of riskEntry.controlIds) {
              // Check if link already exists to avoid unique constraint violations
              const existing = await db.select().from(rcmControls).where(and(
                eq(rcmControls.rcmId, riskEntry.rcmId),
                eq(rcmControls.controlId, ctrlId),
                eq(rcmControls.organizationId, orgId)
              ));
              
              if (existing.length === 0) {
                await db.insert(rcmControls).values({
                  id: crypto.randomUUID(),
                  organizationId: orgId,
                  rcmId: riskEntry.rcmId,
                  controlId: ctrlId
                });
              }
            }
          }
        }
      }
    }

    return ok(c, { success: true });
  });

  app.delete('/api/bpm-diagrams/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    await db.delete(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- BPM Process Routes ---

  app.get('/api/bpm-processes', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const noGL = c.req.query('noGL');

    const query = db.select({
      id: bpmProcesses.id,
      organizationId: bpmProcesses.organizationId,
      noGL: bpmProcesses.noGL,
      fsliName: bpmProcesses.fsliName,
      name: bpmProcesses.name,
      createdAt: bpmProcesses.createdAt,
      createdBy: bpmProcesses.createdBy,
      controlCount: sql<number>`count(${controls.id})`,
      riskCount: sql<number>`count(${controls.id}) FILTER (WHERE ${controls.isFraudRelated} = true)`
    })
    .from(bpmProcesses)
    .leftJoin(controls, eq(bpmProcesses.id, controls.bpmProcessId))
    .where(eq(bpmProcesses.organizationId, orgId));

    if (noGL) {
      const items = await query.where(and(
        eq(bpmProcesses.organizationId, orgId),
        eq(bpmProcesses.noGL, noGL)
      )).groupBy(bpmProcesses.id);
      return ok(c, { items });
    }

    const items = await query.groupBy(bpmProcesses.id);
    return ok(c, { items });
  });

  app.post('/api/bpm-processes', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<BPMProcess>>();
    
    const id = crypto.randomUUID();
    const newProcess = {
      id,
      organizationId: orgId,
      noGL: body.noGL || "",
      fsliName: body.fsliName || "",
      name: body.name || "New Process",
      createdAt: new Date(),
      createdBy: userId,
    };

    await db.insert(bpmProcesses).values(newProcess);

    // Audit Log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      action: 'CREATE',
      entityType: 'BPMProcess',
      entityId: id,
      descriptionAfter: `Created BPM Process: ${newProcess.name}`,
      dataAfter: newProcess,
    });

    return ok(c, newProcess);
  });

  app.delete('/api/bpm-processes/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    await db.delete(bpmProcesses).where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- Applications Routes ---

  app.get('/api/applications', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(applications).where(eq(applications.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/applications', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const body = await c.req.json<Partial<Application>>();
    const id = crypto.randomUUID();
    const newApp = {
      id,
      organizationId: orgId,
      name: body.name || "New Application",
      description: body.description || "",
      statusItgc: (body as any).statusItgc || "Not Tested",
      criticality: body.criticality || "Medium",
    };
    await db.insert(applications).values(newApp);
    return ok(c, newApp);
  });

  app.put('/api/applications/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<Partial<Application>>();
    await db.update(applications)
      .set({
        name: body.name,
        description: body.description,
        statusItgc: (body as any).statusItgc,
        criticality: body.criticality,
      })
      .where(and(eq(applications.id, id), eq(applications.organizationId, orgId)));
    return ok(c, { success: true });
  });

  app.delete('/api/applications/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    await db.delete(applications).where(and(eq(applications.id, id), eq(applications.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- GL Snapshots Refactored ---

  app.get('/api/gl-snapshots', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    
    // Get snapshots with pre-calculated row counts
    const items = await db.select({
      id: glSnapshots.id,
      organizationId: glSnapshots.organizationId,
      filename: glSnapshots.filename,
      uploadDate: glSnapshots.uploadDate,
      status: glSnapshots.status,
      isActive: glSnapshots.isActive,
      benchmarkFsliNames: glSnapshots.benchmarkFsliNames,
      rowCount: sql<number>`count(${glRows.id})`
    })
    .from(glSnapshots)
    .leftJoin(glRows, eq(glRows.snapshotId, glSnapshots.id))
    .where(eq(glSnapshots.organizationId, orgId))
    .groupBy(glSnapshots.id)
    .orderBy(desc(glSnapshots.uploadDate));

    return ok(c, { items });
  });

  app.post('/api/gl-snapshots', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<{ filename: string, rows?: any[], fileContent?: string }>();
    
    // 1. Create Snapshot Record
    const snapshotId = crypto.randomUUID();
    const newSnapshot = {
      id: snapshotId,
      organizationId: orgId,
      filename: body.filename || "upload.csv",
      uploadDate: new Date(),
      status: "Draft",
      isActive: false,
    };

    await db.insert(glSnapshots).values(newSnapshot);

    // Auto-set active if it's the first snapshot for this organization
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(glSnapshots).where(eq(glSnapshots.organizationId, orgId));
    if (Number(countResult[0]?.count || 0) <= 1) {
      await db.update(glSnapshots).set({ isActive: true }).where(eq(glSnapshots.id, snapshotId));
    }

    let rowsToInsert: any[] = [];

    // 2. Handle either direct rows (current frontend) or fileContent (agnostic server)
    if (body.rows && Array.isArray(body.rows)) {
      rowsToInsert = body.rows.map((row: any) => ({
        id: crypto.randomUUID(),
        snapshotId: snapshotId,
        organizationId: orgId,
        ymd: row.ymd,
        entityCode: row.entityCode,
        noGL: row.noGL,
        glDesc: row.glDesc,
        currency: row.currency,
        balance: row.balance,
        fsliCode: row.fsliCode,
        fsliName: row.fsliName,
        category: row.kategori,
        subKategori: row.subKategori,
      }));
    } else if (body.fileContent) {
      const parsed = parseCsv<any>(body.fileContent, { header: true, delimiter: ';' });
      rowsToInsert = parsed.data.map((row: any) => ({
        id: crypto.randomUUID(),
        snapshotId: snapshotId,
        organizationId: orgId,
        ymd: row.YMD,
        entityCode: row.Kode_Entity,
        noGL: row.No_GL,
        glDesc: row.GL_Desc,
        currency: row.Kode_Valuta,
        balance: parseFloat(String(row.GL_Balance || '0').replace(/[(),]/g, '').trim()) * (String(row.GL_Balance).includes('(') ? -1 : 1),
        fsliCode: row.Kode_FSLI,
        fsliName: row.FSLI,
        category: row.Kategori,
        subKategori: row.Sub_Kategori,
      }));
    }

    // 3. Batch Insert Rows
    if (rowsToInsert.length > 0) {
      for (let i = 0; i < rowsToInsert.length; i += 1000) {
        await db.insert(glRows).values(rowsToInsert.slice(i, i + 1000));
      }
    }

    return ok(c, { ...newSnapshot, count: rowsToInsert.length });
  });

  app.get('/api/gl-snapshots/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    const snap = await db.select().from(glSnapshots).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));
    if (snap.length === 0) return notFound(c);

    const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, id));

    return ok(c, { ...snap[0], rows });
  });

  app.put('/api/gl-snapshots/:id/mapping', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<{ benchmarkFsliNames: string[] }>();

    await db.update(glSnapshots).set({ 
      benchmarkFsliNames: body.benchmarkFsliNames,
      status: 'Mapped' 
    }).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));

    return ok(c, { success: true });
  });

  app.post('/api/gl-snapshots/:id/set-active', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    // 1. Deactivate all snapshots for this organization
    await db.update(glSnapshots)
      .set({ isActive: false })
      .where(eq(glSnapshots.organizationId, orgId));

    // 2. Activate the target snapshot
    await db.update(glSnapshots)
      .set({ isActive: true })
      .where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));

    return ok(c, { success: true });
  });

  app.delete('/api/gl-snapshots/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    // Cascading delete rows manually if needed, but Drizzle references can handle it if configured
    await db.delete(glRows).where(eq(glRows.snapshotId, id));
    await db.delete(glSnapshots).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));

    return ok(c, { success: true });
  });

  // Update owner acceptance for a GL account
  app.put('/api/gl-rows/:noGL/owner-acceptance', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const noGL = c.req.param('noGL');
    const body = await c.req.json<{ ownerAcceptance: "Accepted" | "Rejected" }>();

    // Get the active snapshot
    const [activeSnapshot] = await db
      .select({ id: glSnapshots.id })
      .from(glSnapshots)
      .where(and(
        eq(glSnapshots.organizationId, orgId),
        eq(glSnapshots.isActive, true)
      ))
      .limit(1);

    if (!activeSnapshot) {
      return c.json({ error: 'No active snapshot found' }, 404);
    }

    // Update the owner acceptance
    await db
      .update(glRows)
      .set({ ownerAcceptance: body.ownerAcceptance })
      .where(and(
        eq(glRows.noGL, noGL),
        eq(glRows.snapshotId, activeSnapshot.id),
        eq(glRows.organizationId, orgId)
      ));

    return ok(c, { success: true });
  });

  // --- Reporting & Aggregation Refactored ---

  app.get('/api/reports/summary', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');

    const [controlCount, rcmCount, allDeficiencyRecords] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(controls).where(eq(controls.organizationId, orgId)),
      db.select({ count: sql<number>`count(*)` }).from(rcms).where(eq(rcms.organizationId, orgId)),
      db.select().from(deficiencies).where(eq(deficiencies.organizationId, orgId))
    ]);

    const deficienciesBySeverity = [
      { name: 'Control Deficiency', count: allDeficiencyRecords.filter((d: Deficiency) => d.severity === 'Control Deficiency').length },
      { name: 'Significant Deficiency', count: allDeficiencyRecords.filter((d: Deficiency) => d.severity === 'Significant Deficiency').length },
      { name: 'Material Weakness', count: allDeficiencyRecords.filter((d: Deficiency) => d.severity === 'Material Weakness').length },
    ];

    const deficienciesByStatus = [
      { name: 'Open', count: allDeficiencyRecords.filter((d: Deficiency) => d.status === 'Open').length },
      { name: 'Remediated', count: allDeficiencyRecords.filter((d: Deficiency) => d.status === 'Remediated').length },
      { name: 'Verified', count: allDeficiencyRecords.filter((d: Deficiency) => d.status === 'Verified').length },
      { name: 'Closed', count: allDeficiencyRecords.filter((d: Deficiency) => d.status === 'Closed').length },
    ];

    const openCount = allDeficiencyRecords.filter((d: Deficiency) => d.status === 'Open').length;
    const hasMaterialWeakness = allDeficiencyRecords.some((d: Deficiency) => d.severity === 'Material Weakness');
    const effectiveness = hasMaterialWeakness ? 0 : 100; // Simplified logic for summary

    return ok(c, {
      totalControls: Number(controlCount[0]?.count || 0),
      totalRcm: Number(rcmCount[0]?.count || 0),
      openDeficiencies: openCount,
      effectiveness,
      deficienciesBySeverity,
      deficienciesByStatus,
      allDeficiencies: allDeficiencyRecords
    });
  });

  // --- CSA & Testing Refactored (Smart CSA) ---

  app.get('/api/csa', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const controlId = c.req.query('controlId');

    let query = db.select().from(csaRecords).where(eq(csaRecords.organizationId, orgId));
    
    if (controlId) {
      query = db.select().from(csaRecords).where(and(
        eq(csaRecords.organizationId, orgId),
        eq(csaRecords.controlId, controlId)
      ));
    }

    const items = await query.orderBy(desc(csaRecords.assessmentDate));
    return ok(c, { items });
  });

  app.get('/api/csa/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    const records = await db.select().from(csaRecords).where(and(
      eq(csaRecords.id, id),
      eq(csaRecords.organizationId, orgId)
    )).limit(1);

    if (records.length === 0) return notFound(c, 'CSA Record not found');

    const record = records[0];
    const samplesData = await db.select().from(csaSamples).where(eq(csaSamples.csaRecordId, id));

    return ok(c, {
      ...record,
      samples: samplesData.map((s: any) => ({
        id: s.id,
        sampleRef: s.sampleRef,
        attributeResults: { A: s.attrA, B: s.attrB, C: s.attrC, D: s.attrD },
        itacResults: { expectedResult: s.itacExpectedResult, actualResult: s.itacActualResult, isMatch: s.itacMatch }
      }))
    });
  });

  app.post('/api/csa', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<CSARecord>>();
    
    const id = crypto.randomUUID();
    const assessmentDate = new Date();

    const newCsa = {
      id,
      organizationId: orgId,
      controlId: body.controlId!,
      period: body.period || "2024-Q1",
      assessmentDate,
      assessedBy: userId,
      result: body.result || "Effective",
      comments: body.comments,

      // Summary Regulatory Fields (Calculated from samples on frontend usually, but stored here)
      attrA: body.attrA ?? false,
      attrB: body.attrB ?? false,
      attrC: body.attrC ?? false,
      attrD: body.attrD ?? false,

      // Forensic Metadata
      gpsVerified: body.gpsVerified ?? false,
      latitude: body.latitude,
      longitude: body.longitude,
      timestampVerified: body.timestampVerified ?? false,
      capturedAt: body.capturedAt ? new Date(body.capturedAt) : null,
      hash: body.hash,
      biometricVerified: body.biometricVerified ?? false,

      // ITAC Metadata
      itacScenario: body.itacScenario,
      itacMethod: body.itacMethod,
      itacSampleInfo: body.itacSampleInfo,
    };

    // 1. Insert Record
    await db.insert(csaRecords).values(newCsa);

    // 2. Insert Samples
    if (body.samples && Array.isArray(body.samples)) {
      for (const sample of body.samples) {
        await db.insert(csaSamples).values({
          id: crypto.randomUUID(),
          organizationId: orgId,
          csaRecordId: id,
          sampleRef: sample.sampleRef,
          attrA: sample.attributeResults?.A ?? false,
          attrB: sample.attributeResults?.B ?? false,
          attrC: sample.attributeResults?.C ?? false,
          attrD: sample.attributeResults?.D ?? false,
          itacExpectedResult: sample.itacResults?.expectedResult,
          itacActualResult: sample.itacResults?.actualResult,
          itacMatch: sample.itacResults?.isMatch ?? false,
        });
      }
    }

    // 3. Auto-Deficiency logic
    if (newCsa.result === 'Ineffective') {
        await db.insert(deficiencies).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            controlId: newCsa.controlId,
            description: `CSA result for ${newCsa.period} is Ineffective. Comments: ${newCsa.comments || 'No comments provided.'}`,
            severity: 'Control Deficiency',
            identifiedDate: assessmentDate,
            identifiedBy: userId,
            status: 'Open'
        });
    }

    // 4. Audit Log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      action: 'SIGN_OFF_CSA',
      entityType: 'Control',
      entityId: newCsa.controlId,
      descriptionAfter: `Completed CSA for ${newCsa.period} with result: ${newCsa.result}`,
      dataAfter: { csaId: id, ...newCsa },
      isRegulatory: true,
      effectiveDate: assessmentDate,
      approvedBy: userId
    });

    return ok(c, newCsa);
  });

  app.get('/api/csa/:id/export-pdf', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    const records = await db.select().from(csaRecords).where(and(
      eq(csaRecords.id, id),
      eq(csaRecords.organizationId, orgId)
    )).limit(1);

    if (records.length === 0) return notFound(c, 'CSA Record not found');
    const record = records[0];
    
    const controlRes = await db.select().from(controls).where(eq(controls.id, record.controlId)).limit(1);
    const control = controlRes[0];
    const samplesData = await db.select().from(csaSamples).where(eq(csaSamples.csaRecordId, id));

    try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(16);
        doc.text('CONTROL SELF-ASSESSMENT (CSA)', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text('Regulasi BUMN SK-5/DKU.MBU/11/2024 - Lampiran 7', 105, 27, { align: 'center' });
        
        doc.line(10, 35, 200, 35);
        
        // Section I: General Info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('I. INFORMASI UMUM', 10, 45);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Key Control No: ${control?.code || 'N/A'}`, 15, 52);
        doc.text(`Nama Aktivitas: ${control?.name || 'N/A'}`, 15, 58);
        doc.text(`Periode Pengujian: ${record.period}`, 15, 64);
        doc.text(`Tanggal Asesmen: ${record.assessmentDate.toLocaleDateString()}`, 15, 70);
        doc.text(`Kesimpulan: ${record.result}`, 15, 76);

        // Section II: Procedure (Placeholder based on PDF)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('II. PROSEDUR PENGUJIAN', 10, 88);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Metode: Atribut Sampling / Zero Tolerance Approach', 15, 95);
        
        // Section III: Testing Table
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('III. HASIL PENGUJIAN SAMPEL', 10, 110);
        
        // Table Header
        let y = 118;
        doc.setFontSize(9);
        doc.rect(10, y-5, 190, 8);
        doc.text('No', 12, y);
        doc.text('Referensi Sampel', 25, y);
        doc.text('Attr A', 90, y);
        doc.text('Attr B', 110, y);
        doc.text('Attr C', 130, y);
        doc.text('Attr D', 150, y);
        doc.text('ITAC Result', 170, y);
        
        y += 10;
        samplesData.forEach((s: any, i: number) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(`${i + 1}`, 12, y);
            doc.text(`${s.sampleRef || '-'}`, 25, y);
            doc.text(`${s.attrA ? 'Pass' : 'Fail'}`, 90, y);
            doc.text(`${s.attrB ? 'Pass' : 'Fail'}`, 110, y);
            doc.text(`${s.attrC ? 'Pass' : 'Fail'}`, 130, y);
            doc.text(`${s.attrD ? 'Pass' : 'Fail'}`, 150, y);
            doc.text(`${s.itacMatch ? 'Match' : (s.itacActualResult ? 'Mismatch' : '-')}`, 170, y);
            y += 8;
        });

        // Section IV: Sign-off
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('IV. KESIMPULAN & SIGN-OFF', 10, y + 10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Komentar: ${record.comments || 'Tidak ada komentar.'}`, 15, y + 18, { maxWidth: 180 });
        
        y += 40;
        doc.text('Disertifikasi Oleh (Lini Pertama):', 150, y, { align: 'center' });
        doc.setFontSize(8);
        doc.text('(Digitally Signed via IndoGRC Pro)', 150, y + 5, { align: 'center' });
        doc.text(`Hash: ${record.hash || 'N/A'}`, 150, y + 10, { align: 'center' });

        const pdfOutput = doc.output('arraybuffer');
        return new Response(pdfOutput, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="CSA_${control?.code}_${record.period}.pdf"`
            }
        });
    } catch (err: any) {
        console.error('PDF Gen Error:', err);
        return bad(c, `Failed to generate PDF: ${err.message}`);
    }
  });

  app.get('/api/tests', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(testRecords).where(eq(testRecords.organizationId, orgId));
    return ok(c, { items });
  });

  // --- Legacy/Support Routes ---

  app.get('/api/changelogs', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(auditLogs).where(and(eq(auditLogs.organizationId, orgId), eq(auditLogs.isRegulatory, true)));
    return ok(c, { items });
  });

  app.get('/api/socreports', async (c) => {
    // Mock for now as it's usually static/uploaded docs
    return ok(c, { items: [] });
  });

  app.get('/api/wbsreports', async (c) => {
    // Integration with WBS (Lampiran 1 Principle 14 & 15)
    return ok(c, { items: [] });
  });

  // --- DEV TOOLS (Purge) ---

  app.delete('/api/dev/purge-scoping', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    
    await db.delete(glRows).where(eq(glRows.organizationId, orgId));
    await db.delete(glSnapshots).where(eq(glSnapshots.organizationId, orgId));
    await db.delete(simulations).where(eq(simulations.organizationId, orgId));
    
    return ok(c, { success: true });
  });

  app.delete('/api/dev/purge-bpm', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    
    await db.delete(bpmDiagrams).where(eq(bpmDiagrams.organizationId, orgId));
    await db.delete(rcms).where(eq(rcms.organizationId, orgId));
    await db.delete(controls).where(eq(controls.organizationId, orgId));
    
    return ok(c, { success: true });
  });

  app.get('/api/bpm/usage-check/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const id = c.req.param('id');
    const type = c.req.query('type') as 'Risk' | 'Control';

    // We need to scan all diagrams to see if any node contains this ID in its data.riskIds or data.controlIds
    const diagrams = await db.select().from(bpmDiagrams).where(eq(bpmDiagrams.organizationId, orgId));
    
    const usage: { diagramId: string, diagramName: string, nodeId: string, nodeLabel: string }[] = [];

    for (const diag of diagrams) {
      const nodes = (diag.nodes as any[]) || [];
      for (const node of nodes) {
        if (type === 'Risk') {
          if (node.data?.riskIds?.includes(id)) {
            usage.push({ diagramId: diag.id, diagramName: diag.name, nodeId: node.id, nodeLabel: node.data.label });
          }
        } else {
          if (node.data?.controlIds?.includes(id)) {
            usage.push({ diagramId: diag.id, diagramName: diag.name, nodeId: node.id, nodeLabel: node.data.label });
          }
        }
      }
    }

    return ok(c, { count: usage.length, usage });
  });

  app.get('/api/bpm-diagrams/by-control/:controlId', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const controlId = c.req.param('controlId');

    // 1. Find the risk(s) linked to this control
    const links = await db.select().from(rcmControls).where(and(
      eq(rcmControls.controlId, controlId),
      eq(rcmControls.organizationId, orgId)
    ));

    if (links.length === 0) return notFound(c, 'Control not linked to any risk');

    // 2. Find the diagram node(s) linked to those risk(s)
    const riskIds = links.map((l: any) => l.rcmId);
    const nodeLinks = await db.select().from(bpmNodeRcms).where(and(
      sql`${bpmNodeRcms.rcmId} IN ${riskIds}`,
      eq(bpmNodeRcms.organizationId, orgId)
    ));

    if (nodeLinks.length === 0) return notFound(c, 'Risk not linked to any diagram node');

    // For now, return the first diagram found
    const firstLink = nodeLinks[0];
    const diag = await db.select().from(bpmDiagrams).where(and(
      eq(bpmDiagrams.id, firstLink.diagramId),
      eq(bpmDiagrams.organizationId, orgId)
    )).limit(1);

    if (diag.length === 0) return notFound(c, 'Diagram not found');

    return ok(c, {
      diagram: diag[0],
      nodeId: firstLink.nodeId
    });
  });

  app.get('/api/bpm-diagrams/by-gl/:noGL', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const noGL = c.req.param('noGL');

    // 1. Find the BPM Process linked to this GL
    const processes = await db.select().from(bpmProcesses)
      .where(and(
        eq(bpmProcesses.organizationId, orgId),
        eq(bpmProcesses.noGL, noGL)
      )).limit(1);

    if (processes.length === 0) return notFound(c, 'No BPM process linked to this account');

    const process = processes[0];

    // 2. Find the diagram that matches this process name/subprocess
    const diagrams = await db.select().from(bpmDiagrams)
      .where(and(
        eq(bpmDiagrams.organizationId, orgId),
        eq(bpmDiagrams.subProcess, process.name)
      )).limit(1);

    if (diagrams.length === 0) {
        // Fallback: try matching by name
        const byName = await db.select().from(bpmDiagrams)
            .where(and(
                eq(bpmDiagrams.organizationId, orgId),
                eq(bpmDiagrams.name, process.name)
            )).limit(1);
        
        if (byName.length === 0) return notFound(c, 'Diagram not found for this process');
        return ok(c, byName[0]);
    }

    return ok(c, diagrams[0]);
  });

  // --- Knowledge Base Document Routes ---

  app.get('/api/documents', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const role = c.get('userRole');
    const userDeptId = c.get('departmentId');

    // Case 1: Line 1 - Strict isolation
    if (role === 'Line 1') {
      const docs = await db.execute(sql`
        SELECT DISTINCT d.* 
        FROM documents d
        LEFT JOIN document_departments dd ON d.id = dd.document_id
        WHERE d.organization_id = ${orgId}
        AND (
          d.type = 'External' 
          OR (d.type = 'Internal' AND (dd.department_id = ${userDeptId}))
        )
        ORDER BY d.created_at DESC
      `);
      return ok(c, { items: docs.rows });
    }

    // Case 2: Admin, Line 2, Line 3 - Global View
    // We remove the organizationId filter so everything is visible
    console.log('[API] GET /api/documents - Admin/Lini2/3 Global Fetch');
    const items = await db.select().from(documents)
      .orderBy(desc(documents.createdAt));
    
    console.log(`[API] Found ${items.length} documents in total`);
    if (items.length > 0) {
      console.log('[API] Sample Item:', { id: items[0].id, type: items[0].type, org: items[0].organizationId });
    }

    return ok(c, { items });
  });

  app.post('/api/documents', async (c) => {
    console.log('[API] Document Upload Started');
    const role = c.get('userRole');
    if (role !== 'Admin' && role !== 'Line 2') return bad(c, 'Access Denied');

    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      if (!file) return bad(c, 'File is required');

      const title = formData.get('title') as string;
      const type = formData.get('type') as string;
      const category = formData.get('category') as string;
      const deptIds = JSON.parse(formData.get('departmentIds') as string || '[]');
      const glCodes = JSON.parse(formData.get('glCodes') as string || '[]');
      const fsliCodes = JSON.parse(formData.get('fsliCodes') as string || '[]');

      // IMPORTANT: Read stream only ONCE.
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Extract text using unpdf with robust font support
      let extractedText = "";
      try {
        console.log('[API] Extracting text with CMaps support...');
        // We use CDN for CMaps to keep worker bundle small but extraction accurate
        const pdf = await getDocumentProxy(uint8Array, {
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/",
        });
        
        const result = await extractText(pdf, { mergePages: true });
        extractedText = result.text || "";
        console.log('[API] Text extracted successfully, length:', extractedText.length);
      } catch (e: any) {
        console.error('[API] PDF extraction failed:', e.message);
        // Continue with empty text rather than failing upload
      }

      // Store in R2 (Using the buffer we already read)
      const key = `docs/${orgId}/${crypto.randomUUID()}-${file.name}`;
      console.log('[API] Saving to R2:', key);
      await c.env.DOCUMENTS_BUCKET.put(key, arrayBuffer, {
        httpMetadata: { contentType: file.type }
      });

      const docId = crypto.randomUUID();
      const newDoc = {
        id: docId,
        organizationId: orgId,
        title: title || file.name,
        type,
        category,
        content: extractedText,
        fileUrl: key,
        createdBy: userId,
        createdAt: new Date(),
      };

      await db.insert(documents).values(newDoc);

      // Junctions
      for (const dId of deptIds) {
        await db.insert(documentDepartments).values({ id: crypto.randomUUID(), organizationId: orgId, documentId: docId, departmentId: dId });
      }
      for (const gCode of glCodes) {
        await db.insert(documentGls).values({ id: crypto.randomUUID(), organizationId: orgId, documentId: docId, glCode: gCode });
      }
      for (const fCode of fsliCodes) {
        await db.insert(documentFslis).values({ id: crypto.randomUUID(), organizationId: orgId, documentId: docId, fsliCode: fCode });
      }

      console.log('[API] Upload success:', docId);
      return ok(c, { ...newDoc, success: true });

    } catch (error: any) {
      console.error('[API] Fatal Upload Error:', error);
      return bad(c, `Upload failed: ${error.message}`, 500);
    }
  });

  app.delete('/api/documents/:id', async (c) => {
    const role = c.get('userRole');
    if (role !== 'Admin' && role !== 'Line 2') return bad(c, 'Access Denied: Only Admin or Line 2 can delete documents');

    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    const existing = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.organizationId, orgId))).limit(1);
    if (existing.length === 0) return notFound(c);

    // Delete from R2
    if (existing[0].fileUrl) {
      await c.env.DOCUMENTS_BUCKET.delete(existing[0].fileUrl);
    }

    // Delete from DB
    await db.delete(documents).where(eq(documents.id, id));
    
    return ok(c, { success: true });
  });

  app.get('/api/documents/download/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const mode = c.req.query('mode');

    const existing = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.organizationId, orgId))).limit(1);
    if (existing.length === 0) return notFound(c);

    if (!existing[0].fileUrl) return bad(c, 'File not found');

    const object = await c.env.DOCUMENTS_BUCKET.get(existing[0].fileUrl);
    if (!object) return notFound(c, 'File not found in storage');

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    
    if (mode === 'view') {
      headers.set('Content-Disposition', 'inline');
    } else {
      headers.set('Content-Disposition', `attachment; filename="${existing[0].title}.pdf"`);
    }

    return new Response(object.body, { headers });
  });

  // --- AI Chatbot Routes ---

  const rateLimitStore = new Map<string, { count: number; resetDate: number }>();

  app.post('/api/ai/chat', async (c) => {
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return bad(c, 'GEMINI_API_KEY not configured.');
    }

    let body: { message: string; conversationHistory?: Array<{ role: string; content: string }> };
    try {
      body = await c.req.json();
    } catch (e) {
      return bad(c, 'Invalid request body');
    }

    const { message, conversationHistory = [] } = body;

    const clientId = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const dayMs = 86400000;

    let rateLimitData = rateLimitStore.get(clientId);
    if (!rateLimitData || now > rateLimitData.resetDate) {
      rateLimitData = { count: 0, resetDate: now + dayMs };
      rateLimitStore.set(clientId, rateLimitData);
    }

    if (rateLimitData.count >= 100) {
      return bad(c, 'Rate limit exceeded.', 429);
    }

    rateLimitData.count++;

    const context = (body as any).context;
    const pageContext = context?.path ? `\nPengguna saat ini sedang melihat halaman: ${context.path}` : '';

    const role = c.get('userRole');
    const userDeptId = c.get('departmentId');
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');

    // --- Dynamic Knowledge Retrieval ---
    let relevantDocs: any[] = [];
    try {
      if (role === 'Line 1') {
        const docsResult = await db.execute(sql`
          SELECT DISTINCT d.content, d.title
          FROM documents d
          LEFT JOIN document_departments dd ON d.id = dd.document_id
          WHERE d.organization_id = ${orgId}
          AND (
            d.type = 'External' 
            OR (d.type = 'Internal' AND dd.department_id = ${userDeptId})
          )
        `);
        relevantDocs = docsResult.rows;
      } else {
        relevantDocs = await db.select({ content: documents.content, title: documents.title })
          .from(documents)
          .where(eq(documents.organizationId, orgId));
      }
    } catch (e) {
      console.error('Failed to fetch dynamic knowledge:', e);
    }

    const dynamicKnowledge = relevantDocs
      .filter(d => d.content)
      .map(d => `--- DOKUMEN: ${d.title} ---\n${d.content}\n`)
      .join('\n\n');

    // Use dynamic knowledge, fallback to hardcoded if empty (for transition)
    const knowledgeBase = dynamicKnowledge || ICOFR_KNOWLEDGE_BASE;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: `Anda adalah Asisten AI ICOFR yang membantu pengguna memahami regulasi Pengendalian Internal atas Pelaporan Keuangan (ICOFR) berdasarkan dokumen perusahaan dan regulasi pemerintah.

Jawablah pertanyaan dengan akurat berdasarkan dokumen yang disediakan di bawah ini.
Jika dokumen menyebutkan nomor pasal atau bab, sertakan dalam jawaban.
${pageContext}

Jika pertanyaan tidak terkait ICOFR atau dokumen yang disediakan, jawab dengan sopan bahwa Anda hanya dapat membantu pertanyaan terkait ICOFR sesuai dokumen yang Anda miliki.

Bahasa: Bahasa Indonesia

--- KNOWLEDGE BASE ---
${knowledgeBase}
--- END KNOWLEDGE BASE ---`
      });

      const recentHistory = conversationHistory.slice(-10);
      const chat = model.startChat({
        history: recentHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const responseText = response.text();

      return ok(c, {
        response: responseText,
        sources: []
      });

    } catch (error: any) {
      return bad(c, `AI service error: ${error.message}`, 500);
    }
  });
}