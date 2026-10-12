import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getStorageBucket } from '../../lib/storage';

const aiFilesApp = new Hono<HonoEnv>();

// --- File Handling Routes ---

aiFilesApp.post('/upload', async (c) => {
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
  // Use split to reliably get everything after /files/ regardless of mount point
  const pathParts = c.req.path.split('/files/');
  let key = pathParts.length > 1 ? pathParts[1] : null;

  if (!key) return bad(c, 'Key is required');

  // Ensure the key is decoded (e.g., %20 -> space) to match R2 storage keys
  key = decodeURIComponent(key);

  const bucket = getStorageBucket(c);
  const object = await bucket.get(key);
  if (!object) return notFound(c, 'File not found');

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Content-Disposition', 'inline');

  return new Response(object.body, { headers });
});

export default aiFilesApp;
