import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad } from '../lib/utils';
import { getDb } from '../db';
import { accountAssertions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { AccountAssertion } from "@shared/types";

const accountAssertionsRoute = new Hono<HonoEnv>();

// --- Account Assertion Routes ---

/**
 * GET /api/account-assertions
 * Supports filtering by fsliName and noGL.
 * Returns a single item if both filters are present, otherwise returns a list.
 */
accountAssertionsRoute.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const fsliName = c.req.query('fsliName');
  const noGL = c.req.query('noGL');

  let query = db.select().from(accountAssertions).where(eq(accountAssertions.organizationId, orgId));

  if (fsliName && noGL) {
    const item = await db.select().from(accountAssertions).where(and(
      eq(accountAssertions.organizationId, orgId),
      eq(accountAssertions.fsliName, fsliName),
      eq(accountAssertions.noGL, noGL)
    )).limit(1);
    
    return ok(c, item.length > 0 ? item[0] : null);
  }

  if (fsliName) {
    const items = await db.select().from(accountAssertions).where(and(
      eq(accountAssertions.organizationId, orgId),
      eq(accountAssertions.fsliName, fsliName)
    ));
    return ok(c, { items });
  }

  if (noGL) {
    const items = await db.select().from(accountAssertions).where(and(
      eq(accountAssertions.organizationId, orgId),
      eq(accountAssertions.noGL, noGL)
    ));
    return ok(c, { items });
  }

  const items = await db.select().from(accountAssertions).where(eq(accountAssertions.organizationId, orgId));
  return ok(c, { items });
});

/**
 * POST /api/account-assertions
 * Atomic upsert for a single account assertion.
 */
accountAssertionsRoute.post('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const item = await c.req.json<Partial<AccountAssertion>>();

  if (!item.noGL || !item.fsliName) {
    return bad(c, "Missing required fields: noGL and fsliName");
  }

  const existing = await db.select().from(accountAssertions).where(and(
    eq(accountAssertions.noGL, item.noGL),
    eq(accountAssertions.fsliName, item.fsliName),
    eq(accountAssertions.organizationId, orgId)
  )).limit(1);

  const values = {
    organizationId: orgId,
    noGL: item.noGL,
    fsliName: item.fsliName,
    assertionE: item.assertionE || 'N',
    assertionC: item.assertionC || 'N',
    assertionA: item.assertionA || 'N',
    assertionVa: item.assertionVa || 'N',
    assertionRo: item.assertionRo || 'N',
    assertionCo: item.assertionCo || 'N',
    assertionPd: item.assertionPd || 'N',
    updatedAt: new Date(),
    updatedBy: userId
  };

  if (existing.length > 0) {
    await db.update(accountAssertions).set(values).where(eq(accountAssertions.id, existing[0].id));
    return ok(c, { success: true, id: existing[0].id });
  } else {
    const newId = crypto.randomUUID();
    await db.insert(accountAssertions).values({ id: newId, ...values });
    return ok(c, { success: true, id: newId });
  }
});

export default accountAssertionsRoute;
