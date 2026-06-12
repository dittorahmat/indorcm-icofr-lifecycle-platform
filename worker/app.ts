import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { userRoutes } from './user-routes';
import notifications from './routes/notifications';
import license from './routes/license';
import aiDocs from './routes/ai-docs';
import rcm from './routes/rcm';
import bpm from './routes/bpm';
import scoping from './routes/scoping';
import accountAssertions from './routes/account-assertions';
import remediation from './routes/remediation';
import audit from './routes/audit';
import users from './routes/users';
import infrastructure from './routes/infrastructure';
import reporting from './routes/reporting';
import transactions from './routes/transactions';
import csa from './routes/csa';
import migration from './routes/migration';
import { getAuth } from './auth';
import { getDb } from './db';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';
import type { UserRole } from '@shared/types';
import { getMachineFingerprint, verifyLicense, checkLicenseStatus } from './lib/license';

// --- LICENSE CACHE (In-Memory) ---
let cachedLicenseStatus: {
    status: string | null;
    timestamp: number;
    licenseKey: string;
} | null = null;

const LICENSE_CACHE_TTL = 60 * 60 * 1000; // 1 Jam

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
    AI_PROVIDER?: string;
    AI_BASE_URL?: string;
    AI_EMBEDDING_MODEL?: string;
    AI_CHAT_MODEL?: string;
    DOCUMENTS_BUCKET: R2Bucket;
    LICENSE_PUBLIC_KEY?: string;
    SKIP_LICENSE?: string;
  };
  Variables: {
    userRole: UserRole;
    userId: string;
    organizationId: string;
    userLevel: string;
    departmentId: string;
    licenseStatus?: string;
  };
}

export const createApp = () => {
  const app = new Hono<HonoEnv>();

  app.use('*', logger());
  app.use('/api/*', cors({ 
    origin: '*', 
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowHeaders: ['Content-Type', 'Authorization', 'X-Mock-Role', 'X-License-Key'] 
  }));

  // License Guard Middleware
  app.use('/api/*', async (c, next) => {
    if (c.env.SKIP_LICENSE === 'true') {
      c.set('licenseStatus', 'bypassed');
      return next();
    }

    const publicPaths = [
        '/api/health', 
        '/api/license/status', 
        '/api/license/activate', 
        '/api/client-errors',
        '/api/user/dev/re-seed',
        '/api/user/dev/fix-db'
    ];
    
    if (publicPaths.includes(c.req.path) || (c.req.path.startsWith('/api/auth/') && c.req.path !== '/api/user/me')) {
      return next();
    }

    if (!c.env.DATABASE_URL) {
        console.error('[LICENSE] DATABASE_URL is missing in environment.');
        return c.json({ success: false, error: 'CONFIG_ERROR', message: 'DATABASE_URL missing.' }, 500);
    }

    const db = getDb(c.env.DATABASE_URL);
    const now = Date.now();

    let activeLicense;
    try {
      activeLicense = await db.select().from(schema.systemLicenses).limit(1);
    } catch (e: any) {
      if (e.message === 'DATABASE_URL_MISSING') {
          return c.json({ success: false, error: 'DATABASE_URL_MISSING', message: 'DATABASE_URL is not set in .dev.vars' }, 500);
      }
      console.warn('[LICENSE] system_licenses table not found or error accessing DB. Check connection.');
      return next();
    }

    if (activeLicense.length === 0) {
      return c.json({ success: false, error: 'LICENSE_REQUIRED', message: 'Application activation required.' }, 403);
    }

    const license = activeLicense[0];

    const isKeySame = cachedLicenseStatus?.licenseKey === license.licenseKey;
    const isCacheValid = cachedLicenseStatus && (now - cachedLicenseStatus.timestamp < LICENSE_CACHE_TTL);

    if (isKeySame && isCacheValid && cachedLicenseStatus) {
      if (cachedLicenseStatus.status) {
        return c.json({ success: false, error: cachedLicenseStatus.status, message: `License issue: ${cachedLicenseStatus.status} (cached)` }, 403);
      }
      c.set('licenseStatus', 'active');
      return next();
    }
    
    const publicKey = c.env.LICENSE_PUBLIC_KEY || process.env.LICENSE_PUBLIC_KEY || '';
    const payload = await verifyLicense(license.licenseKey, publicKey);
    
    if (!payload) {
        const err = 'LICENSE_INVALID';
        cachedLicenseStatus = { status: err, timestamp: now, licenseKey: license.licenseKey };
        return c.json({ success: false, error: err, message: 'Invalid license signature.' }, 403);
    }

    const fingerprint = getMachineFingerprint();
    const status = checkLicenseStatus(payload, fingerprint, license.lastHeartbeat);

    cachedLicenseStatus = { status, timestamp: now, licenseKey: license.licenseKey };

    if (status) {
        if (license.status !== status) {
            await db.update(schema.systemLicenses).set({ status }).where(eq(schema.systemLicenses.id, license.id));
        }
        return c.json({ success: false, error: status, message: `License issue: ${status}` }, 403);
    }

    const lastUpdateTs = new Date(license.lastHeartbeat).getTime();
    const ONE_HOUR = 60 * 60 * 1000;

    if (now - lastUpdateTs > ONE_HOUR) {
        await db.update(schema.systemLicenses).set({ 
            lastHeartbeat: new Date(),
            status: 'active' 
        }).where(eq(schema.systemLicenses.id, license.id));
        console.log('[LICENSE] Heartbeat updated in database.');
    }

    c.set('licenseStatus', 'active');
    await next();
  });

  // Auth Middleware
  app.use('/api/*', async (c, next) => {
    if (c.req.path.startsWith('/api/auth/') && c.req.path !== '/api/user/me') {
      return next();
    }

    const publicPaths = [
        '/api/health', 
        '/api/license/status', 
        '/api/license/activate', 
        '/api/client-errors', 
        '/api/user/dev/re-seed',
        '/api/user/dev/fix-db'
    ];
    
    if (publicPaths.includes(c.req.path)) {
      return next();
    }

    const auth = getAuth(c.env);
    let session;
    let retries = 2;
    
    while (retries > 0) {
      try {
        session = await auth.api.getSession({
          headers: c.req.raw.headers
        });
        break; // Success, exit loop
      } catch (e: any) {
        retries--;
        const isNetworkError = e.message?.includes('Network connection lost') || e.message?.includes('fetch failed');
        
        if (retries > 0 && isNetworkError) {
          console.warn(`[AUTH] getSession failed (retrying... ${retries} left):`, e.message);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        console.error('[AUTH ERROR] getSession failed:', e.message, e.stack);
        return c.json({ success: false, error: 'Internal Auth Error', message: e.message }, 500);
      }
    }

    if (!session) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    let activeOrgId = (session.session as any).activeOrganizationId;

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

  // Global Error Handler
  app.onError((err, c) => {
    console.error(`[HONO ERROR] ${err.message}`, err.stack);
    return c.json({ 
      success: false, 
      error: err.name || 'Internal Server Error', 
      message: err.message 
    }, 500);
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

  // Direct Mounting to avoid nested sub-app complexity
  app.route('/api', notifications);
  app.route('/api', license);
  app.route('/api', rcm);
  app.route('/api', bpm);
  app.route('/api', scoping);
  app.route('/api', accountAssertions);
  app.route('/api', remediation);
  app.route('/api', audit);
  app.route('/api', users);
  app.route('/api', infrastructure);
  app.route('/api', reporting);
  app.route('/api', transactions);
  app.route('/api', csa);
  app.route('/api', migration);
  app.route('/api', aiDocs);
    
  // Legacy function routes
  userRoutes(app);

  app.all('/api/auth/*', async (c) => {
    const auth = getAuth(c.env);
    return auth.handler(c.req.raw);
  });
  
  return app;
};

export type AppType = ReturnType<typeof createApp>;
