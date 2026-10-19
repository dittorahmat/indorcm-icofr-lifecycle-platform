import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../worker/db';
import * as schema from '../worker/db/schema';
import { planRoleRepair } from '@shared/member-role';

/**
 * One-off repair for #106 — rows written before the role source was settled.
 *
 * Two columns carried a role and the writers disagreed: the seed wrote the ICOFR
 * role to `user.role` and Better Auth's `'admin' | 'member'` to `member.role`,
 * while the old `POST /users` did the opposite. The plan for each membership comes
 * from `planRoleRepair`, which converges `user.role` on the role the request gate
 * grants the row *today* before the membership is normalised — so the repair can
 * never move a user's effective role, and a row with no role anywhere lands on
 * `'Line 1'`, the floor the gate already applies at runtime.
 *
 * Idempotent: rows already consistent plan no writes. Run with DATABASE_URL set.
 */
async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️ DATABASE_URL is missing. Skipping backfill (no active DB connection string).');
    return;
  }

  const db = getDb(databaseUrl);
  console.log('🛠️ Backfilling the ICOFR role source (#106)...');

  const members = await db.select().from(schema.member);
  let rolesMoved = 0;
  let membershipsNormalised = 0;

  for (const membership of members) {
    const rows = await db.select({ role: schema.user.role })
      .from(schema.user)
      .where(eq(schema.user.id, membership.userId))
      .limit(1);
    if (rows.length === 0) continue;

    const plan = planRoleRepair(rows[0].role, membership.role);

    if (plan.needsUserWrite) {
      await db.update(schema.user).set({ role: plan.userRole }).where(eq(schema.user.id, membership.userId));
      rolesMoved++;
      console.log(`✅ ${membership.userId}: user.role ← ${plan.userRole} (was ${String(rows[0].role)}).`);
    }

    if (plan.needsMemberWrite) {
      await db.update(schema.member).set({ role: plan.memberRole }).where(eq(schema.member.id, membership.id));
      membershipsNormalised++;
    }
  }

  console.log(
    `\n🎉 Backfill complete — ${rolesMoved} user role(s) written, ` +
    `${membershipsNormalised} membership(s) normalised.`,
  );
}

run().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exitCode = 1;
});
