import { Hono } from "hono";
import type { HonoEnv } from './app';
import { ok } from './lib/utils';
import { getDb } from './db';
import { 
  accountAssertions, bpmDiagrams
} from './db/schema';
import { eq, and, SQL } from 'drizzle-orm';
import type { AccountAssertion } from "@shared/types";

export function userRoutes(app: Hono<HonoEnv>) {
  // --- Account Assertion Routes ---

  app.get('/api/account-assertions', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(accountAssertions).where(eq(accountAssertions.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/account-assertions/sync', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const { items } = await c.req.json<{ items: Partial<AccountAssertion>[] }>();

    if (!items || !Array.isArray(items)) return ok(c, { success: false });

    for (const item of items) {
      const existing = await db.select().from(accountAssertions).where(and(
        eq(accountAssertions.noGL, item.noGL || ''),
        eq(accountAssertions.organizationId, orgId)
      )).limit(1);

      const values = {
        organizationId: orgId,
        noGL: item.noGL || '',
        fsliName: item.fsliName || '',
        assertionE: item.assertionE,
        assertionC: item.assertionC,
        assertionA: item.assertionA,
        assertionVa: item.assertionVa,
        assertionRo: item.assertionRo,
        assertionCo: item.assertionCo,
        assertionPd: item.assertionPd,
      };

      if (existing.length > 0) {
        await db.update(accountAssertions).set(values).where(eq(accountAssertions.id, existing[0].id));
      } else {
        await db.insert(accountAssertions).values({ id: crypto.randomUUID(), ...values });
      }
    }

    return ok(c, { success: true });
  });

  // --- Legacy/Support Routes ---

  app.get('/api/legacy/bpm-summary', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(bpmDiagrams).where(eq(bpmDiagrams.organizationId, orgId));
    return ok(c, { items });
  });
}
