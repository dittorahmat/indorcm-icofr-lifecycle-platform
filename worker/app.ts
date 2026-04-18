import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { userRoutes } from './user-routes';
import { getAuth } from './auth';
import { getDb } from './db';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';
import type { UserRole } from '@shared/types';

export interface ClientErrorReport {
  message: string;
  url: string;
  timestamp: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: boolean;
  errorBoundaryProps?: Record<string, unknown>;
}

export interface HonoEnv {
  Bindings: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL?: string;
    GEMINI_API_KEY: string;
    DOCUMENTS_BUCKET: R2Bucket;
  };
  Variables: {
    userRole: UserRole;
    userId: string;
    organizationId: string;
    userLevel: string;
    departmentId: string;
  };
}

export const createApp = () => {
  const app = new Hono<HonoEnv>();

  app.use('*', logger());
  app.use('/api/*', cors({ 
    origin: '*', 
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowHeaders: ['Content-Type', 'Authorization', 'X-Mock-Role'] 
  }));

  // Auth Middleware
  app.use('/api/*', async (c, next) => {
    // Skip middleware for public auth routes (signIn, signUp, etc.)
    // But NOT for /api/auth/me which we want to be protected by our session logic
    if (c.req.path.startsWith('/api/auth/') && c.req.path !== '/api/auth/me') {
      return next();
    }

    // Public health check
    if (c.req.path === '/api/health') {
      return next();
    }

    const auth = getAuth(c.env);
    let session;
    try {
      session = await auth.api.getSession({
        headers: c.req.raw.headers
      });
    } catch (e: any) {
      console.error('[AUTH ERROR] getSession failed:', e.message, e.stack);
      return c.json({ success: false, error: 'Internal Auth Error', message: e.message }, 500);
    }

    if (!session) {
      if (c.req.path === '/api/auth/me') return c.json({ success: false, error: 'Unauthorized' }, 401);
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    let activeOrgId = session.session.activeOrganizationId;

    // Fallback: If no active org in session, find the first one from DB
    if (!activeOrgId) {
      const db = getDb(c.env.DATABASE_URL);
      const userMember = await db.select().from(schema.member).where(eq(schema.member.userId, session.user.id)).limit(1);
      if (userMember.length > 0) {
        activeOrgId = userMember[0].organizationId;
      }
    }

    c.set('userId', session.user.id);
    c.set('organizationId', activeOrgId || '');
    c.set('userRole', (session.user as any).role || 'Line 1');
    c.set('userLevel', (session.user as any).level || 'Staff');
    c.set('departmentId', (session.user as any).departmentId || '');

    await next();
  });

  app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() }}));
  
  app.post('/api/client-errors', async (c) => {
    try {
      const e = await c.req.json<ClientErrorReport>();
      console.error('[CLIENT ERROR]', JSON.stringify(e, null, 2));
      return c.json({ success: true });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to process' }, 500);
    }
  });

  // Specific routes first
  userRoutes(app);

  // Better Auth Route Handler as fallback for all other /api/auth/*
  app.on(['POST', 'GET'], '/api/auth/*', async (c) => {
    const auth = getAuth(c.env);
    return auth.handler(c.req.raw);
  });
  
  return app;
};
