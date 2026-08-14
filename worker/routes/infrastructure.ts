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
    criticality: body.criticality || "Medium",
    itgcAreas: body.itgcAreas || [],
    isSignificant: body.isSignificant ?? false,
    businessOwners: body.businessOwners || [],
    applicationOwners: body.applicationOwners || [],
    architectureDocUrl: body.architectureDocUrl || null,
    architectureDocName: body.architectureDocName || null,
  });

  return ok(c, { id });
});

infrastructure.patch('/applications/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();

  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.criticality !== undefined) updateData.criticality = body.criticality;
  if (body.statusITGC !== undefined) updateData.statusITGC = body.statusITGC;
  if (body.isSignificant !== undefined) updateData.isSignificant = body.isSignificant;
  if (body.itgcAreas !== undefined) updateData.itgcAreas = body.itgcAreas;
  if (body.businessOwners !== undefined) updateData.businessOwners = body.businessOwners;
  if (body.applicationOwners !== undefined) updateData.applicationOwners = body.applicationOwners;
  if (body.architectureDocUrl !== undefined) updateData.architectureDocUrl = body.architectureDocUrl;
  if (body.architectureDocName !== undefined) updateData.architectureDocName = body.architectureDocName;

  await db.update(applications)
    .set(updateData)
    .where(and(eq(applications.id, id), eq(applications.organizationId, orgId)));

  return ok(c, { success: true });
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
    id, 
    organizationId: orgId, 
    name: body.name, 
    serviceType: body.serviceType, 
    contactPerson: body.contactPerson
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
  
  // Get vendor name for denormalization
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, body.vendorId));
  
  const id = crypto.randomUUID();
  await db.insert(socReports).values({
    id, 
    organizationId: orgId, 
    vendorId: body.vendorId, 
    vendorName: vendor?.name || 'Unknown',
    reportType: body.reportType, 
    periodStart: new Date(body.periodStart),
    periodEnd: new Date(body.periodEnd),
    fileUrl: body.fileUrl,
    status: 'Pending Review'
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
    evaluatedBy: c.get('userId'),
    attrA: body.attrA ?? false,
    attrB: body.attrB ?? false,
    attrC: body.attrC ?? false,
    attrD: body.attrD ?? false,
    attrE: body.attrE ?? false,
    attrF: body.attrF ?? false,
    attrG: body.attrG ?? false,
    auditorOpinion: body.auditorOpinion || "",
    evaluatedAt: new Date(),
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
    evaluatedBy: c.get('userId'),
    attrA: body.attrA ?? false,
    attrB: body.attrB ?? false,
    attrC: body.attrC ?? false,
    attrD: body.attrD ?? false,
    attrE: body.attrE ?? false,
    attrF: body.attrF ?? false,
    attrG: body.attrG ?? false,
    auditorOpinion: body.auditorOpinion || "",
    evaluatedAt: new Date(),
  });

  return ok(c, { id });
});

export default infrastructure;
