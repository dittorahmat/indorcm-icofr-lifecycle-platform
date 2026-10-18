import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound, AppError } from '../lib/utils';
import { getDb } from '../db';
import { BpmService } from "../services/bpm-service";
import { runWorkflowTransition } from "../services/workflow/workflow-drizzle-adapter";
import { rbac } from "../lib/guard";
import type { WorkflowAction } from "@shared/types";
import { AIService } from "../services/ai-service";
import {
  BPM_OCR_AI_FAILED,
  BPM_OCR_RESPONSE_SCHEMA,
  buildOcrPrompt,
  parseOcrResponse,
} from "../services/bpm/bpm-ocr";

const bpm = new Hono<HonoEnv>();

// --- BPM Diagram Routes ---

bpm.get('/bpm-diagrams', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const orgId = c.get('organizationId')!;
  const year = c.req.query('year');

  const items = await bpmService.getAllDiagrams(orgId, year ? parseInt(year) : undefined);
  return ok(c, { items });
});

// Maintenance: strips the legacy `Flow: ` prefix from every diagram name in the
// tenant. POST — not ALL — because it writes, Admin-gated because it rewrites the
// whole tenant's diagrams, and it requires a real org context instead of silently
// falling back to a default tenant.
bpm.post('/bpm-diagrams/cleanup-flow-prefix', rbac(['Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const orgId = c.get('organizationId');
  if (!orgId) return bad(c, 'ORG_CONTEXT_REQUIRED', 400, 'Missing organization context');
  const result = await bpmService.cleanupFlowPrefixes(orgId);
  return ok(c, result);
});

bpm.get('/bpm-diagrams/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;
  const noGL = c.req.query('noGL');
  
  const diagram = await bpmService.getDiagramById(orgId, id!, noGL);
  if (!diagram) return notFound(c);
  
  return ok(c, diagram);
});

bpm.post('/bpm-diagrams', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json<any>();
  const newItem = await bpmService.createDiagram(c.get('organizationId')!, c.get('userId')!, body);
  return ok(c, newItem);
});

bpm.put('/bpm-diagrams/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const body = await c.req.json<any>();

  const result = await bpmService.updateDiagram(c.get('organizationId')!, c.get('userId')!, id!, body);
  if (!result) return notFound(c, 'Diagram not found');
  return ok(c, result);
});

bpm.delete('/bpm-diagrams/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const result = await bpmService.deleteDiagram(c.get('organizationId')!, id!);
  return ok(c, result);
});

bpm.get('/bpm-diagrams/by-control/:controlId', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const controlId = c.req.param('controlId');
  const orgId = c.get('organizationId')!;

  const result = await bpmService.getDiagramByControlId(orgId, controlId);
  if (!result) return notFound(c, 'Diagram not found for this control');
  
  return ok(c, result);
});

bpm.get('/bpm-diagrams/by-gl/:noGL', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const noGL = c.req.param('noGL');
  const subProcessName = c.req.query('subProcess');
  const orgId = c.get('organizationId')!;

  const diagram = await bpmService.getDiagramByGL(orgId, noGL, subProcessName);
  if (!diagram) return notFound(c, 'Diagram not found');

  return ok(c, diagram);
});

bpm.post('/bpm-diagrams/ocr', rbac(['Line 1', 'Admin']), async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return bad(c, 'AI API Key is not configured.');
  }

  const body = await c.req.json<{ image: string }>();
  if (!body.image) {
    return bad(c, 'Image data is required');
  }

  const aiService = new AIService({
    provider: c.env.AI_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'gemini',
    apiKey: apiKey,
    baseUrl: c.env.AI_BASE_URL,
    embeddingModel: c.env.AI_EMBEDDING_MODEL,
    chatModel: c.env.AI_CHAT_MODEL,
  });

  const { systemInstruction, messages } = buildOcrPrompt({ image: body.image });

  try {
    const result = await aiService.generateChatResponse({
      systemInstruction,
      messages,
      responseSchema: BPM_OCR_RESPONSE_SCHEMA,
    });

    return ok(c, parseOcrResponse(result.content ?? ""));
  } catch (err) {
    if (err instanceof AppError) {
      return bad(c, err.code, err.status, err.message);
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[BPM OCR API] Error:", message);
    return bad(c, BPM_OCR_AI_FAILED, 500, message);
  }
});

// --- BPM Process Routes ---

bpm.get('/bpm-processes', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const orgId = c.get('organizationId')!;
  const yearStr = c.req.query('year');
  const idStr = c.req.query('id');
  
  if (!yearStr && !idStr) {
    return c.json({ success: false, error: 'Year parameter is required' }, 400);
  }

  const items = await bpmService.getAllProcesses(
    orgId, 
    c.req.query('noGL'), 
    idStr,
    yearStr ? parseInt(yearStr) : undefined
  );
  return ok(c, { items });
});

bpm.get('/bpm-processes/:id/controls', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;

  const items = await bpmService.getControlsByProcess(orgId, id!);
  return ok(c, { items });
});

bpm.get('/bpm-processes/:id/next-sequences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;

  const result = await bpmService.getNextSequences(orgId, id!);
  return ok(c, result);
});

bpm.post('/bpm-processes', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json();
  const newItem = await bpmService.createProcess(c.get('organizationId')!, c.get('userId')!, body);
  return ok(c, newItem);
});

bpm.post('/bpm-processes/batch-reorganize', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json();

  const result = await bpmService.batchReorganizeProcesses(
    c.get('organizationId')!,
    c.get('userId')!,
    body
  );
  return ok(c, result);
});

bpm.patch('/bpm-processes/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const body = await c.req.json();

  const result = await bpmService.updateProcess(c.get('organizationId')!, id!, body);
  return ok(c, result);
});

bpm.post('/bpm-processes/:id/workflow', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const body = await c.req.json<{ action: WorkflowAction; note?: string; assigneeId?: string }>();

  const result = await runWorkflowTransition(db, c.env, {
    entityType: 'BPM',
    entityId: id,
    organizationId: c.get('organizationId'),
    userId: c.get('userId'),
    role: c.get('userRole'),
    action: body.action,
    note: body.note,
    assigneeId: body.assigneeId,
  });
  return ok(c, result);
});

bpm.delete('/bpm-processes/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const result = await bpmService.deleteProcess(c.get('organizationId')!, id!);
  return ok(c, result);
});

bpm.get('/legacy/bpm-summary', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId')!;
  const bpmService = new BpmService(db);
  const items = await bpmService.getAllDiagrams(orgId);
  return ok(c, { items });
});

export default bpm;
