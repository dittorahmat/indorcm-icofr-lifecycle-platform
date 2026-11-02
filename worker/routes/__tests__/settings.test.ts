import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import settingsRoute from '../users/settings';
import { validateSafeWebhookUrl } from '../../lib/ssrf';
import type { DrizzleDb } from '../../db';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

import { getDb } from '../../db';

const mockedGetDb = vi.mocked(getDb);

function stubDb(overrides: Record<string, unknown>): DrizzleDb {
  const db: DrizzleDb = Object.create(null);
  return Object.assign(db, overrides);
}

function createApp() {
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    c.set('userId', 'user-admin-1');
    c.set('userRole', 'Admin');
    c.set('organizationId', 'org-1');
    c.env = {
      DATABASE_URL: 'postgres://dummy',
      BETTER_AUTH_URL: 'http://localhost:3000',
    } as HonoEnv['Bindings'];
    await next();
  });
  app.route('/', settingsRoute);
  return app;
}

describe('SSRF Protection (validateSafeWebhookUrl)', () => {
  it('rejects non-https URLs', () => {
    expect(validateSafeWebhookUrl('http://example.com/webhook').valid).toBe(false);
    expect(validateSafeWebhookUrl('ftp://example.com').valid).toBe(false);
  });

  it('rejects loopback addresses and localhost', () => {
    expect(validateSafeWebhookUrl('https://localhost/webhook').valid).toBe(false);
    expect(validateSafeWebhookUrl('https://127.0.0.1/webhook').valid).toBe(false);
    expect(validateSafeWebhookUrl('https://[::1]/webhook').valid).toBe(false);
    expect(validateSafeWebhookUrl('https://127.1.2.3/webhook').valid).toBe(false);
  });

  it('rejects private IPv4 networks (RFC 1918)', () => {
    expect(validateSafeWebhookUrl('https://10.0.0.1/hook').valid).toBe(false);
    expect(validateSafeWebhookUrl('https://172.16.0.1/hook').valid).toBe(false);
    expect(validateSafeWebhookUrl('https://172.31.255.254/hook').valid).toBe(false);
    expect(validateSafeWebhookUrl('https://192.168.1.1/hook').valid).toBe(false);
  });

  it('rejects cloud metadata IP 169.254.169.254 and link-local', () => {
    expect(validateSafeWebhookUrl('https://169.254.169.254/latest/meta-data').valid).toBe(false);
    expect(validateSafeWebhookUrl('https://169.254.1.1/hook').valid).toBe(false);
  });

  it('accepts public https endpoints', () => {
    expect(validateSafeWebhookUrl('https://hooks.slack.com/services/xxx').valid).toBe(true);
    expect(validateSafeWebhookUrl('https://outlook.office.com/webhook/xxx').valid).toBe(true);
    expect(validateSafeWebhookUrl('https://api.mycompany.com/webhook').valid).toBe(true);
  });
});

describe('Settings API Hardening', () => {
  it('redacts smtpPass in GET /settings', async () => {
    const mockOrg = {
      id: 'org-1',
      name: 'PT BUMN Holding',
      logo: null,
      metadata: {
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'notify@bumn.go.id',
        smtpPass: 'super-secret-password-12345',
        fiscalYear: 2026,
      },
    };

    mockedGetDb.mockReturnValue(
      stubDb({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [mockOrg],
            }),
          }),
        }),
      })
    );

    const app = createApp();
    const res = await app.request('/settings');
    expect(res.status).toBe(200);
    const data = await res.json<{ data: { smtpPass: string } }>();
    expect(data.data.smtpPass).toBe('********');
  });

  it('omits smtp and webhook secrets for non-privileged roles in GET /settings', async () => {
    const mockOrg = {
      id: 'org-1',
      name: 'PT BUMN Holding',
      logo: null,
      metadata: {
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'notify@bumn.go.id',
        smtpPass: 'super-secret-password-12345',
        slackWebhookUrl: 'https://hooks.slack.com/services/T/B/X',
        slackEnabled: true,
        fiscalYear: 2026,
      },
    };

    mockedGetDb.mockReturnValue(
      stubDb({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [mockOrg],
            }),
          }),
        }),
      })
    );

    const app = new Hono<HonoEnv>();
    app.use('*', async (c, next) => {
      c.set('userId', 'user-line1');
      c.set('userRole', 'Line 1');
      c.set('organizationId', 'org-1');
      c.env = {
        DATABASE_URL: 'postgres://dummy',
        BETTER_AUTH_URL: 'http://localhost:3000',
      } as HonoEnv['Bindings'];
      await next();
    });
    app.route('/', settingsRoute);

    const res = await app.request('/settings');
    expect(res.status).toBe(200);
    const data = await res.json<{ data: { smtpPass: string; smtpHost: string; slackWebhookUrl: string } }>();
    expect(data.data.smtpPass).toBe('');
    expect(data.data.smtpHost).toBe('');
    expect(data.data.slackWebhookUrl).toBe('');
  });

  it('rejects unlocking period when verificationHash is present in PUT /settings', async () => {
    const mockOrg = {
      id: 'org-1',
      name: 'PT BUMN Holding',
      metadata: {
        fiscalYear: 2026,
        isPeriodLocked: true,
        verificationHash: 'SIGNOFF12345',
      },
    };

    mockedGetDb.mockReturnValue(
      stubDb({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [mockOrg],
            }),
          }),
        }),
      })
    );

    const app = createApp();
    const res = await app.request('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPeriodLocked: false }),
    });

    expect(res.status).toBe(403);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('CANNOT_UNLOCK_SIGNED_PERIOD');
  });

  it('rejects POST /settings/test-webhook targeted at internal network (SSRF)', async () => {
    const app = createApp();
    const res = await app.request('/settings/test-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'generic',
        webhookUrl: 'https://169.254.169.254/latest/meta-data',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('SSRF_TARGET_BLOCKED');
  });
});
