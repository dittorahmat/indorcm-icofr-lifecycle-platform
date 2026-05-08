import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  applications, vendors, socReports, socEvaluations
} from '../db/schema';
import { eq, and } from 'drizzle-orm';

const infrastructure = new Hono<HonoEnv>();

// --- Applications Routes ---

infrastructure.get('/applications', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(applications).where(eq(applications.organizationId, orgId));
  return ok(c, { items });
});

infrastructure.post('/applications', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  const id = crypto.randomUUID();
  
  await db.insert(applications).values({
    id,
    organizationId: orgId,
    name: body.name || "New Application",
    description: body.description,
    category: body.category || "ERP",
    itgcAreas: body.itgcAreas || [],
    isSignificant: body.isSignificant || false,
  });

  return ok(c, { id });
});

infrastructure.delete('/applications/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.organizationId, orgId)));
  return ok(c, { success: true });
});

// --- Vendors & SOC Reports Routes ---

infrastructure.get('/vendors', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(vendors).where(eq(vendors.organizationId, orgId));
  return ok(c, { items });
});

infrastructure.post('/vendors', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  const id = crypto.randomUUID();
  await db.insert(vendors).values({
    id, organizationId: orgId, name: body.name, serviceType: body.serviceType, riskRating: body.riskRating || 'Medium'
  });
  return ok(c, { id });
});

infrastructure.get('/soc-reports', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(socReports).where(eq(socReports.organizationId, orgId));
  return ok(c, { items });
});

infrastructure.post('/soc-reports', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  const id = crypto.randomUUID();
  await db.insert(socReports).values({
    id, organizationId: orgId, vendorId: body.vendorId, reportType: body.reportType, period: body.period, status: 'Pending Review'
  });
  return ok(c, { id });
});

infrastructure.post('/soc-reports/:id/evaluate', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const socReportId = c.req.param('id');
  const body = await c.req.json<any>();
  
  const id = crypto.randomUUID();
  await db.insert(socEvaluations).values({
    id,
    organizationId: orgId,
    socReportId,
    evaluatorId: c.get('userId'),
    period: body.period,
    conclusion: body.conclusion,
    notes: body.notes,
    createdAt: new Date(),
  });

  return ok(c, { id });
});

infrastructure.post('/soc-evaluations', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
  const id = crypto.randomUUID();
  await db.insert(socEvaluations).values({
    id,
    organizationId: orgId,
    socReportId: body.socReportId,
    evaluatorId: c.get('userId'),
    period: body.period,
    conclusion: body.conclusion,
    notes: body.notes,
    createdAt: new Date(),
  });

  return ok(c, { id });
});

export default infrastructure;
