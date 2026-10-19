import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import simulations from '../scoping/scoping-simulations';
import lifecycle from '../scoping/scoping-simulation-lifecycle';
import { getDb } from '../../db';
import type { DrizzleDb } from '../../db';
import type { HonoEnv } from '../../app';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

/**
 * Carry-forward is not under test; letting the real service hit the stub would
 * turn every POST into an unrelated query-shape failure.
 */
vi.mock('../../services/scoping-service', () => ({
  ScopingService: class {
    async carryForward() {
      return null;
    }
  },
}));

interface MaterialityError {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * The materiality guards are produced once in the seam and read back by these
 * routes, so the literals are pinned here as known-good strings: a wrong basis
 * (not declared / nothing to derive from) on create, and a submit carrying no
 * derived PM. Handlers stay thin adapters over the codes.
 */
describe('scoping materiality guards', () => {
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    c.set('userId', 'user-1');
    c.set('organizationId', 'org-1');
    c.set('userRole', 'Line 2');
    await next();
  });
  app.route('/api', simulations);
  app.route('/api', lifecycle);

  const env = {
    DATABASE_URL: 'postgres://mock',
    BETTER_AUTH_SECRET: 'test',
    GEMINI_API_KEY: 'test',
    DOCUMENTS_BUCKET: undefined,
  };

  /**
   * boundary: drizzle stub — one entry per select→from→where read, in order.
   * `limit` serves the snapshot/simulation lookups, `where` the awaited row sets.
   */
  const stubDb = (reads: Array<{ limit?: unknown[]; where?: unknown[] }>): DrizzleDb => {
    const db: DrizzleDb = Object.create(null);
    let call = 0;
    const select = vi.fn(() => {
      const read = reads[call++] ?? {};
      return {
        from: vi.fn(() => ({
          where: vi.fn(() =>
            Object.assign(Promise.resolve(read.where ?? []), {
              limit: vi.fn(() => Promise.resolve(read.limit ?? [])),
            })
          ),
        })),
      };
    });
    return Object.assign(db, { select });
  };

  const createSimulation = async (
    body: Record<string, unknown>,
    reads: Array<{ limit?: unknown[]; where?: unknown[] }>
  ) => {
    vi.mocked(getDb).mockReturnValue(stubDb(reads));
    const res = await app.request(
      '/api/simulations',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      env
    );
    return { status: res.status, body: await res.json<MaterialityError>() };
  };

  it('rejects a basis the snapshot neither declares nor carries rows for', async () => {
    const { status, body } = await createSimulation({ glSnapshotId: 'snap-1', basis: 'Sales' }, [
      { limit: [{ benchmarkFsliNames: ['Revenue'] }] },
      { where: [{ fsliName: 'Cash', balance: 100 }] },
    ]);

    expect(status).toBe(400);
    expect(body.error).toBe('MATERIALITY_BASIS_NOT_IN_SNAPSHOT');
  });

  it('rejects a declared benchmark whose rows derive no value', async () => {
    const { status, body } = await createSimulation({ glSnapshotId: 'snap-1', basis: 'Revenue' }, [
      { limit: [{ benchmarkFsliNames: ['Revenue'] }] },
      { where: [{ fsliName: 'Sales', balance: 100 }] },
    ]);

    expect(status).toBe(400);
    expect(body.error).toBe('MATERIALITY_BASIS_HAS_NO_VALUE');
  });

  it('refuses a submit whose simulation carries no derived PM', async () => {
    vi.mocked(getDb).mockReturnValue(
      stubDb([{ limit: [{ id: 'sim-1', organizationId: 'org-1', name: 'Sim', glSnapshotId: null, pmValue: 0 }] }])
    );

    const res = await app.request(
      '/api/simulations/sim-1/workflow',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'Submit' }) },
      env
    );

    expect(res.status).toBe(400);
    expect((await res.json<MaterialityError>()).error).toBe('MATERIALITY_NOT_CALCULATED');
  });
});
