import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import aiFilesApp from '../ai-docs/files';
import { getDb } from '../../db';
import { getStorageBucket, type StorageBucket } from '../../lib/storage';
import type { HonoEnv } from '../../app';
import type { DrizzleDb } from '../../db';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

vi.mock('../../lib/storage', () => ({
  getStorageBucket: vi.fn(),
}));

const stubDb = (overrides: Record<string, unknown> = {}): DrizzleDb => {
  const db: DrizzleDb = Object.create(null);
  return Object.assign(db, overrides);
};

describe('Storage Files API (Ticket #03)', () => {
  let app: Hono<HonoEnv>;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = new Hono<HonoEnv>();
  });

  it('GET /api/files/* returns 401 when unauthenticated', async () => {
    app.route('/api', aiFilesApp);

    const res = await app.request('/api/files/uploads/org-1/test.pdf');
    expect(res.status).toBe(401);
    const json = await res.json<{ success: boolean; error: string }>();
    expect(json.success).toBe(false);
    expect(json.error).toBe('UNAUTHORIZED');
  });

  it('GET /api/files/* returns 403 when accessing another organization upload', async () => {
    app.use('*', async (c, next) => {
      c.set('userId', 'user-1');
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Line 1');
      Object.assign(c, { env: { DATABASE_URL: 'postgres://mock' } });
      await next();
    });
    app.route('/api', aiFilesApp);

    const res = await app.request('/api/files/uploads/org-2/secret.pdf');
    expect(res.status).toBe(403);
    const json = await res.json<{ success: boolean; error: string }>();
    expect(json.success).toBe(false);
    expect(json.error).toBe('FILE_CROSS_TENANT_FORBIDDEN');
  });

  it('GET /api/files/* serves svg as attachment with sandbox CSP to prevent XSS', async () => {
    app.use('*', async (c, next) => {
      c.set('userId', 'user-1');
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Line 1');
      Object.assign(c, { env: { DATABASE_URL: 'postgres://mock' } });
      await next();
    });
    app.route('/api', aiFilesApp);

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

    const res = await app.request('/api/files/uploads/org-1/diagram.svg');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
