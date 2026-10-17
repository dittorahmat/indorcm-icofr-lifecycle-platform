import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, notFound } from '../lib/utils';
import { getDb } from '../db';
import {
  organization, controls, rcms, deficiencies,
  testRecords, bpmExports
} from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Settings } from "@shared/types";
import { effectivenessScore, summarizeDeficiencies } from '@shared/deficiency-summary';

const reporting = new Hono<HonoEnv>();

// --- Reporting & Aggregation Refactored ---

reporting.get('/reports/summary', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');

  const [controlCount, rcmCount, allDeficiencyRecords] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(controls).where(eq(controls.organizationId, orgId)),
    db.select({ count: sql<number>`count(*)` }).from(rcms).where(eq(rcms.organizationId, orgId)),
    db.select().from(deficiencies).where(eq(deficiencies.organizationId, orgId))
  ]);

  // Single owner of the tally + effectiveness conclusion lives in
  // `@shared/deficiency-summary` (the Lampiran 11 client helper reads it too).
  const summary = summarizeDeficiencies(allDeficiencyRecords);

  return ok(c, {
    totalControls: Number(controlCount[0]?.count || 0),
    totalRcm: Number(rcmCount[0]?.count || 0),
    openDeficiencies: summary.openCount,
    effectiveness: effectivenessScore(summary),
    deficienciesBySeverity: summary.bySeverity,
    deficienciesByStatus: summary.byStatus,
    allDeficiencies: allDeficiencyRecords
  });
});

reporting.post('/reports/sign-off', async (c) => {
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

reporting.post('/reports/export', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const { format } = await c.req.json<{ format: 'csv' | 'xlsx' }>();

  const [allControls, allRcms, allDeficienciesRecords, allTests] = await Promise.all([
    db.select().from(controls).where(eq(controls.organizationId, orgId)),
    db.select().from(rcms).where(eq(rcms.organizationId, orgId)),
    db.select().from(deficiencies).where(eq(deficiencies.organizationId, orgId)),
    db.select().from(testRecords).where(eq(testRecords.organizationId, orgId))
  ]);

  return ok(c, {
    controls: allControls,
    rcms: allRcms,
    deficiencies: allDeficienciesRecords,
    tests: allTests,
    exportedAt: new Date().toISOString(),
    format
  });
});

// --- BPM Export History Routes ---

reporting.get('/bpm-exports', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(bpmExports).where(eq(bpmExports.organizationId, orgId));
  return ok(c, { items });
});

reporting.post('/bpm-exports', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
  const id = crypto.randomUUID();
  await db.insert(bpmExports).values({
    id,
    organizationId: orgId,
    userId: c.get('userId'),
    diagramId: body.diagramId,
    filename: body.fileName || 'export.pdf',
    createdAt: new Date()
  });

  return ok(c, { id });
});

export default reporting;
