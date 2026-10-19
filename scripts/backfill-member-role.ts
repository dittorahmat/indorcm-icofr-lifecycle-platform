import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../worker/db';
import * as schema from '../worker/db/schema';
import { isUserRole } from '@shared/role-options';
import { toMemberRole } from '@shared/member-role';
import type { UserRole } from '@shared/types';

/**
 * One-off repair for #106 — rows written before the role source was settled.
 *
 * 1. `user.role` is the ICOFR role the request gate and the client surfaces read.
 *    Where an older `POST /users` parked that role in `member.role` and left
 *    `user.role` empty, copy it over. A `user.role` that already holds a real
 *    `UserRole` is authoritative and is never overwritten.
 * 2. `member.role` is normalised to Better Auth's own vocabulary (`admin` for the
 *    super admin, `member` otherwise) — the shape `worker/db/seed.ts` writes.
 *
 * Idempotent: rows already consistent are skipped. Run with DATABASE_URL set.
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
  let unknown = 0;

  for (const membership of members) {
    const rows = await db.select({ role: schema.user.role })
      .from(schema.user)
      .where(eq(schema.user.id, membership.userId))
      .limit(1);
    if (rows.length === 0) continue;

    const userRole = rows[0].role;
    const memberRole = membership.role;
    const icofrRole: UserRole | null = isUserRole(userRole)
      ? userRole
      : isUserRole(memberRole) ? memberRole : null;

    if (icofrRole === null) {
      // Neither column holds a role: nothing to preserve, and inventing one would
      // hand out privileges the row never had.
      unknown++;
      console.log(`⏩ Membership ${membership.userId}: no ICOFR role in either column — left alone.`);
      continue;
    }

    if (!isUserRole(userRole)) {
      await db.update(schema.user).set({ role: icofrRole }).where(eq(schema.user.id, membership.userId));
      rolesMoved++;
      console.log(`✅ ${membership.userId}: user.role ← ${icofrRole} (was ${String(userRole)}).`);
    }

    const betterAuthRole = toMemberRole(icofrRole);
    if (memberRole !== betterAuthRole) {
      await db.update(schema.member).set({ role: betterAuthRole }).where(eq(schema.member.id, membership.id));
      membershipsNormalised++;
    }
  }

  console.log(
    `\n🎉 Backfill complete — ${rolesMoved} user role(s) moved, ` +
    `${membershipsNormalised} membership(s) normalised, ${unknown} left alone.`,
  );
}

run().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exitCode = 1;
});
