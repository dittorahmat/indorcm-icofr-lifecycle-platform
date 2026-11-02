import { Hono, type Context } from 'hono';
import type { HonoEnv } from '../../app';
import { ok, bad, notFound, AppError } from '../../lib/utils';
import { getDb } from '../../db';
import { user, member } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { UserRole } from '@shared/types';
import { toMemberRole } from '@shared/member-role';
import { rbac } from '../../lib/guard';
import { isUserLevel, isUserRole } from '@shared/role-options';

interface CreateUserBody {
  name: string;
  email: string;
  role?: unknown;
  level?: unknown;
  departmentId?: string | null;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
  role?: unknown;
  level?: unknown;
  departmentId?: string | null;
}

/** Admin user management: list, create, update, delete. */
const admin = new Hono<HonoEnv>();

/** Map a typed `AppError` through `bad()` — this barrel is mounted without `app.onError` in tests. */
const rejectOption = (c: Context<HonoEnv>, err: AppError) =>
  bad(c, err.code, err.status, err.message);

admin.get('/users', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');

  const results = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    // #106: the ICOFR role lives on `user.role` — the same column `GET /user/me`
    // returns and the client surfaces read. `member.role` is Better Auth's own
    // vocabulary and would list every seeded user as 'member'.
    role: user.role,
    level: user.level,
    departmentId: user.departmentId,
  })
  .from(user)
  .innerJoin(member, eq(user.id, member.userId))
  .where(eq(member.organizationId, orgId));

  return ok(c, { items: results });
});

admin.post('/users', rbac(['Admin']), async (c) => {
  const orgId = c.get('organizationId');
  const body = await c.req.json<CreateUserBody>();

  const roleInput = body.role ?? 'Line 1';
  if (!isUserRole(roleInput)) return rejectOption(c, new AppError('INVALID_USER_ROLE', `Unknown role: ${String(roleInput)}`, 400));
  const role = roleInput;
  const levelInput = body.level ?? 'Staff';
  if (!isUserLevel(levelInput)) return rejectOption(c, new AppError('INVALID_USER_LEVEL', `Unknown level: ${String(levelInput)}`, 400));
  const level = levelInput;

  const db = getDb(c.env.DATABASE_URL);
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name: body.name,
    email: body.email,
    emailVerified: false,
    role,
    level,
    departmentId: body.departmentId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: id,
    // #106: the ICOFR role goes to `user.role` above; the membership keeps
    // Better Auth's own vocabulary.
    role: toMemberRole(role),
    createdAt: new Date(),
  });

  return ok(c, { id });
});

admin.put('/users/:id', rbac(['Admin']), async (c) => {
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const db = getDb(c.env.DATABASE_URL);

  const targetMember = await db.select({ userId: member.userId })
    .from(member)
    .where(and(eq(member.userId, id), eq(member.organizationId, orgId)))
    .limit(1);

  if (targetMember.length === 0) {
    return notFound(c, 'USER_NOT_FOUND', 'User not found in organization');
  }

  const body = await c.req.json<UpdateUserBody>();

  if (body.role !== undefined && !isUserRole(body.role)) return rejectOption(c, new AppError('INVALID_USER_ROLE', `Unknown role: ${String(body.role)}`, 400));
  if (body.level !== undefined && !isUserLevel(body.level)) return rejectOption(c, new AppError('INVALID_USER_LEVEL', `Unknown level: ${String(body.level)}`, 400));

  const nextRole: UserRole | undefined = isUserRole(body.role) ? body.role : undefined;
  const nextLevel = isUserLevel(body.level) ? body.level : undefined;

  await db.update(user).set({
    name: body.name,
    email: body.email,
    level: nextLevel,
    departmentId: body.departmentId,
    // #106: a role change moves the ICOFR role, not the membership's vocabulary.
    role: nextRole,
    updatedAt: new Date(),
  }).where(eq(user.id, id));

  if (nextRole) {
    await db.update(member).set({ role: toMemberRole(nextRole) }).where(and(eq(member.userId, id), eq(member.organizationId, orgId)));
  }

  return ok(c, { success: true });
});

admin.delete('/users/:id', rbac(['Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  const targetMember = await db.select({ userId: member.userId })
    .from(member)
    .where(and(eq(member.userId, id), eq(member.organizationId, orgId)))
    .limit(1);

  if (targetMember.length === 0) {
    return notFound(c, 'USER_NOT_FOUND', 'User not found in organization');
  }

  await db.delete(member).where(and(eq(member.userId, id), eq(member.organizationId, orgId)));
  await db.delete(user).where(eq(user.id, id));
  return ok(c, { success: true });
});

export default admin;
