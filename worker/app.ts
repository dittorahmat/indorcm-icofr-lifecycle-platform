import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { userRoutes } from './user-routes';
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
    licenseKey: string; // Simpan key untuk deteksi perubahan
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
    // 1. Explicit Bypass (for Cloudflare Demo)
    if (c.env.SKIP_LICENSE === 'true') {
      c.set('licenseStatus', 'bypassed');
      return next();
    }

    // 2. Skip for public routes and license activation/status
    const publicPaths = [
        '/api/health', 
        '/api/license/activate', 
        '/api/license/status', 
        '/api/client-errors',
        '/api/dev/re-seed',
        '/api/dev/fix-db'
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

    // 3. Get License from DB (Fast Read)
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

    // 4. Check Cache (with Key Change Detection)
    const isKeySame = cachedLicenseStatus?.licenseKey === license.licenseKey;
    const isCacheValid = cachedLicenseStatus && (now - cachedLicenseStatus.timestamp < LICENSE_CACHE_TTL);

    if (isKeySame && isCacheValid) {
      if (cachedLicenseStatus.status) {
        return c.json({ success: false, error: cachedLicenseStatus.status, message: `License issue: ${cachedLicenseStatus.status} (cached)` }, 403);
      }
      c.set('licenseStatus', 'active');
      return next();
    }
    
    // 5. Cache Miss, Expired, or Key Changed -> Heavy Cryptographic Verification
    const publicKey = c.env.LICENSE_PUBLIC_KEY || process.env.LICENSE_PUBLIC_KEY || '';
    const payload = await verifyLicense(license.licenseKey, publicKey);
    
    if (!payload) {
        const err = 'LICENSE_INVALID';
        cachedLicenseStatus = { status: err, timestamp: now, licenseKey: license.licenseKey };
        return c.json({ success: false, error: err, message: 'Invalid license signature.' }, 403);
    }

    const fingerprint = getMachineFingerprint();
    const status = checkLicenseStatus(payload, fingerprint, license.lastHeartbeat);

    // 6. Update Cache
    cachedLicenseStatus = { status, timestamp: now, licenseKey: license.licenseKey };

    if (status) {
        // Update status in DB if it changed
        if (license.status !== status) {
            await db.update(schema.systemLicenses).set({ status }).where(eq(schema.systemLicenses.id, license.id));
        }
        return c.json({ success: false, error: status, message: `License issue: ${status}` }, 403);
    }

    // --- HEARTBEAT THROTTLING (1 JAM) ---
    const lastUpdateTs = new Date(license.lastHeartbeat).getTime();
    const ONE_HOUR = 60 * 60 * 1000;

    // Hanya tulis ke database jika sudah lewat 1 jam
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
    // Skip middleware for public auth routes (signIn, signUp, etc.)
    // But NOT for /api/auth/me which we want to be protected by our session logic
    if (c.req.path.startsWith('/api/auth/') && c.req.path !== '/api/user/me') {
      return next();
    }

    // Public paths that don't require authentication
    const publicPaths = [
        '/api/health', 
        '/api/license/activate', 
        '/api/license/status', 
        '/api/client-errors', 
        '/api/dev/re-seed',
        '/api/dev/fix-db'
    ];
    
    if (publicPaths.includes(c.req.path)) {
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

    let activeOrgId = (session.session as any).activeOrganizationId;

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
  app.all('/api/auth/*', async (c) => {
    const auth = getAuth(c.env);
    return auth.handler(c.req.raw);
  });
  
  return app;
};
