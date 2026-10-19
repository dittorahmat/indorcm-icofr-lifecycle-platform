import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { rbac } from '../lib/guard';
import { getDb } from '../db';
import { 
  applications, applicationDocuments, controls, user, vendors, socReports
} from '../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getStorageBucket } from '../lib/storage';
import { createSocEvaluation, type SocEvaluationBody } from '../services/soc-evaluation';

const infrastructure = new Hono<HonoEnv>();

// --- Applications Routes ---

infrastructure.get('/applications', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(applications).where(eq(applications.organizationId, orgId));
  return ok(c, { items });
});

infrastructure.post('/applications', rbac(['Line 1', 'Admin']), async (c) => {
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

  return ok(c, { id, name: body.name || "New Application" });
});

infrastructure.patch('/applications/:id', rbac(['Line 1', 'Admin']), async (c) => {
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

infrastructure.delete('/applications/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.organizationId, orgId)));
  return ok(c, { success: true });
});

// --- Application Documents (ITGC Evidence Repository) ---

infrastructure.get('/applications/:id/documents', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const appId = c.req.param('id');
  const orgId = c.get('organizationId');
  const itgcArea = c.req.query('itgcArea');

  const conditions = [
    eq(applicationDocuments.organizationId, orgId),
    eq(applicationDocuments.applicationId, appId)
  ];
  if (itgcArea) {
    conditions.push(eq(applicationDocuments.itgcArea, itgcArea));
  }

  const items = await db.select()
    .from(applicationDocuments)
    .where(and(...conditions))
    .orderBy(desc(applicationDocuments.uploadedAt));

  return ok(c, { items });
});

infrastructure.post('/applications/:id/documents/upload', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const appId = c.req.param('id');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const itgcArea = formData.get('itgcArea') as string;
    const notes = formData.get('notes') as string;

    if (!file) return bad(c, 'File is required');
    if (!itgcArea) return bad(c, 'ITGC area is required');

    // Get current user name for uploader logging
    let uploaderName = 'System User';
    if (userId) {
      const [currentUser] = await db.select().from(user).where(eq(user.id, userId));
      if (currentUser?.name) {
        uploaderName = currentUser.name;
      }
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const docId = crypto.randomUUID();
    const storageKey = `applications/${appId}/${itgcArea.replace(/[^a-zA-Z0-9]/g, '_')}/${docId}-${safeFileName}`;

    const bucket = getStorageBucket(c);
    await bucket.put(storageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' }
    });

    const fileUrl = `/api/files/${encodeURIComponent(storageKey)}`;

    await db.insert(applicationDocuments).values({
      id: docId,
      organizationId: orgId,
      applicationId: appId,
      itgcArea,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadedBy: userId || null,
      uploadedByName: uploaderName,
      uploadedAt: new Date(),
      notes: notes || null,
    });

    return ok(c, { 
      id: docId, 
      fileName: file.name, 
      fileUrl, 
      fileSize: file.size, 
      uploadedByName: uploaderName,
      uploadedAt: new Date() 
    });
  } catch (err: any) {
    console.error('[Application Document Upload Error]:', err);
    return bad(c, `Upload failed: ${err.message || String(err)}`, 500);
  }
});

infrastructure.delete('/applications/:id/documents/:docId', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const appId = c.req.param('id');
  const docId = c.req.param('docId');
  const orgId = c.get('organizationId');

  const [doc] = await db.select().from(applicationDocuments).where(and(
    eq(applicationDocuments.id, docId),
    eq(applicationDocuments.applicationId, appId),
    eq(applicationDocuments.organizationId, orgId)
  ));

  if (!doc) {
    return notFound(c, 'Document not found');
  }

  // Attempt to delete from storage if URL is internal
  if (doc.fileUrl && doc.fileUrl.startsWith('/api/files/')) {
    try {
      const storageKey = decodeURIComponent(doc.fileUrl.replace('/api/files/', ''));
      const bucket = getStorageBucket(c);
      await bucket.delete(storageKey);
    } catch (e) {
      console.warn('Could not delete storage file:', e);
    }
  }

  await db.delete(applicationDocuments).where(and(
    eq(applicationDocuments.id, docId),
    eq(applicationDocuments.organizationId, orgId)
  ));

  return ok(c, { success: true });
});

// --- Linked Controls for Application (TLC & ITGC) ---

infrastructure.get('/applications/:id/controls', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const appId = c.req.param('id');
  const orgId = c.get('organizationId');

  // Find app name for fallback matching with legacy text field
  const [app] = await db.select().from(applications).where(and(
    eq(applications.id, appId),
    eq(applications.organizationId, orgId)
  ));

  if (!app) {
    return notFound(c, 'Application not found');
  }

  const appName = app.name;

  // Query controls matching appId or supportingApp / itApplication text
  const matchedControls = await db.select()
    .from(controls)
    .where(and(
      eq(controls.organizationId, orgId),
      or(
        eq(controls.applicationId, appId),
        eq(controls.supportingApp, appName),
        eq(controls.itApplication, appName)
      )
    ));

  const tlcControls = matchedControls.filter(ctrl => ctrl.level === 'TLC' || (!ctrl.level && ctrl.code?.startsWith('TLC')));
  const itgcControls = matchedControls.filter(ctrl => ctrl.level === 'ITGC' || (!ctrl.level && (ctrl.code?.startsWith('ITGC') || ctrl.itgcDomain)));

  return ok(c, { 
    application: app,
    tlcControls, 
    itgcControls,
    totalControls: matchedControls.length 
  });
});

// --- Vendors & SOC Reports Routes ---

infrastructure.get('/vendors', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(vendors).where(eq(vendors.organizationId, orgId));
  return ok(c, { items });
});

infrastructure.post('/vendors', rbac(['Line 1', 'Admin']), async (c) => {
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

infrastructure.post('/soc-reports', rbac(['Line 1', 'Admin']), async (c) => {
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

infrastructure.post('/soc-reports/:id/evaluate', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<SocEvaluationBody>();

  const created = await createSocEvaluation(db, {
    orgId,
    userId: c.get('userId'),
    socReportId: c.req.param('id'),
    body,
  });
  if (created.outcome === 'rejected') {
    return bad(c, created.code, created.httpStatus, created.message);
  }

  return ok(c, { id: created.id });
});

infrastructure.post('/soc-evaluations', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<SocEvaluationBody>();

  const created = await createSocEvaluation(db, {
    orgId,
    userId: c.get('userId'),
    socReportId: body.socReportId,
    body,
  });
  if (created.outcome === 'rejected') {
    return bad(c, created.code, created.httpStatus, created.message);
  }

  return ok(c, { id: created.id });
});

export default infrastructure;
