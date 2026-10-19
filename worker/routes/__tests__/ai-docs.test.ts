import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import aiDocs from '../ai-docs';
import type { HonoEnv } from '../../app';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

/**
 * ai-docs HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('ai-docs barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(aiDocs).toBeDefined();
    expect(aiDocs.fetch).toBeDefined();
  });

  it('keeps every ai-docs URL byte-identical', () => {
    const routePaths = aiDocs.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('POST /ai/chat');
    expect(routePaths).toContain('GET /documents');
    expect(routePaths).toContain('POST /documents');
    expect(routePaths).toContain('DELETE /documents/:id');
    expect(routePaths).toContain('GET /documents/download/:id');
    expect(routePaths).toContain('POST /upload');
    expect(routePaths).toContain('GET /files/*');
  });
});

/**
 * #97: every mutating route in this barrel must refuse a role that has no
 * business writing operational data. The exception is stated here as a list so
 * the exemption has to be re-justified whenever a route is added: `POST /ai/chat`
 * is open to every signed-in role and carries the `rbac-exempt:` directive in
 * chat.ts, because its only persisted action (CREATE_SCHEDULE) re-checks the
 * schedule write roles in the handler.
 */
describe('ai-docs mutating routes carry an rbac guard (#97)', () => {
  const assistantOnly = ['POST /ai/chat'];

  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(aiDocs).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles everywhere except the assistant', async () => {
    for (const role of OVERSIGHT_ROLES) {
      const reached = await reachableBy(aiDocs, role);
      expect(reached.map((r) => r.route).sort(), role).toEqual([...assistantOnly].sort());
    }
  });
});

/**
 * The assistant's one persisted action is not a side door into the schedule
 * cycle: the handler carries `POST /csa/schedules`'s policy (Line 2/Admin), so
 * the exemption above cannot be used to write an entity a guard would refuse.
 */
describe('POST /ai/chat CREATE_SCHEDULE carries the schedule write roles', () => {
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    c.set('userRole', 'Line 1');
    c.set('userId', 'user-1');
    c.set('organizationId', 'org-1');
    await next();
  });
  app.route('/api', aiDocs);

  const env = {
    DATABASE_URL: 'postgres://mock',
    BETTER_AUTH_SECRET: 'test',
    GEMINI_API_KEY: 'test',
    DOCUMENTS_BUCKET: undefined,
  };

  it('refuses a Line 1 confirmation before it reaches the insert', async () => {
    const res = await app.request(
      '/api/ai/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'buat jadwal CSA',
          actionConfirmation: { action: 'CREATE_SCHEDULE', data: { id: 'schedule-1' } },
        }),
      },
      env
    );

    expect(res.status).toBe(403);
    const body = await res.json<{ error?: string; message?: string }>();
    expect(body.error).toBe('SCHEDULE_WRITE_FORBIDDEN');
    expect(body.message).toBe('Access Denied: Insufficient permissions');
  });
});
