import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  deficiencies, actionPlans, auditLogs, aggregateDeficiencies, 
  organization, notifications
} from '../db/schema';
import { eq, and, SQL } from 'drizzle-orm';
import type { Deficiency, ActionPlan, AggregateDeficiency } from "@shared/types";
import { AuditService } from "../services/audit-service";

const remediation = new Hono<HonoEnv>();

// --- Deficiencies & Action Plans ---

remediation.get('/deficiencies', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(deficiencies).where(eq(deficiencies.organizationId, orgId));
  return ok(c, { items });
});

remediation.get('/actionplans', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(actionPlans).where(eq(actionPlans.organizationId, orgId));
  return ok(c, { items });
});

remediation.post('/actionplans', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<ActionPlan>>();

  const id = crypto.randomUUID();
  const newPlan = {
    id,
    organizationId: orgId,
    deficiencyId: body.deficiencyId || "",
    description: body.description || "",
    ownerId: body.ownerId || userId,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    status: body.status || "Draft",
    relatedFunction: body.relatedFunction || "",
    picName: body.picName || "",
    planDescription: body.planDescription || "",
    activityDetail: body.activityDetail || "",
    remediatedControlDescription: body.remediatedControlDescription || "",
    targetDate: body.targetDate ? new Date(body.targetDate) : null,
    actualCompletionDate: body.actualCompletionDate ? new Date(body.actualCompletionDate) : null,
    isApprovedByLine2: body.isApprovedByLine2 || false,
    isBeforeYearEnd: body.isBeforeYearEnd || false,
  };

  await db.insert(actionPlans).values(newPlan);

  // Trigger Notification for Action Plan Owner
  if (newPlan.ownerId && newPlan.ownerId !== userId) {
    await db.insert(notifications).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: newPlan.ownerId,
        message: `Rencana Aksi baru telah ditugaskan kepada Anda: ${newPlan.description}`,
        type: 'warning',
        link: '/deficiencies',
        readStatus: false,
        createdAt: new Date(),
    });
  }

  const auditService = new AuditService(db);

  await auditService.logAction({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Control',
    entityId: id,
    description: `Created action plan for deficiency ${body.deficiencyId}`,
    dataAfter: newPlan,
    isRegulatory: true,
  });

  return ok(c, newPlan);
});

remediation.put('/actionplans/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<ActionPlan>>();

  const existing = await db.select().from(actionPlans).where(and(eq(actionPlans.id, id), eq(actionPlans.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c, 'Action Plan not found');

  const oldData = existing[0];
  const updateData: any = {
    description: body.description,
    ownerId: body.ownerId,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    status: body.status,
    relatedFunction: body.relatedFunction,
    picName: body.picName,
    planDescription: body.planDescription,
    activityDetail: body.activityDetail,
    remediatedControlDescription: body.remediatedControlDescription,
    targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
    actualCompletionDate: body.actualCompletionDate ? new Date(body.actualCompletionDate) : undefined,
    isApprovedByLine2: body.isApprovedByLine2,
  };

  if (body.status === 'Resolved' || body.status === 'Verified') {
    const defStatus = body.status === 'Resolved' ? 'Remediated' : 'Verified';
    if (oldData.deficiencyId) {
      await db.update(deficiencies).set({ status: defStatus }).where(eq(deficiencies.id, oldData.deficiencyId));
    }
    
    if (!oldData.actualCompletionDate && body.status === 'Resolved') {
      updateData.actualCompletionDate = new Date();
    }
  }

  if (updateData.actualCompletionDate) {
    const completionDate = new Date(updateData.actualCompletionDate);
    const orgs = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
    const fiscalYear = (orgs[0]?.metadata as any)?.fiscalYear || new Date().getFullYear();
    const yearEndDate = new Date(fiscalYear, 11, 31);
    updateData.isBeforeYearEnd = completionDate <= yearEndDate;
  }

  await db.update(actionPlans).set(updateData).where(eq(actionPlans.id, id));

  const auditService = new AuditService(db);
  await auditService.logAction({
    organizationId: orgId,
    userId,
    action: 'UPDATE',
    entityType: 'Control',
    entityId: id,
    description: `Updated action plan status to ${body.status || oldData.status}`,
    dataBefore: oldData,
    dataAfter: { ...oldData, ...updateData },
    isRegulatory: true,
  });

  return ok(c, { success: true });
});

remediation.get('/aggregatedeficiencies', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(aggregateDeficiencies).where(eq(aggregateDeficiencies.organizationId, orgId));
  return ok(c, { items });
});

remediation.post('/aggregatedeficiencies', async (c) => {
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

remediation.put('/deficiencies/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<Deficiency>>();

  const existing = await db.select().from(deficiencies).where(and(eq(deficiencies.id, id), eq(deficiencies.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c, 'Deficiency not found');

  const oldData = existing[0];
  const updateData = {
    description: body.description,
    severity: body.severity,
    identifiedDate: body.identifiedDate ? new Date(body.identifiedDate) : undefined,
    identifiedBy: body.identifiedBy,
    status: body.status,
    rootCause: body.rootCause,
    magnitude: body.magnitude,
    likelihood: body.likelihood,
    exposureValue: body.exposureValue,
    assertions: body.assertions,
    flowchartPath: body.flowchartPath,
  };

  await db.update(deficiencies).set(updateData).where(eq(deficiencies.id, id));

  const auditService = new AuditService(db);
  await auditService.logAction({
    organizationId: orgId,
    userId,
    action: 'UPDATE',
    entityType: 'Control',
    entityId: id,
    description: `Updated deficiency metadata (DoD/Severity)`,
    dataBefore: oldData,
    dataAfter: { ...oldData, ...updateData },
    isRegulatory: true,
  });

  return ok(c, { success: true });
});

export default remediation;
