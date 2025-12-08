import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import {
  UserEntity,
  ChatBoardEntity,
  RCMEntity,
  ControlEntity,
  DeficiencyEntity,
  ActionPlanEntity,
  CSAEntity,
  TestEntity
} from "./entities";
import type { Control, RCM, CSARecord, TestRecord, Deficiency, ActionPlan } from "@shared/types";
import { z } from "zod";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- Seeding Middleware ---
  app.use('/api/*', async (c, next) => {
    // Ensure all entities are seeded on first request in a worker instance
    await Promise.all([
      UserEntity.ensureSeed(c.env),
      ChatBoardEntity.ensureSeed(c.env),
      RCMEntity.ensureSeed(c.env),
      ControlEntity.ensureSeed(c.env),
      DeficiencyEntity.ensureSeed(c.env),
      ActionPlanEntity.ensureSeed(c.env),
    ]);
    await next();
  });
  // --- ICOFR Routes ---
  // RCM
  app.get('/api/rcm', async (c) => ok(c, await RCMEntity.list(c.env)));
  app.post('/api/rcm', async (c) => {
    const body = await c.req.json<Partial<RCM>>();
    const newRcm: RCM = { id: crypto.randomUUID(), process: "New Process", subProcess: "New Sub-Process", riskDescription: "New Risk", controls: [], ...body };
    return ok(c, await RCMEntity.create(c.env, newRcm));
  });
  // Controls
  app.get('/api/controls', async (c) => ok(c, await ControlEntity.list(c.env)));
  app.post('/api/controls', async (c) => {
    const body = await c.req.json<Partial<Control>>();
    if (!body.rcmId) return bad(c, 'rcmId is required');
    const newControl: Control = { id: crypto.randomUUID(), name: "New Control", description: "", ownerId: "u1", type: "Preventive", nature: "Manual", assertions: [], materiality: "Low", ...body, rcmId: body.rcmId };
    return ok(c, await ControlEntity.create(c.env, newControl));
  });
  app.put('/api/controls/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Control>>();
    const control = new ControlEntity(c.env, id);
    if (!await control.exists()) return notFound(c, 'Control not found');
    await control.patch(body);
    return ok(c, await control.getState());
  });
  // Deficiencies
  app.get('/api/deficiencies', async (c) => ok(c, await DeficiencyEntity.list(c.env)));
  app.post('/api/deficiencies', async (c) => {
    const body = await c.req.json<Partial<Deficiency>>();
    if (!body.controlId || !body.description) return bad(c, 'controlId and description are required');
    const newDef: Deficiency = { id: crypto.randomUUID(), identifiedDate: Date.now(), status: "Open", severity: "Control Deficiency", identifiedBy: "u1", ...body, controlId: body.controlId, description: body.description };
    return ok(c, await DeficiencyEntity.create(c.env, newDef));
  });
  app.put('/api/deficiencies/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Deficiency>>();
    const def = new DeficiencyEntity(c.env, id);
    if (!await def.exists()) return notFound(c, 'Deficiency not found');
    await def.patch(body);
    return ok(c, await def.getState());
  });
  // Action Plans
  app.get('/api/actionplans', async (c) => ok(c, await ActionPlanEntity.list(c.env)));
  app.post('/api/actionplans', async (c) => {
    const body = await c.req.json<Partial<ActionPlan>>();
    if (!body.deficiencyId || !body.description) return bad(c, 'deficiencyId and description are required');
    const newAp: ActionPlan = { id: crypto.randomUUID(), ownerId: 'u1', dueDate: Date.now() + 86400000 * 30, status: 'Draft', ...body, deficiencyId: body.deficiencyId, description: body.description };
    return ok(c, await ActionPlanEntity.create(c.env, newAp));
  });
  app.put('/api/actionplans/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<ActionPlan>>();
    const ap = new ActionPlanEntity(c.env, id);
    if (!await ap.exists()) return notFound(c, 'Action Plan not found');
    await ap.patch(body);
    return ok(c, await ap.getState());
  });
  // CSA
  app.post('/api/csa', async (c) => {
    if (c.req.header('X-Mock-Role') !== 'Line 1') return bad(c, 'Access Denied: Only Line 1 can submit CSAs.');
    const body = await c.req.json<Partial<CSARecord>>();
    if (!body.controlId || !body.result) return bad(c, 'controlId and result are required');
    const newCSA: CSARecord = { id: crypto.randomUUID(), assessmentDate: Date.now(), assessedBy: "u1", comments: "", ...body, controlId: body.controlId, result: body.result };
    const created = await CSAEntity.create(c.env, newCSA);
    if (created.result === 'Fail') {
      await DeficiencyEntity.create(c.env, {
        id: crypto.randomUUID(),
        controlId: created.controlId,
        description: `CSA Failed: ${created.comments || 'No comment provided.'}`,
        severity: 'Control Deficiency',
        identifiedDate: Date.now(),
        identifiedBy: created.assessedBy,
        status: 'Open',
      });
    }
    return ok(c, created);
  });
  // Testing
  app.post('/api/tests', async (c) => {
    if (c.req.header('X-Mock-Role') !== 'Line 3') return bad(c, 'Access Denied: Only Line 3 can submit tests.');
    const body = await c.req.json<Partial<TestRecord>>();
    if (!body.controlId || !body.result || !body.testType) return bad(c, 'controlId, result, and testType are required');
    const newTest: TestRecord = { id: crypto.randomUUID(), testDate: Date.now(), testedBy: "u3", comments: "", ...body, controlId: body.controlId, result: body.result, testType: body.testType };
    const created = await TestEntity.create(c.env, newTest);
    if (created.result === 'Fail') {
      await DeficiencyEntity.create(c.env, {
        id: crypto.randomUUID(),
        controlId: created.controlId,
        description: `${created.testType} Failed: ${created.comments || 'No comment provided.'}`,
        severity: 'Significant Deficiency',
        identifiedDate: Date.now(),
        identifiedBy: created.testedBy,
        status: 'Open',
      });
    }
    return ok(c, created);
  });
  // --- Original Demo Routes ---
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  app.get('/api/users', async (c) => ok(c, await UserEntity.list(c.env)));
  app.get('/api/chats', async (c) => ok(c, await ChatBoardEntity.list(c.env)));
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
}