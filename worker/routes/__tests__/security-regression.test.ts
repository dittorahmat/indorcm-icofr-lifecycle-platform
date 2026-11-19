import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import adminUsersRoute from '../users/admin';
import settingsRoute from '../users/settings';
import filesRoute from '../ai-docs/files';
import { assertConfirmToken } from '../../lib/dev-guard';
import { validateSafeWebhookUrl } from '../../lib/ssrf';
import { getStorageBucket, type StorageBucket } from '../../lib/storage';
import type { DrizzleDb } from '../../db';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

vi.mock('../../lib/storage', () => ({
  getStorageBucket: vi.fn(),
}));

import { getDb } from '../../db';
const mockedGetDb = vi.mocked(getDb);

function stubDb(overrides: Record<string, unknown>): DrizzleDb {
  const db: DrizzleDb = Object.create(null);
  return Object.assign(db, overrides);
}

describe('End-to-End Security Hardening Regression Suite', () => {
  describe('VULN-001 & 002: Tenant BOLA on Admin User Operations', () => {
    it('refuses cross-tenant user update with 404', async () => {
      mockedGetDb.mockReturnValue(
        stubDb({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: async () => [],
              }),
            }),
          }),
        })
      );

      const app = new Hono<HonoEnv>();
      app.use('*', async (c, next) => {
        c.set('userId', 'admin-org1');
        c.set('userRole', 'Admin');
        c.set('organizationId', 'org-1');
        c.env = { DATABASE_URL: 'postgres://dummy' } as HonoEnv['Bindings'];
        await next();
      });
      app.route('/', adminUsersRoute);

      const res = await app.request('/users/victim-from-org2', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hacked Name' }),
      });

      expect(res.status).toBe(404);
      const json = await res.json<{ error: string }>();
      expect(json.error).toBe('USER_NOT_FOUND');
    });
  });

  describe('VULN-003 & 004: Unauthenticated & Cross-Tenant File Access + SVG Stored XSS', () => {
    it('blocks unauthenticated access to storage files with 401', async () => {
      const app = new Hono<HonoEnv>();
      app.route('/', filesRoute);

      const res = await app.request('/files/uploads/org-1/secret.pdf');
      expect(res.status).toBe(401);
    });

    it('blocks reading files belonging to other tenants with 403', async () => {
      const app = new Hono<HonoEnv>();
      app.use('*', async (c, next) => {
        c.set('userId', 'user-org1');
        c.set('organizationId', 'org-1');
        c.env = { DATABASE_URL: 'postgres://dummy' } as HonoEnv['Bindings'];
        await next();
      });
      app.route('/', filesRoute);

      const res = await app.request('/files/uploads/org-2/victim.pdf');
      expect(res.status).toBe(403);
    });

    it('forces sandbox CSP and attachment disposition for SVG files', async () => {
      const mockBucket: StorageBucket = {
        get: vi.fn().mockResolvedValue({
          body: '<svg><script>alert(1)</script></svg>',
          httpEtag: 'tag-1',
          writeHttpMetadata: vi.fn(),
        }),
        put: vi.fn().mockResolvedValue({ key: '' }),
        delete: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(getStorageBucket).mockReturnValue(mockBucket);

      const app = new Hono<HonoEnv>();
      app.use('*', async (c, next) => {
        c.set('userId', 'user-org1');
        c.set('organizationId', 'org-1');
        c.env = {
          DATABASE_URL: 'postgres://dummy',
        } as HonoEnv['Bindings'];
        await next();
      });
      app.route('/', filesRoute);

      const res = await app.request('/files/uploads/org-1/badge.svg');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-disposition')).toContain('attachment');
      expect(res.headers.get('content-security-policy')).toBe("default-src 'none'; sandbox");
    });
  });

  describe('VULN-005: SSRF on Webhook Notifications', () => {
    it('blocks requests to internal loopback and cloud metadata endpoints', () => {
      expect(validateSafeWebhookUrl('http://169.254.169.254/latest/meta-data').valid).toBe(false);
      expect(validateSafeWebhookUrl('https://127.0.0.1:8080/admin').valid).toBe(false);
      expect(validateSafeWebhookUrl('https://10.1.1.1/internal').valid).toBe(false);
      expect(validateSafeWebhookUrl('https://localhost:3000').valid).toBe(false);
    });

    it('allows valid external HTTPS endpoints', () => {
      expect(validateSafeWebhookUrl('https://hooks.slack.com/services/T00/B00/X00').valid).toBe(true);
    });
  });

  describe('VULN-006 & 007: Plaintext Secrets in Settings and Regulatory Period Lock', () => {
    it('redacts plaintext smtpPass in GET /settings', async () => {
      mockedGetDb.mockReturnValue(
        stubDb({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: async () => [
                  {
                    id: 'org-1',
                    name: 'Test Org',
                    metadata: { smtpPass: 'super-secret' },
                  },
                ],
              }),
            }),
          }),
        })
      );

      const app = new Hono<HonoEnv>();
      app.use('*', async (c, next) => {
        c.set('userId', 'admin-1');
        c.set('userRole', 'Admin');
        c.set('organizationId', 'org-1');
        c.env = { DATABASE_URL: 'postgres://dummy' } as HonoEnv['Bindings'];
        await next();
      });
      app.route('/', settingsRoute);

      const res = await app.request('/settings');
      expect(res.status).toBe(200);
      const data = await res.json<{ data: { smtpPass: string } }>();
      expect(data.data.smtpPass).toBe('********');
    });

    it('rejects unlocking period when digitally signed off', async () => {
      mockedGetDb.mockReturnValue(
        stubDb({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: async () => [
                  {
                    id: 'org-1',
                    metadata: { isPeriodLocked: true, verificationHash: 'SIGNOFF-001' },
                  },
                ],
              }),
            }),
          }),
        })
      );

      const app = new Hono<HonoEnv>();
      app.use('*', async (c, next) => {
        c.set('userId', 'admin-1');
        c.set('userRole', 'Admin');
        c.set('organizationId', 'org-1');
        c.env = { DATABASE_URL: 'postgres://dummy' } as HonoEnv['Bindings'];
        await next();
      });
      app.route('/', settingsRoute);

      const res = await app.request('/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPeriodLocked: false }),
      });

      expect(res.status).toBe(403);
      const json = await res.json<{ error: string }>();
      expect(json.error).toBe('CANNOT_UNLOCK_SIGNED_PERIOD');
    });
  });

  describe('VULN-008: Fail-Closed Dev Guard Token Validation', () => {
    it('refuses execution when DEV_CONFIRM_TOKEN is not configured', () => {
      expect(assertConfirmToken({}, undefined)).toBe(false);
      expect(assertConfirmToken({}, 'secret')).toBe(false);
      expect(assertConfirmToken({ DEV_CONFIRM_TOKEN: '' }, 'secret')).toBe(false);
    });

    it('allows execution only when token matches configured secret', () => {
      expect(assertConfirmToken({ DEV_CONFIRM_TOKEN: 'correct-token' }, 'wrong')).toBe(false);
      expect(assertConfirmToken({ DEV_CONFIRM_TOKEN: 'correct-token' }, 'correct-token')).toBe(true);
    });
  });

  describe('SoD Enforcement on Lifecycle Endpoints', () => {
    it('blocks self-approval of scoping simulation by creator', async () => {
      const mockSim = {
        id: 'sim-1',
        organizationId: 'org-1',
        name: 'Simulation 2026',
        status: 'Pending CFO',
        workflowStatus: 'Pending CFO',
        createdBy: 'cfo-user-1',
        history: [],
      };

      mockedGetDb.mockReturnValue(
        stubDb({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: async () => [mockSim],
              }),
            }),
          }),
        })
      );

      const scopingApp = new Hono<HonoEnv>();
      scopingApp.use('*', async (c, next) => {
        c.set('userId', 'cfo-user-1');
        c.set('userRole', 'CFO');
        c.set('organizationId', 'org-1');
        c.env = { DATABASE_URL: 'postgres://dummy' } as HonoEnv['Bindings'];
        await next();
      });

      const { default: lifecycleRoute } = await import('../scoping/scoping-simulation-lifecycle');
      scopingApp.route('/', lifecycleRoute);

      const res = await scopingApp.request('/simulations/sim-1/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Self approve' }),
      });

      expect(res.status).toBe(403);
      const json = await res.json<{ error: string }>();
      expect(json.error).toBe('SIMULATION_SOD_VIOLATION');
    });
  });
});
