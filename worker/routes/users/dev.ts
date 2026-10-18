import { Hono, type Context } from 'hono';
import { sql } from 'drizzle-orm';
import type { HonoEnv } from '../../app';
import { ok, bad } from '../../lib/utils';
import { getDb } from '../../db';
import { seedDatabase } from '../../db/seed';
import { ScopingService } from '../../services/scoping-service';
import { rbac } from '../../lib/guard';
import { assertConfirmToken, assertDevAllowed } from '../../lib/dev-guard';

/**
 * Dev tooling: Admin only, POST + confirm token, refused in production.
 *
 * Split out of the `users` barrel so the barrel stays inside the 400-LOC soft
 * limit. URLs are unchanged — the barrel mounts this at `/` — and they stay locked
 * by `worker/routes/__tests__/users.test.ts`.
 */
const devRoutes = new Hono<HonoEnv>();

/** The shared gate: a refusal response, or `null` when the caller may proceed. */
function devRefusal(c: Context<HonoEnv>): Response | null {
  const gate = assertDevAllowed(c.env);
  if (!gate.allowed) return bad(c, gate.reason || 'Forbidden');
  const token = c.req.header('x-dev-confirm') ?? c.req.query('confirm');
  if (!assertConfirmToken(c.env, token)) {
    return bad(c, 'DEV_CONFIRM_REQUIRED', 400, 'Missing or invalid x-dev-confirm token');
  }
  return null;
}

devRoutes.post('/dev/re-seed', rbac(['Admin']), async (c) => {
  const refusal = devRefusal(c);
  if (refusal) return refusal;
  const mode = c.req.query('mode') || 'full';
  const isSyncOnly = mode === 'auth';

  try {
    await seedDatabase(c.env.DATABASE_URL, c.env.BETTER_AUTH_SECRET, 'true', isSyncOnly);
    return ok(c, { message: isSyncOnly ? 'Auth synced!' : 'Database re-seeded successfully' });
  } catch (e: unknown) {
    console.error('Seed error:', e);
    return bad(c, 'DEV_SEED_FAILED', 500);
  }
});

devRoutes.post('/dev/purge-all', rbac(['Admin']), async (c) => {
  const refusal = devRefusal(c);
  if (refusal) return refusal;
  const db = getDb(c.env.DATABASE_URL);
  try {
    // One transaction: a mid-list failure must not leave a half-purged tenant.
    await db.transaction(async (tx) => {
      await tx.execute(sql`DELETE FROM bpm_diagrams`);
      await tx.execute(sql`DELETE FROM bpm_node_rcms`);
      await tx.execute(sql`DELETE FROM rcm_controls`);
      await tx.execute(sql`DELETE FROM rcms`);
      await tx.execute(sql`DELETE FROM controls`);
      await tx.execute(sql`DELETE FROM bpm_processes`);
      await tx.execute(sql`DELETE FROM csa_records`);
      await tx.execute(sql`DELETE FROM test_records`);
      await tx.execute(sql`DELETE FROM action_plans`);
      await tx.execute(sql`DELETE FROM deficiencies`);
      await tx.execute(sql`DELETE FROM simulations`);
      await tx.execute(sql`DELETE FROM gl_snapshots`);
      await tx.execute(sql`DELETE FROM gl_rows`);
      await tx.execute(sql`DELETE FROM departments`);
      await tx.execute(sql`DELETE FROM audit_logs`);
      await tx.execute(sql`DELETE FROM aggregate_deficiencies`);
      await tx.execute(sql`DELETE FROM account_assertions`);
      await tx.execute(sql`DELETE FROM vendors`);
      await tx.execute(sql`DELETE FROM soc_reports`);
      await tx.execute(sql`DELETE FROM soc_evaluations`);
      await tx.execute(sql`DELETE FROM csa_schedules`);
      await tx.execute(sql`DELETE FROM transaction_details`);
      await tx.execute(sql`DELETE FROM transaction_uploads`);
    });

    return ok(c, { message: 'All business data purged. Fresh start!' });
  } catch (e: unknown) {
    console.error('Purge-all error:', e);
    return bad(c, 'DEV_PURGE_FAILED', 500);
  }
});

devRoutes.post('/dev/purge-scoping', rbac(['Admin']), async (c) => {
  const refusal = devRefusal(c);
  if (refusal) return refusal;
  const db = getDb(c.env.DATABASE_URL);
  const scopingService = new ScopingService(db);
  try {
    const result = await scopingService.purgeData(c.get('organizationId'), c.get('userId'));
    return ok(c, result);
  } catch (e: unknown) {
    console.error('Purge-scoping error:', e);
    return bad(c, 'DEV_PURGE_FAILED', 500);
  }
});

export default devRoutes;
