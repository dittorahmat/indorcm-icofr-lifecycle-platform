import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import users from '../users';
import { getDb } from '../../db';
import type { DrizzleDb } from '../../db';
import type { HonoEnv } from '../../app';
import * as schema from '../../db/schema';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

/**
 * #106 — the ICOFR role has ONE home per layer: `user.role` for the role itself,
 * `member.role` for Better Auth's own `'admin' | 'member'`. These tests pin the
 * three user routes that used to disagree about it.
 *
 * Drizzle stub, cast-free: the handlers only walk insert→values,
 * update→set→where and select→from→innerJoin→where.
 */
interface Written {
  table: unknown;
  values: Record<string, unknown>;
}

describe('the user role source (#106)', () => {
  const inserted: Written[] = [];
  const updated: Written[] = [];
  let selectedColumns: Record<string, unknown> = {};
  let app: Hono<HonoEnv>;

  /** Better Auth is not in the loop here; the middleware only supplies the request context. */
  const env = { DATABASE_URL: 'postgres://mock' };

  const stubDb = (): DrizzleDb => {
    const db: DrizzleDb = Object.create(null);
    const insert = vi.fn((table: unknown) => ({
      values: vi.fn((values: Record<string, unknown>) => {
        inserted.push({ table, values });
        return Promise.resolve();
      }),
    }));
    const update = vi.fn((table: unknown) => ({
      set: vi.fn((values: Record<string, unknown>) => ({
        where: vi.fn(() => {
          updated.push({ table, values });
          return Promise.resolve();
        }),
      })),
    }));
    const select = vi.fn((columns: Record<string, unknown>) => {
      selectedColumns = columns;
      return {
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{ id: 'u-1', name: 'Siti', email: 'a@b.c', role: 'Line 2' }])),
          })),
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ userId: 'u-1' }])),
          })),
        })),
      };
    });
    return Object.assign(db, { insert, update, select });
  };

  beforeEach(() => {
    inserted.length = 0;
    updated.length = 0;
    selectedColumns = {};
    vi.mocked(getDb).mockReturnValue(stubDb());

    app = new Hono<HonoEnv>();
    app.use('*', async (c, next) => {
      c.set('userId', 'admin-1');
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Admin');
      await next();
    });
    app.route('/api', users);
  });

  const request = (path: string, init?: RequestInit) => app.request(path, init, env);

  const postUser = (body: Record<string, unknown>) =>
    request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Siti', email: 'siti@bumn.go.id', ...body }),
    });

  it('creates the ICOFR role on the user row and Better Auth vocabulary on the membership', async () => {
    const res = await postUser({ role: 'Line 2', level: 'Manager' });

    expect(res.status).toBe(200);
    expect(inserted.find((w) => w.table === schema.user)?.values.role).toBe('Line 2');
    expect(inserted.find((w) => w.table === schema.member)?.values.role).toBe('member');
  });

  it('maps the super admin to Better Auth admin', async () => {
    await postUser({ role: 'Admin' });

    expect(inserted.find((w) => w.table === schema.user)?.values.role).toBe('Admin');
    expect(inserted.find((w) => w.table === schema.member)?.values.role).toBe('admin');
  });

  it('moves a role change onto the user row and normalises the membership', async () => {
    const res = await request('/api/users/u-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'CFO' }),
    });

    expect(res.status).toBe(200);
    expect(updated.find((w) => w.table === schema.user)?.values.role).toBe('CFO');
    expect(updated.find((w) => w.table === schema.member)?.values.role).toBe('member');
  });

  it('leaves both role columns untouched when the body carries no role', async () => {
    await request('/api/users/u-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Siti' }),
    });

    expect(updated.find((w) => w.table === schema.user)?.values.role).toBeUndefined();
    expect(updated.some((w) => w.table === schema.member)).toBe(false);
  });

  it('lists the role from the user row, not the membership', async () => {
    const res = await request('/api/users');

    expect(res.status).toBe(200);
    expect(selectedColumns.role).toBe(schema.user.role);
    expect(selectedColumns.role).not.toBe(schema.member.role);
  });

  it('keeps the membership column readable by the request gate alone', () => {
    // The regression this file exists for: a second reader of `member.role` that
    // silently disagrees with `user.role`. That is also how the CSA Line-2 query is
    // locked — pointing it back at `member.role` re-introduces a second reader and
    // fails here. A new reader is a decision, not a drive-by, so it has to move
    // this expectation.
    const readers = readdirSync('worker', { recursive: true, encoding: 'utf-8' })
      .filter((entry) => entry.endsWith('.ts') && !entry.endsWith('.test.ts'))
      .map((entry) => join('worker', entry))
      .filter((file) => readFileSync(file, 'utf-8').includes('schema.member.role'));

    expect(readers).toEqual([join('worker', 'services', 'request-role.ts')]);
  });
});
