import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import plugin from './index.js';

const tester = new RuleTester();

describe('local/no-writing-get', () => {
  tester.run('no-writing-get', plugin.rules['no-writing-get'], {
    valid: [
      // A read route stays writable-free.
      "app.get('/x', async (c) => { const rows = await db.select().from(t); return ok(c, rows) })",
      // Not a route registration (no path literal).
      'map.get(key)',
      'db.update(t).set({ x: 1 })',
      // A raw SELECT through db.execute is a read, not a write.
      "app.get('/x', async (c) => { const r = await db.execute(sql`SELECT * FROM t`); return ok(c, r.rows) })",
      // A write route is not this rule's business.
      "app.post('/x', rbac(['Admin']), async (c) => { await db.insert(t).values({}) })",
    ],
    invalid: [
      {
        code: "app.get('/x', async (c) => { await db.insert(t).values({}) })",
        errors: [{ messageId: 'writingGet' }],
      },
      {
        // `.all(` answers every verb, so a write here is reachable by GET too.
        code: "app.all('/x', async (c) => { await db.execute(sql`DELETE FROM t`) })",
        errors: [{ messageId: 'writingGet' }],
      },
      {
        // A write nested inside a transaction still counts.
        code: "app.get('/x', async (c) => { await db.transaction(async (tx) => { await tx.delete(t) }) })",
        errors: [{ messageId: 'writingGet' }],
      },
    ],
  });
});

describe('local/routes-require-rbac', () => {
  tester.run('routes-require-rbac', plugin.rules['routes-require-rbac'], {
    valid: [
      "app.post('/x', rbac(['Admin']), handler)",
      "app.delete('/x/:id', rbac(['Line 2', 'Admin']), handler)",
      "app.put('/x/:id', rbac(['Line 1']), handler)",
      // Not a mutating verb.
      "app.get('/x', handler)",
      // Not a route registration.
      'db.delete(t)',
      "cache.delete('/tmp/x')",
      // A session-scoped write may state that no role applies — with its reason.
      "// rbac-exempt: self-scoped — writes only the caller's row\napp.put('/user/preferences', handler)",
      "/* rbac-exempt: self-scoped — the WHERE carries the caller's userId */\napp.post('/notifications/:id/read', handler)",
    ],
    invalid: [
      {
        code: "app.post('/x', handler)",
        errors: [{ messageId: 'missingGuard' }],
      },
      {
        code: "app.delete('/x/:id', adminOnly, handler)",
        errors: [{ messageId: 'missingGuard' }],
      },
      {
        // The reason is the whole point: an empty directive is not an exemption.
        code: "// rbac-exempt:\napp.put('/x', handler)",
        errors: [{ messageId: 'exemptionWithoutReason' }],
      },
      {
        // The directive covers the route it sits above, and only that one.
        code: "// rbac-exempt: self-scoped — own row\napp.put('/a', handler)\napp.put('/b', handler)",
        errors: [{ messageId: 'missingGuard' }],
      },
      {
        // A guard was added later; the directive is now a lie about the code.
        code: "// rbac-exempt: self-scoped — own row\napp.put('/x', rbac(['Admin']), handler)",
        errors: [{ messageId: 'staleExemption' }],
      },
    ],
  });
});
