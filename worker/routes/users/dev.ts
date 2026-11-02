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
  const orgId = c.get('organizationId');
  if (!orgId) return bad(c, 'ORGANIZATION_REQUIRED', 400, 'Active organization context required');

  try {
    // One transaction: scoped strictly to the caller's active organization ID
    await db.transaction(async (tx) => {
      await tx.execute(sql`DELETE FROM bpm_diagrams WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM bpm_node_rcms WHERE rcm_id IN (SELECT id FROM rcms WHERE organization_id = ${orgId})`);
      await tx.execute(sql`DELETE FROM rcm_controls WHERE rcm_id IN (SELECT id FROM rcms WHERE organization_id = ${orgId})`);
      await tx.execute(sql`DELETE FROM rcms WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM controls WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM bpm_processes WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM csa_records WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM test_records WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM action_plans WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM deficiencies WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM simulations WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM gl_snapshots WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM gl_rows WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM departments WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM audit_logs WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM aggregate_deficiencies WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM account_assertions WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM vendors WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM soc_reports WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM soc_evaluations WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM csa_schedules WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM transaction_details WHERE organization_id = ${orgId}`);
      await tx.execute(sql`DELETE FROM transaction_uploads WHERE organization_id = ${orgId}`);
    });

    return ok(c, { message: 'Organization business data purged successfully.' });
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
