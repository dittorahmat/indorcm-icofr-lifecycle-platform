import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import { 
  rcms, controls, rcmControls, organization, todEvaluations
} from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { RcmMatrixService } from "../../services/rcm-matrix-service";
import { DeficiencyService } from "../../services/deficiency-service";
import { rbac } from "../../lib/guard";

export const rcmMatrixRoute = new Hono<HonoEnv>();

rcmMatrixRoute.get('/rcm-matrix/tlc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const bpmProcessId = c.req.query('bpmProcessId');
  const year = c.req.query('year');
  const noGL = c.req.query('noGL');

  if (!year) {
    return c.json({ success: false, error: 'Year parameter is required' }, 400);
  }

  const matrixService = new RcmMatrixService(db);
  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows) => rows[0]);
  const results = await matrixService.getTlcMatrix(orgId, bpmProcessId, year, noGL);

  return ok(c, { 
    items: results.map((r: Record<string, unknown>) => ({
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

rcmMatrixRoute.get('/rcm-matrix/elc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');

  const matrixService = new RcmMatrixService(db);
  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows) => rows[0]);
  const results = await matrixService.getElcMatrix(orgId, year);

  return ok(c, { 
    items: results.map((r: Record<string, unknown>) => ({
      ...r,
      companyName: org?.name || "N/A",
      locationCode: org?.entityCode || "N/A"
    }))
  });
});

rcmMatrixRoute.get('/rcm-matrix/itgc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');
  const bpmProcessId = c.req.query('bpmProcessId') || c.req.query('bpmId');

  const matrixService = new RcmMatrixService(db);
  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows) => rows[0]);
  const results = await matrixService.getItgcMatrix(orgId, year, bpmProcessId);

  return ok(c, { 
    items: results.map((r: Record<string, unknown>) => ({
      ...r,
      companyName: org?.name || "N/A",
      locationCode: org?.entityCode || "N/A"
    }))
  });
});

rcmMatrixRoute.get('/rcm-matrix/verification-design', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const bpmProcessId = c.req.query('bpmProcessId') || c.req.query('bpmId');
  const year = c.req.query('year');
  const noGL = c.req.query('noGL');

  const org = await db.select().from(organization).where(eq(organization.id, orgId)).then((rows) => rows[0]);

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
    ? results.filter((m: { control?: { fsliCodes?: string[] | null } | null }) => {
        const glList = m.control?.fsliCodes || [];
        return Array.isArray(glList) && glList.includes(noGL);
      })
    : results;

  const items = filteredResults.map((m: Record<string, any>) => {
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

rcmMatrixRoute.patch('/rcm-matrix/verification-design/:mappingId', rbac(['Line 2', 'Admin']), async (c) => {
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

  const updateMapping: Record<string, unknown> = {};
  lini1Fields.forEach(f => { if (body[f] !== undefined) updateMapping[f] = body[f]; });

  if (Object.keys(updateMapping).length > 0) {
    await db.update(rcmControls).set(updateMapping).where(eq(rcmControls.id, mappingId));
  }

  const lini2Fields = [
    'pilarObjective', 'pilarTiming', 'pilarAuthority', 'pilarReliability',
    'pilarCoverage', 'pilarEvidence', 'kkReference', 'conclusion', 'comment'
  ];

  const todData: Record<string, unknown> = {
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
    } as any);
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

rcmMatrixRoute.post('/rcm-matrix/verification-design', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const matrixService = new RcmMatrixService(db);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json();

  try {
    const result = await matrixService.saveVerificationDesign(orgId, userId, body);
    return ok(c, result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return bad(c, msg);
  }
});

rcmMatrixRoute.get('/rcm-matrix/tlc/mapping/:id', async (c) => {
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
  .then((rows) => rows[0]);

  if (!result) return notFound(c);
  return ok(c, result);
});

rcmMatrixRoute.post('/rcm-matrix/:type/batch-update', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const { items } = await c.req.json<{ items: Array<Record<string, any>> }>();

  try {
    for (const item of items) {
      if (!item.mappingId) continue;

      if (item.riskDescription !== undefined || item.riskRating !== undefined || item.isFraudRelated !== undefined) {
        const mapping = await db.select({ rcmId: rcmControls.rcmId })
          .from(rcmControls)
          .where(and(eq(rcmControls.id, item.mappingId), eq(rcmControls.organizationId, orgId)))
          .then((rows) => rows[0]);

        if (mapping?.rcmId) {
          const riskUpdate: Record<string, unknown> = {};
          if (item.riskDescription !== undefined) riskUpdate.riskDescription = item.riskDescription;
          if (item.riskRating !== undefined) riskUpdate.riskRating = item.riskRating;
          if (item.isFraudRelated !== undefined) riskUpdate.isFraudRelated = item.isFraudRelated;

          await db.update(rcms)
            .set(riskUpdate)
            .where(and(eq(rcms.id, mapping.rcmId), eq(rcms.organizationId, orgId)));
        }
      }

      const mappingUpdate: Record<string, unknown> = {};
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return bad(c, `Batch update failed: ${msg}`);
  }
});
