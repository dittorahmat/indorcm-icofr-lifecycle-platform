import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import {
  rcms, controls, rcmControls
} from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { RcmMatrixService } from "../../services/rcm-matrix-service";
import type {
  CreateVerificationDesignBody,
  VerificationBatchUpdateItem,
  VerificationDesignPatchBody,
} from "@shared/types";
import { rbac } from "../../lib/guard";

/** Thin adapters over RcmMatrixService (arch-09 T4). Verification writes —
 *  allow-list partition, TOD upsert via decideTest, auto-deficiency and the
 *  consolidated batch — live behind the domain seam. URLs byte-identical. */
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
  const items = await matrixService.getTlcMatrix(orgId, bpmProcessId, year, noGL);
  return ok(c, { items });
});

rcmMatrixRoute.get('/rcm-matrix/elc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');

  const matrixService = new RcmMatrixService(db);
  const items = await matrixService.getElcMatrix(orgId, year);
  return ok(c, { items });
});

rcmMatrixRoute.get('/rcm-matrix/itgc', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');
  const bpmProcessId = c.req.query('bpmProcessId') || c.req.query('bpmId');

  const matrixService = new RcmMatrixService(db);
  const items = await matrixService.getItgcMatrix(orgId, year, bpmProcessId);
  return ok(c, { items });
});

rcmMatrixRoute.get('/rcm-matrix/verification-design', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const bpmProcessId = c.req.query('bpmProcessId') || c.req.query('bpmId');
  const year = c.req.query('year');
  const noGL = c.req.query('noGL');

  const matrixService = new RcmMatrixService(db);
  const items = await matrixService.getVerificationDesign(orgId, {
    bpmProcessId, year, noGL,
  });
  return ok(c, { items });
});

rcmMatrixRoute.patch('/rcm-matrix/verification-design/:mappingId', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const mappingId = c.req.param('mappingId');
  const body = await c.req.json<VerificationDesignPatchBody>();

  if (!mappingId) return bad(c, 'Mapping ID is required');

  const matrixService = new RcmMatrixService(db);
  const result = await matrixService.patchVerificationDesign(orgId, userId, mappingId, body);
  return ok(c, { success: true, ...result });
});

rcmMatrixRoute.post('/rcm-matrix/verification-design', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const matrixService = new RcmMatrixService(db);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<CreateVerificationDesignBody>();

  const result = await matrixService.saveVerificationDesign(orgId, userId, body);
  return ok(c, result);
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
  const { items } = await c.req.json<{ items: VerificationBatchUpdateItem[] }>();

  const matrixService = new RcmMatrixService(db);
  const result = await matrixService.batchUpdateMatrix(orgId, items ?? []);
  return ok(c, { success: true, ...result });
});
