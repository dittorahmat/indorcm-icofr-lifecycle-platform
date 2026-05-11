import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, notFound } from '../lib/utils';
import { getDb } from '../db';
import { auditLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { rbac } from "../lib/guard";

const audit = new Hono<HonoEnv>();

audit.get('/changelogs', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const entityId = c.req.query('entityId');
  const entityType = c.req.query('entityType');

  let query = db.select().from(auditLogs).where(eq(auditLogs.organizationId, orgId));

  if (entityId) {
    query = db.select().from(auditLogs).where(eq(auditLogs.entityId, entityId)) as any;
  }
  
  if (entityType) {
    query = db.select().from(auditLogs).where(eq(auditLogs.entityType, entityType)) as any;
  }

  const items = await db.select()
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, orgId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(100);

  return ok(c, { items });
});

export default audit;
