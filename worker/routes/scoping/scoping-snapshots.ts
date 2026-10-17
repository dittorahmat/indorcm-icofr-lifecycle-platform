import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import {
  glSnapshots, glRows,
} from '../../db/schema';
import { ScopingService, type GlRowIngest } from '../../services/scoping-service';
import { eq, and, type SQL } from 'drizzle-orm';

const snapshotRoutes = new Hono<HonoEnv>();

// --- GL Snapshots ---

snapshotRoutes.get('/gl-snapshots', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const yearStr = c.req.query('year');

  let conditions: SQL = eq(glSnapshots.organizationId, orgId);
  if (yearStr) {
    const yearVal = parseInt(yearStr);
    if (!isNaN(yearVal)) {
      conditions = and(eq(glSnapshots.organizationId, orgId), eq(glSnapshots.year, yearVal)) as SQL;
    }
  }

  const items = await db.select().from(glSnapshots).where(conditions);
  return ok(c, { items });
});

snapshotRoutes.post('/gl-snapshots', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  // Boundary payload: the upload template's columns vary per GL extract, so
  // extra columns are dropped by this explicit row map.
  const { filename, rows, year } = await c.req.json<{ filename: string, rows: GlRowIngest[], year?: number | null }>();

  const { id, uploadDate } = await new ScopingService(db).createGlSnapshot(orgId, {
    filename,
    year,
    status: 'Draft',
    isActive: false,
    rows: rows.map((row) => ({
      ymd: row.ymd,
      entityCode: row.entityCode,
      parentEntityCode: row.parentEntityCode,
      entityId: row.entityId,
      noGL: row.noGL,
      glDesc: row.glDesc,
      currency: row.currency,
      balance: row.balance,
      fsliBalance: row.fsliBalance,
      fsliCode: row.fsliCode,
      fsliName: row.fsliName,
      category: row.category,
      subKategori: row.subKategori,
      noUrut: row.noUrut,
      assignedDepartmentIds: row.assignedDepartmentIds || [],
      ownerAcceptance: row.ownerAcceptance,
    })),
  });

  return ok(c, { id, filename, uploadDate, status: 'Draft' });
});

snapshotRoutes.get('/gl-snapshots/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const item = await db.select().from(glSnapshots).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId))).limit(1);
  if (item.length === 0) return notFound(c);

  const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, id));

  return ok(c, {
    ...item[0],
    rows
  });
});

snapshotRoutes.put('/gl-snapshots/:id/mapping', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<{ benchmarkFsliNames: string[] }>();

  await db.update(glSnapshots)
    .set({ benchmarkFsliNames: body.benchmarkFsliNames, status: 'Mapped' })
    .where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));

  return ok(c, { success: true });
});

snapshotRoutes.post('/gl-snapshots/:id/set-active', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  // Single owner of the activation rule (+ its audit entry).
  await new ScopingService(db).setActiveSnapshot(orgId, c.get('userId'), id);

  return ok(c, { success: true });
});

snapshotRoutes.get('/gl-snapshots/:id/rows', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const items = await db.select().from(glRows).where(and(eq(glRows.snapshotId, id), eq(glRows.organizationId, orgId)));
  return ok(c, { items });
});

snapshotRoutes.delete('/gl-snapshots/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  await db.delete(glSnapshots).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));
  // Cascade will handle glRows
  return ok(c, { success: true });
});

// --- GL Rows ---

snapshotRoutes.put('/gl-rows/:noGL/owner-acceptance', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const noGL = c.req.param('noGL');
  const { ownerAcceptance } = await c.req.json<{ ownerAcceptance: 'Accepted' | 'Rejected' }>();

  await db.update(glRows)
    .set({ ownerAcceptance })
    .where(and(eq(glRows.noGL, noGL), eq(glRows.organizationId, orgId)));

  return ok(c, { success: true });
});

export default snapshotRoutes;
