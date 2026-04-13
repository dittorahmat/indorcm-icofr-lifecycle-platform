// Making changes to this file is **STRICTLY** forbidden. Please add your routes in `userRoutes.ts` file.
import { createApp } from './app';
import type { DurableObject, DurableObjectState } from 'cloudflare:workers';

const app = createApp();

// Add health check and error routes to the app instance
app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() }}));
app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError((err, c) => {
  console.error(`[WORKER ERROR] Path: ${c.req.path}`, err);
  return c.json({ success: false, error: err.message || 'Internal Server Error' }, 500);
});

export { app };

// Durable Object stub for Cloudflare template compatibility
export class GlobalDurableObject implements DurableObject {
  constructor(public ctx: DurableObjectState, public env: any) {}

  async fetch(request: Request): Promise<Response> {
    return new Response('GlobalDurableObject stub', { status: 200 });
  }
}

export default {
  fetch: (request: Request, env: any, ctx: ExecutionContext) => {
    // Inject Cloudflare env into Hono context
    return app.fetch(request, env, ctx);
  }
};
