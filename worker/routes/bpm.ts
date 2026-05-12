import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { BpmService } from "../services/bpm-service";
import { rbac } from "../lib/guard";

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

bpm.get('/bpm-diagrams/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;
  
  const diagram = await bpmService.getDiagramById(orgId, id!);
  if (!diagram) return notFound(c);
  
  return ok(c, diagram);
});

bpm.post('/bpm-diagrams', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json<any>();
  const newItem = await bpmService.createDiagram(c.get('organizationId')!, c.get('userId')!, body);
  return ok(c, newItem);
});

bpm.put('/bpm-diagrams/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const body = await c.req.json<any>();

  const result = await bpmService.updateDiagram(c.get('organizationId')!, c.get('userId')!, id!, body);
  return ok(c, result);
});

bpm.delete('/bpm-diagrams/:id', rbac(['Line 2', 'Admin']), async (c) => {
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

// --- BPM Process Routes ---

bpm.get('/bpm-processes', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const items = await bpmService.getAllProcesses(
    c.get('organizationId')!, 
    c.req.query('noGL'), 
    c.req.query('id')
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

bpm.post('/bpm-processes', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json();
  const newItem = await bpmService.createProcess(c.get('organizationId')!, c.get('userId')!, body);
  return ok(c, newItem);
});

bpm.patch('/bpm-processes/:id', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    const result = await bpmService.updateProcess(c.get('organizationId')!, id!, body);
    return ok(c, result);
  } catch (e: any) {
    return bad(c, e.message);
  }
});

bpm.delete('/bpm-processes/:id', rbac(['Line 2', 'Admin']), async (c) => {
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
