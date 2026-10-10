// Drift gate: schema.ts vs drizzle/meta snapshots (ADR-0003 follow-up).
// Copies drizzle/ to a temp dir and runs `drizzle-kit generate` there (never
// touches the repo), then fails when it errors or emits a migration — meaning
// someone changed worker/db/schema.ts without generating, or hand-edited meta.
// Usage: npm run db:check (also handy in CI before push/deploy).
import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repo = resolve(import.meta.dirname, '..');
const work = mkdtempSync(join(tmpdir(), 'icofr-db-check-'));
const drizz = join(work, 'drizzle');
// NOTE: the temp config must live inside the repo so `drizzle-kit` resolves
// from node_modules; it is deleted in `finally` below.
const cfg = join(repo, 'drizzle.check.config.ts');
let failed = null;
try {
  cpSync(join(repo, 'drizzle'), drizz, { recursive: true });
  const before = new Set(readdirSync(drizz).filter((f) => f.endsWith('.sql')));
  writeFileSync(
    cfg,
    `import { defineConfig } from "drizzle-kit";\nexport default defineConfig({ schema: "./worker/db/schema.ts", out: ${JSON.stringify(drizz)}, dialect: "postgresql", schemaFilter: ["icofr"] });\n`,
  );
  execSync(`npx drizzle-kit generate --config="${cfg}"`, { cwd: repo, stdio: 'pipe' });
  const after = readdirSync(drizz).filter((f) => f.endsWith('.sql') && !before.has(f));
  if (after.length > 0) {
    failed = `schema drift — generate wants new migration(s): ${after.join(', ')}. Run \`npx drizzle-kit generate\`, review the diff, then commit it with its snapshot+journal.`;
  }
} catch (e) {
  failed = `drizzle-kit generate errored — snapshot chain or schema drift. ${String(e.stdout ?? e.message ?? e).split('\n').slice(-8).join('\n')}`;
} finally {
  rmSync(cfg, { force: true });
  rmSync(work, { recursive: true, force: true });
}
if (failed) {
  console.error(`[db:check] FAIL: ${failed}`);
  process.exit(1);
}
console.log('[db:check] OK: schema.ts in sync with drizzle/meta (no drift).');
