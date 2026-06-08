import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb, type DrizzleDb } from '../db';
import { 
  rcms, controls, rcmControls, bpmProcesses, bpmDiagrams, bpmNodeRcms, 
  organization, accountAssertions, todEvaluations
} from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { RcmService } from "../services/rcm-service";
import { ControlService } from "../services/control-service";
import { DeficiencyService } from "../services/deficiency-service";
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
  const year = c.req.query('year');

  if (!year) {
    return c.json({ success: false, error: 'Year parameter is required' }, 400);
  }

  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);

  let query = db.select({
    mappingId: rcmControls.id,
    rcmId: rcms.id,
    controlId: controls.id,
    processName: sql<string>`COALESCE(${bpmProcesses.name}, ${rcms.process})`,
    fsliName: bpmProcesses.fsliName,
    noGL: bpmProcesses.noGL,
    subProcessName: sql<string>`COALESCE(${bpmDiagrams.name}, ${rcms.subProcess})`,
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
  .leftJoin(bpmNodeRcms, eq(rcms.id, bpmNodeRcms.rcmId))
  .leftJoin(bpmDiagrams, eq(bpmNodeRcms.diagramId, bpmDiagrams.id))
  .leftJoin(bpmProcesses, eq(bpmDiagrams.subProcess, bpmProcesses.name))
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
    // Filter using controls.bpmProcessId which is set directly during migration,
    // rather than bpmProcesses.id which depends on the leftJoin to bpmNodeRcms
    finalConditions = and(finalConditions, eq(controls.bpmProcessId, bpmProcessId)) as any;
  }
  
  if (year) {
    finalConditions = and(finalConditions, eq(rcms.year, parseInt(year))) as any;
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
  const year = c.req.query('year');

  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);

  let query = db.select({
    mappingId: rcmControls.id,
    rcmId: rcms.id,
    controlId: controls.id,
    processName: sql<string>`COALESCE(${bpmProcesses.name}, ${rcms.process})`,
    fsliName: bpmProcesses.fsliName,
    noGL: bpmProcesses.noGL,
    subProcessName: sql<string>`COALESCE(${bpmDiagrams.name}, ${rcms.subProcess})`,
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
  .leftJoin(bpmNodeRcms, eq(rcms.id, bpmNodeRcms.rcmId))
  .leftJoin(bpmDiagrams, eq(bpmNodeRcms.diagramId, bpmDiagrams.id))
  .leftJoin(bpmProcesses, eq(bpmDiagrams.subProcess, bpmProcesses.name));

  let finalConditions = and(
    eq(rcmControls.organizationId, orgId),
    eq(controls.level, 'ITGC')
  );

  if (bpmProcessId && bpmProcessId !== 'undefined') {
    finalConditions = and(finalConditions, eq(bpmProcesses.id, bpmProcessId)) as any;
  }
  
  if (year) {
    finalConditions = and(finalConditions, eq(rcms.year, parseInt(year))) as any;
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

rcm.get('/rcm-matrix/verification-design', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const bpmProcessId = c.req.query('bpmProcessId');

  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);

  // Lampiran 8 requires a join of RCM Mapping (Lini 1 data) and TOD Evaluation (Lini 2 data)
  const results = await db.query.rcmControls.findMany({
    where: and(
      eq(rcmControls.organizationId, orgId),
      bpmProcessId && bpmProcessId !== 'undefined' ? sql`${rcmControls.rcmId} IN (SELECT id FROM ${rcms} WHERE ${rcms.process} = (SELECT name FROM ${bpmProcesses} WHERE id = ${bpmProcessId}))` : undefined
    ),
    with: {
      rcm: true,
      control: {
        with: {
          todEvaluations: true
        }
      }
    }
  });

  // Flatten and map to Lampiran 8 structure
  const items = results.map((m: any) => {
    const tod = m.control?.todEvaluations?.[0] || {};
    return {
      id: m.id,
      controlId: m.controlId,
      mappingId: m.id,
      companyName: org?.name || "N/A",
      locationCode: org?.entityCode || "N/A",
      // Lini 1 Data (from rcmControls)
      controlCode: m.control?.code,
      controlName: m.controlName,
      controlDescription: m.controlDescription,
      supportingDocs: m.supportingDocs,
      isKeyControl: m.isKeyControl,
      ipoC: m.ipoC,
      ipoA: m.ipoA,
      ipoV: m.ipoV,
      ipoRa: m.ipoRa,
      assertionE: m.assertionE,
      assertionC: m.assertionC,
      assertionA: m.assertionA,
      assertionCo: m.assertionCo,
      assertionVa: m.assertionVa,
      assertionRo: m.assertionRo,
      assertionPd: m.assertionPd,
      controlType: m.controlType,
      controlNature: m.controlNature,
      automatedControlType: m.automatedControlType,
      frequency: m.frequency,
      supportingApp: m.supportingApp,
      applicationId: m.applicationId,
      executingFunction: m.executingFunction,
      executorRole: m.executorRole,
      affectedFsliItem: m.affectedFsliItem,
      effectivePeriod: m.effectivePeriod,
      // Lini 2 Data (from tod_evaluations)
      todId: tod.id,
      pilarObjective: tod.pilarObjective,
      pilarTiming: tod.pilarTiming,
      pilarAuthority: tod.pilarAuthority,
      pilarReliability: tod.pilarReliability,
      pilarCoverage: tod.pilarCoverage,
      pilarEvidence: tod.pilarEvidence,
      kkReference: tod.kkReference,
      conclusion: tod.conclusion,
      comment: tod.comment,
    };
  });

  return ok(c, { items });
});

rcm.patch('/rcm-matrix/verification-design/:mappingId', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const mappingId = c.req.param('mappingId');
  const body = await c.req.json();

  if (!mappingId) return bad(c, 'Mapping ID is required');

  const mapping = await db.query.rcmControls.findFirst({
    where: and(eq(rcmControls.id, mappingId), eq(rcmControls.organizationId, orgId))
  });

  if (!mapping) return notFound(c);

  // 1. Update Lini 1 Data in rcm_controls if provided
  const lini1Fields = [
    'controlName', 'controlDescription', 'supportingDocs', 'isKeyControl',
    'ipoC', 'ipoA', 'ipoV', 'ipoRa', 'assertionE', 'assertionC', 'assertionA',
    'assertionCo', 'assertionVa', 'assertionRo', 'assertionPd', 'controlType',
    'controlNature', 'automatedControlType', 'frequency', 'supportingApp',
    'applicationId', 'executingFunction', 'executorRole', 'affectedFsliItem',
    'effectivePeriod'
  ];

  const updateMapping: any = {};
  lini1Fields.forEach(f => { if (body[f] !== undefined) updateMapping[f] = body[f]; });

  if (Object.keys(updateMapping).length > 0) {
    await db.update(rcmControls).set(updateMapping).where(eq(rcmControls.id, mappingId));
  }

  // 2. Update Lini 2 Data in tod_evaluations
  const lini2Fields = [
    'pilarObjective', 'pilarTiming', 'pilarAuthority', 'pilarReliability',
    'pilarCoverage', 'pilarEvidence', 'kkReference', 'conclusion', 'comment'
  ];

  const todData: any = {
    organizationId: orgId,
    controlId: mapping.controlId,
    evaluatorId: userId,
    updatedAt: new Date(),
  };
  lini2Fields.forEach(f => { if (body[f] !== undefined) todData[f] = body[f]; });

  const existingTod = await db.query.todEvaluations.findFirst({
    where: and(eq(todEvaluations.controlId, mapping.controlId), eq(todEvaluations.organizationId, orgId))
  });

  if (existingTod) {
    await db.update(todEvaluations).set(todData).where(eq(todEvaluations.id, existingTod.id));
  } else {
    await db.insert(todEvaluations).values({
      ...todData,
      id: crypto.randomUUID(),
      csaId: null, // Explicitly null as it's a design verification not tied to a CSA record yet
      createdAt: new Date(),
    });
  }

  // 3. Auto-Deficiency logic for TOD Ineffective
  if (body.conclusion === 'Ineffective') {
    const defService = new DeficiencyService(db);
    await defService.createAutoDeficiency({
      organizationId: orgId,
      controlId: mapping.controlId,
      description: `Hasil Verifikasi Desain (TOD) Ineffective: ${body.comment || 'No justification provided.'}`,
      source: 'Lini 2 - TOD Review',
      userId,
      period: 'TOD-Evaluation'
    });
  }

  return ok(c, { success: true });
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

      // 1. Update Risk Data (rcms table)
      if (item.riskDescription !== undefined || item.riskRating !== undefined || item.isFraudRelated !== undefined) {
        // Find the RCM ID from the mapping
        const mapping = await db.select({ rcmId: rcmControls.rcmId })
          .from(rcmControls)
          .where(and(eq(rcmControls.id, item.mappingId), eq(rcmControls.organizationId, orgId)))
          .then((rows: any[]) => rows[0]);

        if (mapping?.rcmId) {
          const riskUpdate: any = {};
          if (item.riskDescription !== undefined) riskUpdate.riskDescription = item.riskDescription;
          if (item.riskRating !== undefined) riskUpdate.riskRating = item.riskRating;
          if (item.isFraudRelated !== undefined) riskUpdate.isFraudRelated = item.isFraudRelated;

          console.log(`[RCM UPDATE] Updating Risk ${mapping.rcmId}:`, JSON.stringify(riskUpdate));
          await db.update(rcms)
            .set(riskUpdate)
            .where(and(eq(rcms.id, mapping.rcmId), eq(rcms.organizationId, orgId)));
        } else {
          console.warn(`[RCM UPDATE] Mapping ${item.mappingId} not found or no associated RCM.`);
        }
      }

      // 2. Update Control Mapping Data (rcm_controls table)
      const mappingUpdate: any = {};
      const controlFieldsMap: Record<string, string> = {
        'controlName': 'controlName',
        'controlDescription': 'controlDescription',
        'supportingDocs': 'supportingDocs',
        'isKeyControl': 'isKeyControl',
        'controlType': 'controlType',
        'controlNature': 'controlNature',
        'frequency': 'frequency',
        'supportingApp': 'supportingApp',
        'applicationId': 'applicationId',
        'executingFunction': 'executingFunction',
        'executorRole': 'executorRole',
        'affectedFsliItem': 'affectedFsliItem',
        'effectivePeriod': 'effectivePeriod',
        'ipoC': 'ipoC',
        'ipoA': 'ipoA',
        'ipoV': 'ipoV',
        'ipoRa': 'ipoRa',
        'assertionE': 'assertionE',
        'assertionC': 'assertionC',
        'assertionA': 'assertionA',
        'assertionCo': 'assertionCo',
        'assertionVa': 'assertionVa',
        'assertionRo': 'assertionRo',
        'assertionPd': 'assertionPd',
        'itgcDomain': 'itgcDomain',
        'automatedSubNature': 'automatedControlType', // Map frontend field to backend column
        'automatedControlType': 'automatedControlType'
      };

      for (const [feKey, beKey] of Object.entries(controlFieldsMap)) {
        if (item[feKey] !== undefined) {
          mappingUpdate[beKey] = item[feKey];
        }
      }

      if (Object.keys(mappingUpdate).length > 0) {
        console.log(`[RCM UPDATE] Updating Mapping ${item.mappingId}:`, JSON.stringify(mappingUpdate));
        await db.update(rcmControls)
          .set(mappingUpdate)
          .where(and(eq(rcmControls.id, item.mappingId), eq(rcmControls.organizationId, orgId)));
      }
    }

    return ok(c, { success: true });
  } catch (e: any) {
    console.error(`[RCM UPDATE ERROR] ${e.message}`, e.stack);
    return bad(c, `Batch update failed: ${e.message}`);
  }
});

// --- Controls Routes (Refactored to Service Layer) ---

rcm.get('/controls', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const controlService = new ControlService(db);
  const year = c.req.query('year');
  const items = await controlService.getAll(
    c.get('organizationId'), 
    c.req.query('level'),
    year ? parseInt(year) : undefined
  );
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
