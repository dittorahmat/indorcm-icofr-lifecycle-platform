import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { documents, documentDepartments, documentGls, documentFslis, user } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getDocumentProxy, extractText } from "unpdf";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ICOFR_KNOWLEDGE_BASE } from '../knowledge-base';

const aiDocsApp = new Hono<HonoEnv>();

const rateLimitStore = new Map<string, { count: number; resetDate: number }>();

// --- Knowledge Base Document Routes ---

aiDocsApp.get('/documents', async (c) => {
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

aiDocsApp.post('/documents', async (c) => {
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
    const deptIds = JSON.parse(formData.get('departmentIds') as string || '[]');
    const glCodes = JSON.parse(formData.get('glCodes') as string || '[]');
    const fsliCodes = JSON.parse(formData.get('fsliCodes') as string || '[]');

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let extractedText = "";
    try {
      const pdf = await getDocumentProxy(uint8Array, {
        cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/",
        cMapPacked: true,
        standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/",
      });
      
      const result = await extractText(pdf, { mergePages: true });
      extractedText = result.text || "";
    } catch (e: any) {
      console.error('[API] PDF extraction failed:', e.message);
    }

    const key = `docs/${orgId}/${crypto.randomUUID()}-${file.name}`;
    await c.env.DOCUMENTS_BUCKET.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const docId = crypto.randomUUID();
    const newDoc = {
      id: docId,
      organizationId: orgId,
      title: title || file.name,
      type,
      category,
      content: extractedText,
      fileUrl: key,
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

    return ok(c, { ...newDoc, success: true });

  } catch (error: any) {
    return bad(c, `Upload failed: ${error.message}`, 500);
  }
});

aiDocsApp.delete('/documents/:id', async (c) => {
  const role = c.get('userRole');
  if (role !== 'Admin' && role !== 'Line 2') return bad(c, 'Access Denied: Only Admin or Line 2 can delete documents');

  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  const existing = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c);

  if (existing[0].fileUrl) {
    await c.env.DOCUMENTS_BUCKET.delete(existing[0].fileUrl);
  }

  await db.delete(documents).where(eq(documents.id, id));
  
  return ok(c, { success: true });
});

aiDocsApp.get('/documents/download/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const mode = c.req.query('mode');

  const existing = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c);

  if (!existing[0].fileUrl) return bad(c, 'File not found');

  const object = await c.env.DOCUMENTS_BUCKET.get(existing[0].fileUrl);
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

// --- AI Chatbot Routes ---

aiDocsApp.post('/ai/chat', async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return bad(c, 'GEMINI_API_KEY not configured.');
  }

  let body: { message: string; conversationHistory?: Array<{ role: string; content: string }> };
  try {
    body = await c.req.json();
  } catch (e) {
    return bad(c, 'Invalid request body');
  }

  const { message, conversationHistory = [] } = body;

  const clientId = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const dayMs = 86400000;

  let rateLimitData = rateLimitStore.get(clientId);
  if (!rateLimitData || now > rateLimitData.resetDate) {
    rateLimitData = { count: 0, resetDate: now + dayMs };
    rateLimitStore.set(clientId, rateLimitData);
  }

  if (rateLimitData.count >= 100) {
    return bad(c, 'Rate limit exceeded.', 429);
  }

  rateLimitData.count++;

  const context = (body as any).context;
  const pageContext = context?.path ? `\nPengguna saat ini sedang melihat halaman: ${context.path}` : '';

  const role = c.get('userRole');
  const userDeptId = c.get('departmentId');
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');

  let relevantDocs: any[] = [];
  try {
    if (role === 'Line 1') {
      const docsResult = await db.execute(sql`
        SELECT DISTINCT d.content, d.title
        FROM documents d
        LEFT JOIN document_departments dd ON d.id = dd.document_id
        WHERE d.organization_id = ${orgId}
        AND (
          d.type = 'External' 
          OR (d.type = 'Internal' AND dd.department_id = ${userDeptId})
        )
      `);
      relevantDocs = docsResult.rows;
    } else {
      relevantDocs = await db.select({ content: documents.content, title: documents.title })
        .from(documents)
        .where(eq(documents.organizationId, orgId));
    }
  } catch (e) {
    console.error('Failed to fetch dynamic knowledge:', e);
  }

  const dynamicKnowledge = relevantDocs
    .filter(d => d.content)
    .map(d => `--- DOKUMEN: ${d.title} ---\n${d.content}\n`)
    .join('\n\n');

  const knowledgeBase = dynamicKnowledge || ICOFR_KNOWLEDGE_BASE;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: `Anda adalah Asisten AI ICOFR yang membantu pengguna memahami regulasi Pengendalian Internal atas Pelaporan Keuangan (ICOFR) berdasarkan dokumen perusahaan dan regulasi pemerintah.

Jawablah pertanyaan dengan akurat berdasarkan dokumen yang disediakan di bawah ini.
Jika dokumen menyebutkan nomor pasal atau bab, sertakan dalam jawaban.
${pageContext}

Jika pertanyaan tidak terkait ICOFR atau dokumen yang disediakan, jawab dengan sopan bahwa Anda hanya dapat membantu pertanyaan terkait ICOFR sesuai dokumen yang Anda miliki.

Bahasa: Bahasa Indonesia

--- KNOWLEDGE BASE ---
${knowledgeBase}
--- END KNOWLEDGE BASE ---`
    });

    const recentHistory = conversationHistory.slice(-10);
    const chat = model.startChat({
      history: recentHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const responseText = response.text();

    return ok(c, {
      response: responseText,
      sources: []
    });

  } catch (error: any) {
    return bad(c, `AI service error: ${error.message}`, 500);
  }
});

// --- File Handling Routes ---

aiDocsApp.post('/upload', async (c) => {
  const orgId = c.get('organizationId');
  if (!orgId) return bad(c, 'Organization ID required');

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) return bad(c, 'File is required');

    const key = `uploads/${orgId}/${crypto.randomUUID()}-${file.name}`;
    await c.env.DOCUMENTS_BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    });

    return ok(c, { url: `/api/files/${key}` });
  } catch (err: any) {
    console.error('[API] Upload Error:', err);
    return bad(c, `Upload failed: ${err.message}`, 500);
  }
});

aiDocsApp.get('/files/*', async (c) => {
  // Use split to reliably get everything after /files/ regardless of mount point
  const pathParts = c.req.path.split('/files/');
  let key = pathParts.length > 1 ? pathParts[1] : null;
  
  if (!key) return bad(c, 'Key is required');
  
  // Ensure the key is decoded (e.g., %20 -> space) to match R2 storage keys
  key = decodeURIComponent(key);

  const object = await c.env.DOCUMENTS_BUCKET.get(key);
  if (!object) return notFound(c, 'File not found');

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Content-Disposition', 'inline');

  return new Response(object.body, { headers });
});

export default aiDocsApp;
