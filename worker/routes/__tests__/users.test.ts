import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import users from '../users';
import { getDb } from '../../db';

vi.mock('../../db', () => ({
  getDb: vi.fn()
}));

describe('User Preferences API Routes', () => {
  let app: Hono<any>;
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.restoreAllMocks();
    app = new Hono();
    // Simulate auth middleware setting userId
    app.use('*', async (c, next) => {
      c.set('userId', mockUserId);
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
});
