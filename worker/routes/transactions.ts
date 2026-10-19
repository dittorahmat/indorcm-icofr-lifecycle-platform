import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { rbac } from '../lib/guard';
import { getDb } from '../db';
import {
  transactionDetails, transactionUploads
} from '../db/schema';
import { eq, and, sql, gte, lte, SQL } from 'drizzle-orm';

const transactions = new Hono<HonoEnv>();

// --- Transaction Details Routes ---

transactions.get('/transaction-details', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const noGL = c.req.query('noGL');
  const year = c.req.query('year');
  const bpmProcessId = c.req.query('bpmProcessId');

  let conditions = eq(transactionDetails.organizationId, orgId);

  // --- STRICT ISOLATION LOGIC ---
  if (noGL) {
    conditions = and(conditions, eq(transactionDetails.noGL, noGL)) as any;
  }

  if (bpmProcessId && bpmProcessId !== 'undefined' && bpmProcessId !== 'null') {
    conditions = and(conditions, eq(transactionDetails.bpmProcessId, bpmProcessId)) as any;
  }

  if (year) {
    const targetYear = parseInt(year);
    if (!isNaN(targetYear)) {
      const startDate = new Date(`${targetYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${targetYear}-12-31T23:59:59.999Z`);
      conditions = and(conditions, gte(transactionDetails.transDate, startDate), lte(transactionDetails.transDate, endDate)) as any;
    }
  }

  const items = await db.select().from(transactionDetails).where(conditions).limit(1000);
  return ok(c, { items });
});

transactions.post('/transaction-details', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<{ 
    rows: any[], 
    noGL: string, 
    mode?: 'replace' | 'append',
    filename?: string,
    bpmProcessId?: string
  }>();

  if (!body.rows || !Array.isArray(body.rows)) {
    return bad(c, 'Rows must be an array');
  }

  // Handle Replace mode
  if (body.mode === 'replace' && body.noGL) {
    const deleteConditions = and(
      eq(transactionDetails.noGL, body.noGL),
      eq(transactionDetails.organizationId, orgId),
      body.bpmProcessId ? eq(transactionDetails.bpmProcessId, body.bpmProcessId) : undefined
    );
    await db.delete(transactionDetails).where(deleteConditions);
  }

  // Batch Insert
  if (body.rows.length > 0) {
    // Process rows to ensure UUIDs and orgId
    const toInsert = body.rows.map(row => ({
      ...row,
      id: crypto.randomUUID(),
      organizationId: orgId,
      bpmProcessId: row.bpmProcessId || body.bpmProcessId || null,
      // Ensure date objects for timestamp columns
      transDate: row.transDate ? new Date(row.transDate) : null
    }));

    // Chunking to avoid parameter limits if necessary (though D1 handles large batches fairly well)
    // We'll insert in chunks of 100
    for (let i = 0; i < toInsert.length; i += 100) {
      const chunk = toInsert.slice(i, i + 100);
      await db.insert(transactionDetails).values(chunk);
    }
  }

  // Log to uploads if filename provided
  if (body.filename && body.noGL) {
    await db.insert(transactionUploads).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      noGL: body.noGL,
      filename: body.filename,
      rowCount: body.rows.length,
      uploadedBy: c.get('userId'),
      createdAt: new Date(),
    });
  }

  return ok(c, { count: body.rows.length });
});

transactions.delete('/transaction-details/:noGL', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const noGL = c.req.param('noGL');
  const bpmProcessId = c.req.query('bpmProcessId');

  const deleteConditions = and(
    eq(transactionDetails.noGL, noGL),
    eq(transactionDetails.organizationId, orgId),
    bpmProcessId && bpmProcessId !== 'undefined' ? eq(transactionDetails.bpmProcessId, bpmProcessId) : undefined
  );

  await db.delete(transactionDetails).where(deleteConditions);
  return ok(c, { success: true });
});

transactions.get('/transaction-uploads', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const noGL = c.req.query('noGL');

  let conditions: SQL = eq(transactionUploads.organizationId, orgId);
  if (noGL) {
    conditions = and(conditions, eq(transactionUploads.noGL, noGL)) as SQL;
  }

  const items = await db.select().from(transactionUploads).where(conditions);
  return ok(c, { items });
});

transactions.post('/transaction-details/upload', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
  const id = crypto.randomUUID();
  await db.insert(transactionUploads).values({
    id,
    organizationId: orgId,
    noGL: body.noGL,
    filename: body.fileName,
    rowCount: body.rowCount || 0,
    uploadedBy: c.get('userId'),
    createdAt: new Date(),
  });

  return ok(c, { id });
});

export default transactions;
