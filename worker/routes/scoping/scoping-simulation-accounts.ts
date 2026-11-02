import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import {
  simulations, glRows, simulationAccountApplications,
  applications,
} from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuditService } from "../../services/audit-service";
import { rbac } from '../../lib/guard';

const simulationAccounts = new Hono<HonoEnv>();

simulationAccounts.post('/simulations/assign-department', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<{ scopingId: string, accountName: string, departmentId: string }>();

  const [sim] = await db.select()
    .from(simulations)
    .where(and(
      eq(simulations.id, body.scopingId),
      eq(simulations.organizationId, orgId)
    ))
    .limit(1);

  if (!sim) return notFound(c, 'Simulation not found');
  if (!sim.glSnapshotId) return bad(c, 'Simulation has no associated snapshot');

  await db.update(glRows)
    .set({ assignedDepartmentIds: [body.departmentId] })
    .where(and(
      eq(glRows.snapshotId, sim.glSnapshotId!),
      eq(glRows.noGL, body.accountName),
      eq(glRows.organizationId, orgId)
    ));

  const auditService = new AuditService(db);
  await auditService.logAction({
    organizationId: orgId,
    userId: c.get('userId'),
    action: 'ASSIGN_DEPARTMENT',
    entityType: 'GL_Account',
    entityId: `${sim.glSnapshotId}:${body.accountName}`,
    description: `Assigned department ${body.departmentId} to account ${body.accountName}`,
    dataAfter: body
  });

  return ok(c, { success: true });
});

simulationAccounts.post('/simulations/:id/account-departments/sync', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const simId = c.req.param('id');
  const orgId = c.get('organizationId');
  const { mappings } = await c.req.json<{ mappings: { noGL: string, departmentIds: string[] }[] }>();

  const sim = await db.query.simulations.findFirst({
    where: and(eq(simulations.id, simId), eq(simulations.organizationId, orgId))
  });

  if (!sim) return notFound(c, 'SIMULATION_NOT_FOUND', 'Simulation not found');

  try {
    // Sequential updates to avoid transaction issues and overwhelming the DB
    for (const m of mappings) {
      await db.update(glRows)
        .set({ assignedDepartmentIds: m.departmentIds })
        .where(and(
          eq(glRows.snapshotId, sim.glSnapshotId!),
          eq(glRows.noGL, m.noGL),
          eq(glRows.organizationId, orgId)
        ));
    }
    return ok(c, { success: true });
  } catch (e: unknown) {
    return bad(c, `Sync failed: ${e instanceof Error ? e.message : String(e)}`);
  }
});

simulationAccounts.get('/simulations/:id/account-applications', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const simId = c.req.param('id');
  const orgId = c.get('organizationId');

  const items = await db.select().from(simulationAccountApplications).where(and(
    eq(simulationAccountApplications.simulationId, simId),
    eq(simulationAccountApplications.organizationId, orgId)
  ));

  return ok(c, { items });
});

simulationAccounts.post('/simulations/:id/account-applications/sync', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const simId = c.req.param('id');
  const orgId = c.get('organizationId');
  const { mappings } = await c.req.json<{ mappings: { accountCode: string, applicationIds: string[] }[] }>();

  try {
    for (const m of mappings) {
      await db.delete(simulationAccountApplications).where(and(
        eq(simulationAccountApplications.simulationId, simId),
        eq(simulationAccountApplications.accountCode, m.accountCode),
        eq(simulationAccountApplications.organizationId, orgId)
      ));

      if (m.applicationIds.length > 0) {
        for (const appId of m.applicationIds) {
          await db.insert(simulationAccountApplications).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            simulationId: simId,
            accountCode: m.accountCode,
            applicationId: appId
          });

          await db.update(applications)
            .set({ isSignificant: true })
            .where(and(eq(applications.id, appId), eq(applications.organizationId, orgId)));
        }
      }
    }
    return ok(c, { success: true });
  } catch (e: unknown) {
    return bad(c, `Sync failed: ${e instanceof Error ? e.message : String(e)}`);
  }
});

export default simulationAccounts;
