// Making changes to this file is **STRICTLY** forbidden. Please add your routes in `userRoutes.ts` file.
import { createApp } from './app';

const app = createApp();

// Add health check and error routes to the app instance
app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() }}));
app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError((err, c) => {
  console.error(`[WORKER ERROR] Path: ${c.req.path}`, err);
  if (err.cause) {
    console.error(`[WORKER ERROR CAUSE]`, err.cause);
  }
  return c.json({ 
    success: false, 
    error: err.message || 'Internal Server Error',
    cause: err.cause ? (err.cause as any).message || String(err.cause) : undefined
  }, 500);
});

export { app };

// Durable Object stub for Cloudflare template compatibility
export class GlobalDurableObject {
  ctx: any;
  env: any;
  constructor(ctx: any, env: any) {
    this.ctx = ctx;
    this.env = env;
  }

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
