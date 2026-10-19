// scripts/check-rbac-delta.mjs — "no NEW unguarded mutating route" gate.
//
// Usage:
//   node scripts/check-rbac-delta.mjs [--base <ref>] <touched-files...>
//
// Fails when a touched `worker/routes/**` file declares MORE mutating route
// registrations (POST/PUT/PATCH/DELETE) without a guard (`rbac(...)` /
// `assertDevAllowed(...)`) than its <base> version. <base> defaults to the
// branch point (merge-base with origin/main) — see scripts/lib/delta-base.mjs.
// New files are compared against a zero baseline.
//
// Detection is NOT re-implemented here: it runs the real `local/routes-require-rbac`
// rule (eslint-local/index.js) in memory over both the working tree text and the
// base blob, so the gate can never disagree with `npm run lint` about what an
// unguarded route is. That rule is a `warn` (baseline 44 across worker/routes,
// measured 2026-10-19) so the repo can burn the remainder down without freezing
// on day one — this gate is the tooth: the count may only fall.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { Linter } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import plugin from '../eslint-local/index.js';
import { resolveBase } from './lib/delta-base.mjs';

const RULE = 'local/routes-require-rbac';
const ROUTE_FILE = /(^|\/)worker\/routes\/.*\.ts$/;

const linter = new Linter({ configType: 'flat' });
const config = [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: 'module' },
    plugins: { local: plugin },
    rules: { [RULE]: 'warn' },
  },
];

function countUnguarded(code, path) {
  return linter.verify(code, config, path).filter((message) => message.ruleId === RULE).length;
}

function baseContent(path, base) {
  try {
    return execSync('git show ' + base + ':' + JSON.stringify(path), { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

let explicitBase = null;
const files = [];
for (const arg of process.argv.slice(2)) {
  if (arg === '--base' && !explicitBase) {
    explicitBase = 'next';
  } else if (explicitBase === 'next') {
    explicitBase = arg;
  } else if (!arg.startsWith('--')) {
    files.push(arg);
  }
}
if (files.length === 0) {
  console.log('check-rbac-delta: no files given. Usage: node scripts/check-rbac-delta.mjs [--base <ref>] <files...>');
  process.exit(1);
}
const { ref: base, label: baseLabel } = resolveBase(explicitBase);

let errors = 0;
for (const file of files) {
  const normalized = file.replace(/\\/g, '/');
  if (!ROUTE_FILE.test(normalized)) {
    console.log('SKIP  ' + file + ' (not a worker/routes file)');
    continue;
  }
  let now;
  try {
    now = readFileSync(file, 'utf-8');
  } catch {
    console.log('SKIP  ' + file + ' (unreadable, likely deleted)');
    continue;
  }
  const baseText = baseContent(normalized, base);
  const baseCount = baseText === null ? 0 : countUnguarded(baseText, normalized);
  const nowCount = countUnguarded(now, normalized);
  if (nowCount > baseCount) {
    console.log('FAIL  ' + file + ' — unguarded mutating routes ' + baseCount + ' -> ' + nowCount + ' (+' + (nowCount - baseCount) + ')');
    errors += 1;
  } else {
    console.log('OK    ' + file + ' — unguarded mutating routes ' + baseCount + ' -> ' + nowCount);
  }
}

console.log('\ncheck-rbac-delta: ' + errors + ' error(s) across ' + files.length + ' file(s) [base: ' + baseLabel + '].');
process.exit(errors > 0 ? 1 : 0);
