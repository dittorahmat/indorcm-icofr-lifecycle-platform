import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, notFound } from '../lib/utils';
import { getDb } from '../db';
import { auditLogs } from '../db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { rbac } from "../lib/guard";

const audit = new Hono<HonoEnv>();

const getChangelogsHandler = async (c: any) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const entityId = c.req.query('entityId');
  const entityType = c.req.query('entityType');
  const isRegulatory = c.req.query('isRegulatory');

  const conditions = [eq(auditLogs.organizationId, orgId)];
  if (entityId) {
    conditions.push(eq(auditLogs.entityId, entityId));
  }
  if (entityType) {
    conditions.push(eq(auditLogs.entityType, entityType));
  }
  if (isRegulatory === 'true') {
    conditions.push(eq(auditLogs.isRegulatory, true));
  }

  const items = await db.select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.timestamp))
    .limit(100);

  return ok(c, { items });
};

audit.get('/changelogs', rbac(['Line 2', 'Admin']), getChangelogsHandler);
audit.get('/change-logs', rbac(['Line 2', 'Admin', 'Line 1']), getChangelogsHandler);

export default audit;
