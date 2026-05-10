import { Hono } from "hono";
import type { HonoEnv } from './app';
import { ok } from './lib/utils';
import { getDb } from './db';
import { 
  bpmDiagrams
} from './db/schema';
import { eq } from 'drizzle-orm';

export function userRoutes(app: Hono<HonoEnv>) {
  // --- Legacy/Support Routes ---

  app.get('/api/legacy/bpm-summary', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(bpmDiagrams).where(eq(bpmDiagrams.organizationId, orgId));
    return ok(c, { items });
  });
}
