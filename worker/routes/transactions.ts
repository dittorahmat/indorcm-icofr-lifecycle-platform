import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  transactionDetails, transactionUploads
} from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

const transactions = new Hono<HonoEnv>();

// --- Transaction Details Routes ---

transactions.get('/transaction-details', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const noGL = c.req.query('noGL');

  let conditions = eq(transactionDetails.organizationId, orgId);

  // --- STRICT ISOLATION LOGIC ---
  if (noGL) {
    conditions = and(conditions, eq(transactionDetails.noGL, noGL)) as any;
  }

  const items = await db.select().from(transactionDetails).where(conditions).limit(1000);
  return ok(c, { items });
});

transactions.post('/transaction-details', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  const id = crypto.randomUUID();
  await db.insert(transactionDetails).values({ id, organizationId: orgId, ...body });
  return ok(c, { id });
});

transactions.delete('/transaction-details/:noGL', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const noGL = c.req.param('noGL');
  await db.delete(transactionDetails).where(and(eq(transactionDetails.noGL, noGL), eq(transactionDetails.organizationId, orgId)));
  return ok(c, { success: true });
});

transactions.post('/transaction-details/upload', async (c) => {
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
