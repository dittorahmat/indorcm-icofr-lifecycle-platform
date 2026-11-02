import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import {
  simulations, glRows, glSnapshots,
} from '../../db/schema';
import { eq, and, type SQL } from 'drizzle-orm';
import type {
  MaterialitySimulation,
} from "@shared/types";
import { computeSimulationMateriality, basisProblemForSnapshot } from '@shared/scoping-materiality';
import { resolveSimulationStatus, simulationStatusColumns } from '@shared/scoping-simulation-status';
import { ScopingService } from '../../services/scoping-service';
import { AuditService } from "../../services/audit-service";
import { getQualitativeDefaults } from '../../services/scoping-defaults';
import { createNotificationAndSendEmail } from '../../services/email';
import { rbac } from "../../lib/guard";

const simulationRoutes = new Hono<HonoEnv>();

// --- Simulations ---

simulationRoutes.get('/simulations', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');

  let conditions: SQL | undefined = eq(simulations.organizationId, orgId);
  if (year) {
    conditions = and(conditions, eq(simulations.year, parseInt(year)));
  }

  const items = await db.select().from(simulations).where(conditions);
  return ok(c, { items });
});

simulationRoutes.get('/simulations/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id') as string;
  const orgId = c.get('organizationId');
  const item = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (item.length === 0) return notFound(c);
  return ok(c, item[0]);
});

simulationRoutes.post('/simulations', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<MaterialitySimulation>>();

  const targetYear = body.year || new Date().getFullYear();

  // Use ScopingService for Carry Forward logic (Encapsulated & Transactional)
  const scopingService = new ScopingService(db);
  const cloned = await scopingService.carryForward(orgId, userId, targetYear);

  if (cloned) {
    await createNotificationAndSendEmail({
      db,
      orgId,
      userId: userId,
      message: `Successfully carried forward RCM and BPM data from ${targetYear - 1} to ${targetYear}.`,
      type: 'success',
      env: c.env,
    });
  }

  const id = crypto.randomUUID();
  const glSnapshotId = body.glSnapshotId || '';
  const basis = body.basis || '';
  const omPercentage = body.omPercentage ?? 5;
  const haircutPercentage = body.haircutPercentage ?? 25;
  const locationCount = body.locationCount || 1;

  // Snapshot + rows are read once: the basis is validated against them and the
  // materiality is derived server-side, so the stored PM can never be a silent 0.
  const [snapshot] = glSnapshotId
    ? await db.select({ benchmarkFsliNames: glSnapshots.benchmarkFsliNames })
        .from(glSnapshots)
        .where(and(eq(glSnapshots.id, glSnapshotId), eq(glSnapshots.organizationId, orgId)))
        .limit(1)
    : [];

  if (glSnapshotId && !snapshot) return notFound(c, 'GL_SNAPSHOT_NOT_FOUND', 'GL snapshot not found');
  // boundary: `benchmarkFsliNames` is a jsonb column; only this feature writes it, always as a string[].
  const snapshotBenchmarks = (snapshot?.benchmarkFsliNames as string[] | null) ?? [];

  const rows = glSnapshotId
    ? await db.select().from(glRows).where(eq(glRows.snapshotId, glSnapshotId))
    : [];

  // Auto-populate qualitative factors from library
  const assessmentData: Record<string, Record<number, string>> = {};
  const uniqueFslis = Array.from(new Set(rows.map((r) => r.fsliName).filter((name): name is string => Boolean(name))));
  uniqueFslis.forEach((fsli) => {
    assessmentData[fsli] = getQualitativeDefaults(fsli);
  });

  if (glSnapshotId) {
    const problem = basisProblemForSnapshot({ benchmarks: snapshotBenchmarks, rows, basis });
    if (problem) {
      return bad(c, problem, 400, problem === 'MATERIALITY_BASIS_NOT_IN_SNAPSHOT'
        ? `Basis "${basis}" is not a benchmark of the selected GL snapshot`
        : `Basis "${basis}" derives no value from the selected GL snapshot`);
    }
  }

  const materiality = computeSimulationMateriality({
    rows, basis, omPercentage, haircutPercentage, locationCount, assessmentData,
  });

  const newSim: typeof simulations.$inferInsert = {
    id, organizationId: orgId,
    name: body.name || "New Simulation",
    year: targetYear,
    ...simulationStatusColumns('Draft'),
    omValue: materiality.omValue,
    pmValue: materiality.pmValue,
    significantAccounts: materiality.significantAccounts,
    glSnapshotId,
    locationCount,
    omPercentage,
    haircutPercentage,
    basis,
    assessmentData,
    createdAt: new Date(),
    createdBy: userId,
  };
  await db.insert(simulations).values(newSim);

  await new AuditService(db).logAction({
    organizationId: orgId,
    userId,
    action: 'CREATE',
    entityType: 'Simulation',
    entityId: id,
    description: `Created materiality simulation "${newSim.name}" (PM ${materiality.pmValue})`,
    dataAfter: newSim,
  });

  return ok(c, newSim);
});

simulationRoutes.put('/simulations/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id') as string;
  const orgId = c.get('organizationId');
  const body = await c.req.json<Partial<MaterialitySimulation>>();

  const [existingSim] = await db.select({ assessmentData: simulations.assessmentData, glSnapshotId: simulations.glSnapshotId })
    .from(simulations)
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)))
    .limit(1);

  let finalAssessment: Record<string, unknown> = body.assessmentData !== undefined
    ? { ...(body.assessmentData || {}) }
    : { ...((existingSim?.assessmentData as Record<string, unknown>) || {}) };

  const snapshotId = body.glSnapshotId || existingSim?.glSnapshotId;
  if (snapshotId && Object.keys(finalAssessment).length === 0) {
    const rows = await db.select({ fsliName: glRows.fsliName })
      .from(glRows)
      .where(eq(glRows.snapshotId, snapshotId));
    const uniqueFslis = Array.from(new Set(rows.map((r) => r.fsliName).filter((name): name is string => Boolean(name))));
    uniqueFslis.forEach(fsli => {
      finalAssessment[fsli] = getQualitativeDefaults(fsli);
    });
  }

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
      assessmentData: finalAssessment,
      updatedAt: new Date(),
    })
    .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  return ok(c, { success: true });
});

simulationRoutes.post('/simulations/:id/submit', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const scopingService = new ScopingService(db);
  const id = c.req.param('id') as string;
  const body = await c.req.json<Partial<MaterialitySimulation>>();

  try {
    const updated = await scopingService.submitSimulation(
      c.get('organizationId'),
      c.get('userId'),
      c.get('userRole'),
      id,
      body
    );
    return ok(c, updated);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    const status = (e as { status?: number })?.status;
    const message = e instanceof Error ? e.message : undefined;
    if (code === 'SIMULATION_NOT_FOUND' || status === 404) return notFound(c, code || 'SIMULATION_NOT_FOUND', message);
    if (e instanceof Error) return bad(c, 'SUBMIT_FAILED', 400, e.message);
    return bad(c, 'SUBMIT_FAILED', 400);
  }
});

simulationRoutes.delete('/simulations/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const userRole = c.get('userRole');

  const [sim] = await db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
  if (!sim) return notFound(c, 'Simulation not found');

  // An Approved simulation is not deleted directly (by anyone but Admin): the
  // `?bypassWorkflow=true` flag that used to allow it was a client-controlled
  // authorization decision and no client ever sent it. Go through the deletion
  // request instead.
  if (resolveSimulationStatus(sim) === 'Approved' && userRole !== 'Admin') {
    return bad(c, 'Cannot delete an Approved simulation directly. Please submit a Deletion Request for approval.', 403);
  }

  await db.delete(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));

  const auditService = new AuditService(db);
  await auditService.logAction({
    organizationId: orgId,
    userId: c.get('userId'),
    action: 'DELETE',
    entityType: 'Simulation',
    entityId: id,
    description: `Permanently deleted simulation "${sim.name}"`,
    dataBefore: sim
  });

  return ok(c, { success: true });
});

export default simulationRoutes;
