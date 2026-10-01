import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  rcms, controls, rcmControls, organization, todEvaluations
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { RcmService } from "../services/rcm-service";
import { RcmMatrixService } from "../services/rcm-matrix-service";
import { ControlService } from "../services/control-service";
import { DeficiencyService } from "../services/deficiency-service";
import { rbac } from "../lib/guard";

const rcm = new Hono<HonoEnv>();

// --- RCM Routes ---

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
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {
    // empty
  }
  const effectiveDate = body.effectiveDate ? new Date(body.effectiveDate) : undefined;
  const result = await rcmService.approveChange(c.get('organizationId'), c.get('userId'), id, body.category, effectiveDate);
  return ok(c, result);
});

rcm.post('/rcm/:id/workflow', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;
  const userId = c.get('userId')!;
  const role = c.get('userRole')!;
  const body = await c.req.json<{ action: any, note: string, assigneeId?: string, category?: string, effectiveDate?: string }>();

  const existing = await db.select().from(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c, 'RCM not found');

  const rcmRecord = existing[0];
  const currentStatus = rcmRecord.workflowStatus || "Draft";
  let nextStatus = currentStatus;

  if (body.action === "Submit") {
    nextStatus = "In Review";
  } else if (body.action === "Approve") {
    nextStatus = "Approved";
  } else if (body.action === "Reject") {
    if (!body.note) return bad(c, "Rejection requires a note");
    nextStatus = "Draft";
  } else if (body.action === "Rollback") {
    if (!body.note) return bad(c, "Rollback requires a note");
    nextStatus = "In Review";
  }

  const historyEntry = {
    id: crypto.randomUUID(),
    action: body.action,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    userId,
    role,
    timestamp: Date.now(),
    note: body.note || ''
  };

  const currentHistory = (rcmRecord.workflowHistory as any[]) || [];
  const newHistory = [historyEntry, ...currentHistory];

  const updateData: any = {
    workflowStatus: nextStatus,
    workflowHistory: newHistory,
    status: nextStatus === 'Approved' ? 'Active' : (nextStatus === 'In Review' ? 'Pending Change Approval' : 'Draft')
  };

  await db.update(rcms).set(updateData).where(eq(rcms.id, id));

  if (nextStatus === 'Approved') {
    const rcmService = new RcmService(db);
    const effDate = body.effectiveDate ? new Date(body.effectiveDate) : new Date();
    await rcmService.approveChange(orgId, userId, id, body.category || 'Maintenance', effDate);
  }

  return ok(c, { success: true, nextStatus });
});

rcm.delete('/rcm/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const rcmService = new RcmService(db);
  const id = c.req.param('id') as string;
  const result = await rcmService.delete(c.get('organizationId'), id);
  return ok(c, result);
});

// --- RCM Matrix Routes ---

rcm.get('/rcm-matrix/tlc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const bpmProcessId = c.req.query('bpmProcessId');
  const year = c.req.query('year');
  const noGL = c.req.query('noGL');

  if (!year) {
    return c.json({ success: false, error: 'Year parameter is required' }, 400);
  }

  const matrixService = new RcmMatrixService(db);
  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);
  const results = await matrixService.getTlcMatrix(orgId, bpmProcessId, year, noGL);

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

rcm.get('/rcm-matrix/elc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');

  const matrixService = new RcmMatrixService(db);
  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);
  const results = await matrixService.getElcMatrix(orgId, year);

  return ok(c, { 
    items: results.map((r: any) => ({
      ...r,
      companyName: org?.name || "N/A",
      locationCode: org?.entityCode || "N/A"
    }))
  });
});

rcm.get('/rcm-matrix/itgc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');
  const bpmProcessId = c.req.query('bpmProcessId') || c.req.query('bpmId');

  const matrixService = new RcmMatrixService(db);
  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);
  const results = await matrixService.getItgcMatrix(orgId, year, bpmProcessId);

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
  const bpmProcessId = c.req.query('bpmProcessId') || c.req.query('bpmId');
  const year = c.req.query('year');
  const noGL = c.req.query('noGL');

  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows: any) => rows[0]);

  const results = await db.query.rcmControls.findMany({
    where: and(
      eq(rcmControls.organizationId, orgId),
      bpmProcessId && bpmProcessId !== 'undefined' ? eq(rcmControls.rcmId, bpmProcessId) : undefined,
      year && year !== 'undefined' ? eq(rcmControls.year, parseInt(year)) : undefined
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

  const filteredResults = noGL && noGL !== 'undefined'
    ? results.filter((m: any) => {
        const glList = m.control?.fsliCodes || [];
        return Array.isArray(glList) && glList.includes(noGL);
      })
    : results;

  const items = filteredResults.map((m: any) => {
    const tod = m.control?.todEvaluations?.[0] || {};
    return {
      id: m.id,
      controlId: m.controlId,
      mappingId: m.id,
      companyName: org?.name || "N/A",
      locationCode: org?.entityCode || "N/A",
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
      csaId: null,
      createdAt: new Date(),
    });
  }

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

rcm.post('/rcm-matrix/verification-design', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const matrixService = new RcmMatrixService(db);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json();

  try {
    const result = await matrixService.saveVerificationDesign(orgId, userId, body);
    return ok(c, result);
  } catch (err: any) {
    return bad(c, err.message);
  }
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

      if (item.riskDescription !== undefined || item.riskRating !== undefined || item.isFraudRelated !== undefined) {
        const mapping = await db.select({ rcmId: rcmControls.rcmId })
          .from(rcmControls)
          .where(and(eq(rcmControls.id, item.mappingId), eq(rcmControls.organizationId, orgId)))
          .then((rows: any[]) => rows[0]);

        if (mapping?.rcmId) {
          const riskUpdate: any = {};
          if (item.riskDescription !== undefined) riskUpdate.riskDescription = item.riskDescription;
          if (item.riskRating !== undefined) riskUpdate.riskRating = item.riskRating;
          if (item.isFraudRelated !== undefined) riskUpdate.isFraudRelated = item.isFraudRelated;

          await db.update(rcms)
            .set(riskUpdate)
            .where(and(eq(rcms.id, mapping.rcmId), eq(rcms.organizationId, orgId)));
        }
      }

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
        'automatedSubNature': 'automatedControlType',
        'automatedControlType': 'automatedControlType'
      };

      for (const [feKey, beKey] of Object.entries(controlFieldsMap)) {
        if (item[feKey] !== undefined) {
          mappingUpdate[beKey] = item[feKey];
        }
      }

      if (Object.keys(mappingUpdate).length > 0) {
        await db.update(rcmControls)
          .set(mappingUpdate)
          .where(and(eq(rcmControls.id, item.mappingId), eq(rcmControls.organizationId, orgId)));
      }
    }

    return ok(c, { success: true });
  } catch (e: any) {
    return bad(c, `Batch update failed: ${e.message}`);
  }
});

// --- Controls Routes ---

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
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {
    // empty
  }
  const effectiveDate = body.effectiveDate ? new Date(body.effectiveDate) : undefined;
  const result = await controlService.approve(c.get('organizationId'), c.get('userId'), id, body.category, effectiveDate);
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
