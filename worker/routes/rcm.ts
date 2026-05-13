import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb, type DrizzleDb } from '../db';
import { 
  rcms, controls, rcmControls, bpmProcesses, bpmDiagrams, bpmNodeRcms, 
  organization, accountAssertions
} from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { RcmService } from "../services/rcm-service";
import { ControlService } from "../services/control-service";
import { rbac } from "../lib/guard";

const rcm = new Hono<HonoEnv>();

// --- RCM Routes (Refactored to Service Layer) ---

rcm.get('/rcm', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');
  const items = await rcmService.getAll(orgId, year ? parseInt(year) : undefined);
  return ok(c, { items });
});

rcm.post('/rcm', rbac(['Line 2', 'Admin', 'Line 1']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const body = await c.req.json();
  const newItem = await rcmService.create(c.get('organizationId'), c.get('userId'), body);
  return ok(c, newItem);
});

rcm.put('/rcm/:id', rbac(['Line 2', 'Admin', 'Line 1']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const body = await c.req.json();
  const result = await rcmService.update(
    c.get('organizationId'), 
    c.get('userId'), 
    id, 
    body, 
    c.get('userRole')
  );
  return ok(c, result);
});

rcm.post('/rcm/:id/validate', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const result = await rcmService.validate(c.get('organizationId'), c.get('userId'), id);
  return ok(c, result);
});

rcm.post('/rcm/:id/approve-change', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const result = await rcmService.approveChange(c.get('organizationId'), c.get('userId'), id);
  return ok(c, result);
});

rcm.delete('/rcm/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const result = await rcmService.delete(c.get('organizationId'), id);
  return ok(c, result);
});

// --- RCM Matrix Routes (Standardized for frontend) ---

rcm.get('/rcm-matrix/tlc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const bpmProcessId = c.req.query('bpmProcessId');

  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);

  let query = db.select({
    mappingId: rcmControls.id,
    controlId: controls.id,
    processName: bpmProcesses.name,
    fsliName: bpmProcesses.fsliName,
    noGL: bpmProcesses.noGL,
    subProcessName: bpmDiagrams.name,
    riskDescription: rcms.riskDescription,
    isFraudRelated: rcms.isFraudRelated,
    riskRating: rcms.riskRating,
    controlCode: controls.code,
    baseControlName: controls.name,
    baseControlDescription: controls.description,
    mappedControlName: rcmControls.controlName,
    mappedControlDescription: rcmControls.controlDescription,
    ipoC: rcmControls.ipoC,
    ipoA: rcmControls.ipoA,
    ipoV: rcmControls.ipoV,
    ipoRa: rcmControls.ipoRa,
    assertionE: rcmControls.assertionE,
    assertionC: rcmControls.assertionC,
    assertionA: rcmControls.assertionA,
    assertionCo: rcmControls.assertionCo,
    assertionVa: rcmControls.assertionVa,
    assertionRo: rcmControls.assertionRo,
    assertionPd: rcmControls.assertionPd,
    defE: accountAssertions.assertionE,
    defC: accountAssertions.assertionC,
    defA: accountAssertions.assertionA,
    defCo: accountAssertions.assertionCo,
    defRo: accountAssertions.assertionRo,
    defVa: accountAssertions.assertionVa,
    defPd: accountAssertions.assertionPd,
    controlType: rcmControls.controlType,
    controlNature: rcmControls.controlNature,
    automatedSubNature: rcmControls.automatedControlType,
    frequency: rcmControls.frequency,
    isKeyControl: rcmControls.isKeyControl,
    supportingDocs: rcmControls.supportingDocs,
    supportingApp: rcmControls.supportingApp,
    applicationId: rcmControls.applicationId,
    executingFunction: rcmControls.executingFunction,
    executorRole: rcmControls.executorRole,
    affectedFsliItem: rcmControls.affectedFsliItem,
    effectivePeriod: rcmControls.effectivePeriod,
  })
  .from(rcmControls)
  .innerJoin(rcms, eq(rcmControls.rcmId, rcms.id))
  .innerJoin(controls, eq(rcmControls.controlId, controls.id))
  .innerJoin(bpmNodeRcms, eq(rcms.id, bpmNodeRcms.rcmId))
  .innerJoin(bpmDiagrams, eq(bpmNodeRcms.diagramId, bpmDiagrams.id))
  .innerJoin(bpmProcesses, eq(bpmDiagrams.subProcess, bpmProcesses.name))
  .leftJoin(accountAssertions, and(
    eq(bpmProcesses.fsliName, accountAssertions.fsliName),
    eq(bpmProcesses.noGL, accountAssertions.noGL),
    eq(bpmProcesses.organizationId, accountAssertions.organizationId)
  ));

  let finalConditions = and(
    eq(rcmControls.organizationId, orgId),
    eq(controls.level, 'TLC')
  );

  if (bpmProcessId && bpmProcessId !== 'undefined') {
    finalConditions = and(finalConditions, eq(bpmProcesses.id, bpmProcessId)) as any;
  }

  const results = await query.where(finalConditions);

  return ok(c, { 
    items: results.map((r: any) => ({
      ...r,
      assertionE: r.assertionE || r.defE,
      assertionC: r.assertionC || r.defC,
      assertionA: r.assertionA || r.defA,
      assertionCo: r.assertionCo || r.defCo,
      assertionVa: r.assertionVa || r.defVa,
      assertionRo: r.assertionRo || r.defRo,
      assertionPd: r.assertionPd || r.defPd,
      companyName: org?.name || "N/A",
      locationCode: org?.entityCode || "N/A"
    }))
  });
});

rcm.get('/rcm-matrix/itgc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const bpmProcessId = c.req.query('bpmProcessId');

  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);

  let query = db.select({
    mappingId: rcmControls.id,
    controlId: controls.id,
    processName: bpmProcesses.name,
    fsliName: bpmProcesses.fsliName,
    noGL: bpmProcesses.noGL,
    subProcessName: bpmDiagrams.name,
    riskDescription: rcms.riskDescription,
    isFraudRelated: rcms.isFraudRelated,
    riskRating: rcms.riskRating,
    controlCode: controls.code,
    baseControlName: controls.name,
    baseControlDescription: controls.description,
    mappedControlName: rcmControls.controlName,
    mappedControlDescription: rcmControls.controlDescription,
    itgcDomain: rcmControls.itgcDomain,
    controlType: rcmControls.controlType,
    controlNature: rcmControls.controlNature,
    automatedSubNature: rcmControls.automatedControlType,
    frequency: rcmControls.frequency,
    isKeyControl: rcmControls.isKeyControl,
    supportingDocs: rcmControls.supportingDocs,
    supportingApp: rcmControls.supportingApp,
    applicationId: rcmControls.applicationId,
    executingFunction: rcmControls.executingFunction,
    executorRole: rcmControls.executorRole,
    affectedFsliItem: rcmControls.affectedFsliItem,
    effectivePeriod: rcmControls.effectivePeriod,
  })
  .from(rcmControls)
  .innerJoin(rcms, eq(rcmControls.rcmId, rcms.id))
  .innerJoin(controls, eq(rcmControls.controlId, controls.id))
  .innerJoin(bpmNodeRcms, eq(rcms.id, bpmNodeRcms.rcmId))
  .innerJoin(bpmDiagrams, eq(bpmNodeRcms.diagramId, bpmDiagrams.id))
  .innerJoin(bpmProcesses, eq(bpmDiagrams.subProcess, bpmProcesses.name));

  let finalConditions = and(
    eq(rcmControls.organizationId, orgId),
    eq(controls.level, 'ITGC')
  );

  if (bpmProcessId && bpmProcessId !== 'undefined') {
    finalConditions = and(finalConditions, eq(bpmProcesses.id, bpmProcessId)) as any;
  }

  const results = await query.where(finalConditions);

  return ok(c, { 
    items: results.map((r: any) => ({
      ...r,
      companyName: org?.name || "N/A",
      locationCode: org?.entityCode || "N/A"
    }))
  });
});

rcm.get('/rcm-matrix/tlc/mapping/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const id = c.req.param('id');

  const result = await db.select({
    mappingId: rcmControls.id,
    riskDescription: rcms.riskDescription,
    isFraudRelated: rcms.isFraudRelated,
    riskRating: rcms.riskRating,
    controlCode: controls.code,
    baseControlName: controls.name,
    baseControlDescription: controls.description,
    mappedControlName: rcmControls.controlName,
    mappedControlDescription: rcmControls.controlDescription,
    ipoC: rcmControls.ipoC,
    ipoA: rcmControls.ipoA,
    ipoV: rcmControls.ipoV,
    ipoRa: rcmControls.ipoRa,
    assertionE: rcmControls.assertionE,
    assertionC: rcmControls.assertionC,
    assertionA: rcmControls.assertionA,
    assertionCo: rcmControls.assertionCo,
    assertionVa: rcmControls.assertionVa,
    assertionRo: rcmControls.assertionRo,
    assertionPd: rcmControls.assertionPd,
    controlType: rcmControls.controlType,
    controlNature: rcmControls.controlNature,
    automatedSubNature: rcmControls.automatedControlType,
    frequency: rcmControls.frequency,
    isKeyControl: rcmControls.isKeyControl,
    supportingDocs: rcmControls.supportingDocs,
    supportingApp: rcmControls.supportingApp,
    applicationId: rcmControls.applicationId,
    executingFunction: rcmControls.executingFunction,
    executorRole: rcmControls.executorRole,
    affectedFsliItem: rcmControls.affectedFsliItem,
    effectivePeriod: rcmControls.effectivePeriod,
  })
  .from(rcmControls)
  .innerJoin(rcms, eq(rcmControls.rcmId, rcms.id))
  .innerJoin(controls, eq(rcmControls.controlId, controls.id))
  .where(and(eq(rcmControls.id, id), eq(rcmControls.organizationId, orgId)))
  .then((rows: any) => rows[0]);

  if (!result) return notFound(c);
  return ok(c, result);
});

rcm.post('/rcm-matrix/:type/batch-update', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const { items } = await c.req.json();

  try {
    for (const item of items) {
      if (!item.mappingId) continue;
      await db.update(rcmControls).set(item).where(and(eq(rcmControls.id, item.mappingId), eq(rcmControls.organizationId, orgId)));
    }
    return ok(c, { success: true });
  } catch (e: any) {
    return bad(c, `Batch update failed: ${e.message}`);
  }
});

// --- Controls Routes (Refactored to Service Layer) ---

rcm.get('/controls', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const items = await controlService.getAll(c.get('organizationId'), c.req.query('level'));
  return ok(c, { items });
});

rcm.get('/controls/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const item = await controlService.getById(c.get('organizationId'), c.req.param('id'));
  if (!item) return notFound(c);
  return ok(c, item);
});

rcm.post('/controls', rbac(['Line 2', 'Admin', 'Line 1']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const body = await c.req.json();
  const newItem = await controlService.create(
    c.get('organizationId'), 
    c.get('userId'), 
    c.get('userLevel'), 
    c.get('userRole'), 
    body
  );
  return ok(c, newItem);
});

rcm.put('/controls/:id', rbac(['Line 2', 'Admin', 'Line 1']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const body = await c.req.json();
  const id = c.req.param('id') as string;
  const result = await controlService.update(c.get('organizationId'), c.get('userId'), id, body);
  return ok(c, result);
});

rcm.post('/controls/:id/approve', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const id = c.req.param('id') as string;
  const result = await controlService.approve(c.get('organizationId'), c.get('userId'), id);
  return ok(c, result);
});

rcm.post('/controls/:id/submit-for-approval', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const id = c.req.param('id') as string;
  const result = await controlService.submitForApproval(c.get('organizationId'), c.get('userId'), id);
  return ok(c, result);
});

rcm.post('/controls/:id/reject', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const { note } = await c.req.json();
  const id = c.req.param('id') as string;
  const result = await controlService.reject(c.get('organizationId'), c.get('userId'), id, note);
  return ok(c, result);
});

rcm.delete('/controls/:id', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const id = c.req.param('id') as string;
  const result = await controlService.delete(c.get('organizationId'), id, c.get('userRole'));
  return ok(c, result);
});

export default rcm;
