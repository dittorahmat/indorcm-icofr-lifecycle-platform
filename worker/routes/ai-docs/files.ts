import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getStorageBucket } from '../../lib/storage';
import { rbac } from '../../lib/guard';
import { getDb } from '../../db';
import { applications } from '../../db/schema';
import { and, eq } from 'drizzle-orm';

const aiFilesApp = new Hono<HonoEnv>();

// --- File Handling Routes ---

// A raw blob upload (no entity): evidence and attachments from every line use it.
aiFilesApp.post('/upload', rbac(['Line 1', 'Line 2', 'Admin']), async (c) => {
  const orgId = c.get('organizationId');
  if (!orgId) return bad(c, 'Organization ID required');

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) return bad(c, 'File is required');

    const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const key = `uploads/${orgId}/${crypto.randomUUID()}-${safeFileName}`;
    const bucket = getStorageBucket(c);
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    });

    return ok(c, { url: `/api/files/${key}` });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[API] Upload Error:', detail);
    return bad(c, `Upload failed: ${detail}`, 500);
  }
});

aiFilesApp.get('/files/*', async (c) => {
  const userId = c.get('userId');
  const orgId = c.get('organizationId');

  if (!userId || !orgId) {
    return bad(c, 'UNAUTHORIZED', 401, 'Authentication required to view files');
  }

  // Use split to reliably get everything after /files/ regardless of mount point
  const pathParts = c.req.path.split('/files/');
  let key = pathParts.length > 1 ? pathParts[1] : null;

  if (!key) return bad(c, 'KEY_REQUIRED', 400, 'Key is required');

  // Ensure the key is decoded (e.g., %20 -> space) to match R2 storage keys
  key = decodeURIComponent(key);

  // Tenant Boundary Check: verify key belongs to caller's organization
  if (key.startsWith('uploads/')) {
    const expectedPrefix = `uploads/${orgId}/`;
    if (!key.startsWith(expectedPrefix)) {
      return bad(c, 'FILE_CROSS_TENANT_FORBIDDEN', 403, 'Access denied: File belongs to another organization');
    }
  } else if (key.startsWith('applications/')) {
    const parts = key.split('/');
    const appId = parts.length > 1 ? parts[1] : '';
    const db = getDb(c.env.DATABASE_URL);
    const [appRow] = await db.select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, appId), eq(applications.organizationId, orgId)))
      .limit(1);

    if (!appRow) {
      return bad(c, 'FILE_CROSS_TENANT_FORBIDDEN', 403, 'Access denied: Application file belongs to another organization');
    }
  } else {
    return bad(c, 'FILE_ACCESS_DENIED', 403, 'Access denied: Invalid file path');
  }

  const bucket = getStorageBucket(c);
  const object = await bucket.get(key);
  if (!object) return notFound(c, 'FILE_NOT_FOUND', 'File not found');

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  // Security Headers: Prevent XSS from user-controlled files (especially SVG / HTML)
  const lowerKey = key.toLowerCase();
  const rawFileName = key.split('/').pop() || 'download';
  const isScriptable = lowerKey.endsWith('.svg') || lowerKey.endsWith('.html') || lowerKey.endsWith('.htm') || lowerKey.endsWith('.xml');

  if (isScriptable) {
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(rawFileName)}"`);
    headers.set('Content-Type', 'application/octet-stream');
  } else {
    headers.set('Content-Disposition', 'inline');
  }

  headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(object.body, { headers });
});

export default aiFilesApp;
