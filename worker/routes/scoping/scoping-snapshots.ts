import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import {
  glSnapshots, glRows,
} from '../../db/schema';
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
  // Boundary rows keep the legacy `any` element type (grandfathered): the
  // upload payload shape varies per GL template version.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { filename, rows, year } = await c.req.json<{ filename: string, rows: any[], year?: number }>();

  const snapshotId = crypto.randomUUID();
  const now = new Date();

  // 1. Create the snapshot record
  await db.insert(glSnapshots).values({
    id: snapshotId,
    organizationId: orgId,
    filename,
    uploadDate: now,
    status: 'Draft',
    isActive: false,
    year: year ? parseInt(String(year)) : null,
    benchmarkFsliNames: null,
  });

  // 2. Insert rows in batches to avoid overwhelming the DB
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map((r) => ({
      id: crypto.randomUUID(),
      snapshotId,
      organizationId: orgId,
      ymd: r.ymd,
      entityCode: r.entityCode,
      noGL: r.noGL,
      glDesc: r.glDesc,
      currency: r.currency,
      balance: r.balance,
      fsliBalance: r.fsliBalance,
      fsliCode: r.fsliCode,
      fsliName: r.fsliName,
      category: r.category,
      subKategori: r.subKategori,
      noUrut: r.noUrut,
      assignedDepartmentIds: r.assignedDepartmentIds || [],
      ownerAcceptance: r.ownerAcceptance
    }));
    await db.insert(glRows).values(batch);
  }

  return ok(c, { id: snapshotId, filename, uploadDate: now, status: 'Draft' });
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

  // Reset all to false first
  await db.update(glSnapshots).set({ isActive: false }).where(eq(glSnapshots.organizationId, orgId));
  // Set current to true
  await db.update(glSnapshots).set({ isActive: true }).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));

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
