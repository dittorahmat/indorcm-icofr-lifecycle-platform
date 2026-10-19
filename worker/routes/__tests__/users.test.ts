import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import users from '../users';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';
import { getDb } from '../../db';

vi.mock('../../db', () => ({
  getDb: vi.fn()
}));

describe('User API Routes', () => {
  let app: Hono<any>;
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.restoreAllMocks();
    app = new Hono();
    // Simulate auth middleware setting userId + Admin RBAC context
    app.use('*', async (c, next) => {
      c.set('userId', mockUserId);
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Admin');
      c.env = { DATABASE_URL: 'postgres://mock' };
      await next();
    });
    app.route('/api', users);
  });

  it('GET /api/user/preferences returns null layout when preference does not exist', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    });

    vi.mocked(getDb).mockReturnValue({
      select: mockSelect
    } as any);

    const res = await app.request('/api/user/preferences', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(res.status).toBe(200);
    const json = await res.json<any>();
    expect(json.success).toBe(true);
    expect(json.data.layout).toBeNull();
  });

  it('GET /api/user/preferences returns existing layout configuration', async () => {
    const mockLayout = [{ i: 'heatmap', x: 0, y: 0, w: 12, h: 4 }];
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ userId: mockUserId, layout: mockLayout }])
        })
      })
    });

    vi.mocked(getDb).mockReturnValue({
      select: mockSelect
    } as any);

    const res = await app.request('/api/user/preferences');

    expect(res.status).toBe(200);
    const json = await res.json<any>();
    expect(json.success).toBe(true);
    expect(json.data.layout).toEqual(mockLayout);
  });

  it('PUT /api/user/preferences inserts new layout if none exists', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    });

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({} as any)
    });

    vi.mocked(getDb).mockReturnValue({
      select: mockSelect,
      insert: mockInsert
    } as any);

    const newLayout = [{ i: 'coso', x: 0, y: 0, w: 6, h: 4 }];
    const res = await app.request('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ layout: newLayout })
    });

    expect(res.status).toBe(200);
    const json = await res.json<any>();
    expect(json.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it('PUT /api/user/preferences updates existing layout', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ userId: mockUserId }])
        })
      })
    });

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({} as any)
      })
    });

    vi.mocked(getDb).mockReturnValue({
      select: mockSelect,
      update: mockUpdate
    } as any);

    const updatedLayout = [{ i: 'coso', x: 0, y: 0, w: 8, h: 4 }];
    const res = await app.request('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ layout: updatedLayout })
    });

    expect(res.status).toBe(200);
    const json = await res.json<any>();
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('POST /api/users rejects an unknown role with 400 and never touches the DB', async () => {
    vi.mocked(getDb).mockClear();
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X', email: 'x@bumn.go.id', role: 'Komisaris', level: 'Staff' }),
    });

    expect(res.status).toBe(400);
    const json: { success: boolean; error: string } = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('INVALID_USER_ROLE');
    expect(getDb).not.toHaveBeenCalled();
  });

  it('POST /api/users rejects an unknown level with 400 and never touches the DB', async () => {
    vi.mocked(getDb).mockClear();
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Y', email: 'y@bumn.go.id', role: 'Admin', level: 'Direktur' }),
    });

    expect(res.status).toBe(400);
    const json: { success: boolean; error: string } = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('INVALID_USER_LEVEL');
    expect(getDb).not.toHaveBeenCalled();
  });

  it('PUT /api/users/:id rejects an unknown role with 400 and never touches the DB', async () => {
    vi.mocked(getDb).mockClear();
    const res = await app.request('/api/users/u1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'Komisaris' }),
    });

    expect(res.status).toBe(400);
    const json: { success: boolean; error: string } = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('INVALID_USER_ROLE');
    expect(getDb).not.toHaveBeenCalled();
  });
});

describe('users barrel URL lock', () => {
  it('keeps every users URL byte-identical', async () => {
    const mod = await import('../users');
    const routePaths = (mod.default.routes as Array<{ method: string; path: string }>).map(
      (r) => `${r.method} ${r.path}`,
    );

    expect(routePaths).toContain('GET /user/me');
    expect(routePaths).toContain('GET /user/preferences');
    expect(routePaths).toContain('PUT /user/preferences');
    expect(routePaths).toContain('GET /users');
    expect(routePaths).toContain('POST /users');
    expect(routePaths).toContain('PUT /users/:id');
    expect(routePaths).toContain('DELETE /users/:id');
    expect(routePaths).toContain('GET /departments');
    expect(routePaths).toContain('POST /departments');
    expect(routePaths).toContain('PUT /departments/:id');
    expect(routePaths).toContain('DELETE /departments/:id');
    expect(routePaths).toContain('PUT /user/profile');
    expect(routePaths).toContain('GET /settings');
    expect(routePaths).toContain('PUT /settings');
    expect(routePaths).toContain('POST /settings/test-email');
    expect(routePaths).toContain('POST /settings/test-webhook');
    expect(routePaths).toContain('GET /users/me/notification-preferences');
    expect(routePaths).toContain('PUT /users/me/notification-preferences');
    expect(routePaths).toContain('POST /dev/re-seed');
    expect(routePaths).toContain('POST /dev/purge-all');
    expect(routePaths).toContain('POST /dev/purge-scoping');
  });
});

/**
 * #97: every mutating route in this barrel must refuse a role with no business
 * writing here — except the three the caller's own session owns, which carry an
 * `rbac-exempt:` directive in users.ts. Listing them keeps the exemption honest in
 * both directions (a stray guard on one of them fails here and in the rule too).
 */
describe('users mutating routes carry an rbac guard (#97)', () => {
  const sessionScoped = [
    'PUT /user/preferences',
    'PUT /user/profile',
    'PUT /users/me/notification-preferences',
  ];

  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(users).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route that is not session-scoped', async () => {
    for (const role of OVERSIGHT_ROLES) {
      const reached = await reachableBy(users, role);
      expect(reached.map((r) => r.route).sort(), role).toEqual([...sessionScoped].sort());
    }
  });
});
