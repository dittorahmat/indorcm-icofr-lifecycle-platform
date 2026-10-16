import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import { getStorageBucket } from '../../lib/storage';
import { documents, documentDepartments, documentGls, documentFslis, documentChunks } from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { AIService, invalidateAiCachesForOrg } from '../../services/ai-service';

const aiDocumentsApp = new Hono<HonoEnv>();

// --- Knowledge Base Document Routes ---

aiDocumentsApp.get('/documents', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const role = c.get('userRole');
  const userDeptId = c.get('departmentId');

  if (role === 'Line 1') {
    const docs = await db.execute(sql`
      SELECT DISTINCT d.*
      FROM documents d
      LEFT JOIN document_departments dd ON d.id = dd.document_id
      WHERE d.organization_id = ${orgId}
      AND (
        d.type = 'External'
        OR (d.type = 'Internal' AND (dd.department_id = ${userDeptId}))
      )
      ORDER BY d.created_at DESC
    `);
    return ok(c, { items: docs.rows });
  }

  const items = await db.select().from(documents)
    .orderBy(desc(documents.createdAt));

  return ok(c, { items });
});

aiDocumentsApp.post('/documents', async (c) => {
  const role = c.get('userRole');
  if (role !== 'Admin' && role !== 'Line 2') return bad(c, 'Access Denied');

  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) return bad(c, 'File is required');

    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    let content = formData.get('content') as string || '';
    const deptIds = JSON.parse(formData.get('departmentIds') as string || '[]');
    const glCodes = JSON.parse(formData.get('glCodes') as string || '[]');
    const fsliCodes = JSON.parse(formData.get('fsliCodes') as string || '[]');

    const arrayBuffer = await file.arrayBuffer();

    // Server-side PDF extraction fallback if content from frontend is empty
    if (!content || content.trim().length === 0) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const { extractText } = await import('unpdf');
          const extracted = await extractText(new Uint8Array(arrayBuffer));
          content = Array.isArray(extracted.text) ? extracted.text.join('\n') : (extracted.text || '');
          console.log('[API] Server-side PDF extraction fallback succeeded, extracted text length:', content.length);
        } catch (pdfErr: unknown) {
          console.warn('[API] Server-side PDF extraction fallback failed:', pdfErr instanceof Error ? pdfErr.message : String(pdfErr));
        }
      }
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const key = `docs/${orgId}/${crypto.randomUUID()}-${safeFileName}`;
    const bucket = getStorageBucket(c);
    await bucket.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const docId = crypto.randomUUID();
    const apiKey = c.env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');

    const newDoc = {
      id: docId,
      organizationId: orgId,
      title: title || safeFileName,
      type,
      category,
      content,
      fileUrl: key,
      status: 'processing',
      indexingProgress: 0,
      createdBy: userId,
      createdAt: new Date(),
    };

    await db.insert(documents).values(newDoc);

    for (const dId of deptIds) {
      await db.insert(documentDepartments).values({ id: crypto.randomUUID(), organizationId: orgId, documentId: docId, departmentId: dId });
    }
    for (const gCode of glCodes) {
      await db.insert(documentGls).values({ id: crypto.randomUUID(), organizationId: orgId, documentId: docId, glCode: gCode });
    }
    for (const fCode of fsliCodes) {
      await db.insert(documentFslis).values({ id: crypto.randomUUID(), organizationId: orgId, documentId: docId, fsliCode: fCode });
    }

    const processDocumentAsync = async () => {
      // Granular RAG Chunking
      if (apiKey && content) {
        try {
          const aiService = new AIService({
            provider: c.env.AI_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'gemini',
            apiKey: apiKey,
            baseUrl: c.env.AI_BASE_URL,
            embeddingModel: c.env.AI_EMBEDDING_MODEL,
            chatModel: c.env.AI_CHAT_MODEL,
            // Indexing path is explicitly unversioned: chunks are written before the KB marker exists.
            cacheScope: { orgId, kbVersion: '', simulationId: '' },
            ttlEnv: {
              AI_CACHE_TTL_EMBEDDING_MS: c.env.AI_CACHE_TTL_EMBEDDING_MS,
              AI_CACHE_TTL_RETRIEVAL_MS: c.env.AI_CACHE_TTL_RETRIEVAL_MS,
            },
          });
          const chunks = AIService.splitIntoChunks(content);

          for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const embedding = await aiService.generateEmbedding(chunkContent);

            await db.insert(documentChunks).values({
              id: crypto.randomUUID(),
              organizationId: orgId,
              documentId: docId,
              content: chunkContent,
              embedding,
              ftsTokens: sql`to_tsvector('indonesian', ${chunkContent})`,
              metadata: { pagePart: i + 1 }
            });

            const currentProgress = Math.min(99, Math.round(((i + 1) / chunks.length) * 100));
            await db.update(documents)
              .set({ indexingProgress: currentProgress })
              .where(eq(documents.id, docId));

            // Small delay for rate limits in 2026 free-tier if applicable
            if (chunks.length > 1) await new Promise(r => setTimeout(r, 100));
          }

          // Mark indexing as completed
          await db.update(documents)
            .set({ status: 'completed', indexingProgress: 100 })
            .where(eq(documents.id, docId));

        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : String(err);
          console.error('[API] Granular RAG processing failed:', detail);
          await db.update(documents)
            .set({ status: 'completed', indexingProgress: 100 })
            .where(eq(documents.id, docId));
        }
      } else {
        await db.update(documents)
          .set({ status: 'completed', indexingProgress: 100 })
          .where(eq(documents.id, docId));
      }
    };

    let executedInCtx = false;
    try {
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(processDocumentAsync());
        executedInCtx = true;
      }
    } catch {
      // In Node.js / on-premise runtime, accessing c.executionCtx throws "This context has no ExecutionContext"
      executedInCtx = false;
    }

    if (!executedInCtx) {
      // Fire-and-forget background execution for Node.js on-premise runtime
      processDocumentAsync().catch((err: unknown) => {
        console.error('[API] Background document RAG processing failed:', err instanceof Error ? err.message : String(err));
      });
    }

    // KB changed: drop this org's chat/retrieval/suggest caches (version bump covers reads too).
    invalidateAiCachesForOrg(orgId);

    return ok(c, { ...newDoc, success: true });

  } catch (error: unknown) {
    return bad(c, `Upload failed: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
});

aiDocumentsApp.delete('/documents/:id', async (c) => {
  const role = c.get('userRole');
  if (role !== 'Admin' && role !== 'Line 2') return bad(c, 'Access Denied: Only Admin or Line 2 can delete documents');

  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  const existing = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c);

  if (existing[0].fileUrl) {
    const bucket = getStorageBucket(c);
    await bucket.delete(existing[0].fileUrl);
  }

  await db.delete(documents).where(eq(documents.id, id));

  // KB changed: drop this org's chat/retrieval/suggest caches.
  invalidateAiCachesForOrg(orgId);

  return ok(c, { success: true });
});

aiDocumentsApp.get('/documents/download/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const mode = c.req.query('mode');

  const existing = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c);

  if (!existing[0].fileUrl) return bad(c, 'File not found');

  const bucket = getStorageBucket(c);
  const object = await bucket.get(existing[0].fileUrl);
  if (!object) return notFound(c, 'File not found in storage');

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  if (mode === 'view') {
    headers.set('Content-Disposition', 'inline');
  } else {
    headers.set('Content-Disposition', `attachment; filename="${existing[0].title}.pdf"`);
  }

  return new Response(object.body, { headers });
});

export default aiDocumentsApp;
