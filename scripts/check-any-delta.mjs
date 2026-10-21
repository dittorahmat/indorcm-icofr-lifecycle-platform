// scripts/check-any-delta.mjs — "no new `any` / escape-cast / non-null" gate
// (no deps, runs on plain node).
// Usage:
//   node scripts/check-any-delta.mjs [--base <ref>] <touched-files...>
// Fails when a touched file contains MORE smell occurrences (`any`, `as any`,
// `as never`, `as unknown as`, non-null assertions) than its <base> version.
// <base> defaults to the branch point (merge-base with origin/main) so the
// verdict does not change when you commit — see scripts/lib/delta-base.mjs.
// New files are compared against a zero baseline. Deleted/unreadable files are
// skipped. Patterns live in scripts/lib/any-smell-patterns.mjs (unit-tested).
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolveBase } from './lib/delta-base.mjs';
import { countSmells } from './lib/any-smell-patterns.mjs';

function headContent(path, base) {
  try {
    return execSync('git show ' + base + ':' + JSON.stringify(path), { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

let explicitBase = null;
const files = [];
{
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
      explicitBase = args[++i];
    } else if (args[i] !== '--all' && !args[i].startsWith('--')) {
      files.push(args[i]);
    }
  }
}
if (files.length === 0) {
  console.log('check-any-delta: no files given. Usage: node scripts/check-any-delta.mjs [--base <ref>] <files...>');
  process.exit(1);
}
const { ref: base, label: baseLabel } = resolveBase(explicitBase);

let errors = 0;
for (const f of files) {
  // Code gate: prose files may name this command, and that mention alone
  // would count as a smell — hence the extension skip below.
  if (!/\.(tsx|ts|jsx|js|mjs|cjs|mts|cts)$/.test(f.replace(/\\/g, '/'))) {
    console.log('SKIP  ' + f + ' (not a code file)');
    continue;
  }
  // The pattern definition site spells every pattern by construction; it is
  // covered by scripts/__tests__/any-smell-patterns.test.mjs instead.
  if (/(^|\/)scripts\/lib\/any-smell-patterns\.mjs$/.test(f.replace(/\\/g, '/'))) {
    console.log('SKIP  ' + f + ' (pattern definition site)');
    continue;
  }
  let now;
  try {
    now = readFileSync(f, 'utf-8');
  } catch {
    console.log('SKIP  ' + f + ' (unreadable, likely deleted)');
    continue;
  }
  const baseText = headContent(f, base);
  // Test files may spell banned syntax as fixture data; production files may not.
  const includeNonNull = !/(\.(test|spec)\.|(^|\/)__tests__\/)/.test(f.replace(/\\/g, '/'));
  const baseCount = baseText === null ? 0 : countSmells(baseText, { includeNonNull });
  const nowCount = countSmells(now, { includeNonNull });
  if (nowCount > baseCount) {
    console.log('FAIL  ' + f + ' — any/escape-cast/non-null ' + baseCount + ' -> ' + nowCount + ' (+' + (nowCount - baseCount) + ')');
    errors += 1;
  } else {
    console.log('OK    ' + f + ' — any/escape-cast/non-null ' + baseCount + ' -> ' + nowCount);
  }
}

console.log('\ncheck-any-delta: ' + errors + ' error(s) across ' + files.length + ' file(s) [base: ' + baseLabel + '].');
process.exit(errors > 0 ? 1 : 0);
