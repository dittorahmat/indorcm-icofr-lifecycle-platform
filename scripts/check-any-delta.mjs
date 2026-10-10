// scripts/check-any-delta.mjs — "no new `any`" gate (no deps, runs on plain node).
// Usage:
//   node scripts/check-any-delta.mjs <touched-files...>
// Fails when a touched file contains MORE `any`/escape-cast occurrences than
// its HEAD version. New files are compared against a zero baseline.
// Deleted/unreadable files are skipped.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const ANY_PATTERN = /:\s*any\b/g;
const AS_ANY_PATTERN = /\bas any\b/g;
const AS_NEVER_PATTERN = /\bas never\b/g;
const AS_UNKNOWN_AS_PATTERN = /\bas unknown as\b/g;

function countSmells(text) {
  let n = 0;
  for (const re of [ANY_PATTERN, AS_ANY_PATTERN, AS_NEVER_PATTERN, AS_UNKNOWN_AS_PATTERN]) {
    re.lastIndex = 0;
    n += (text.match(re) || []).length;
  }
  return n;
}

function headContent(path) {
  try {
    return execSync('git show HEAD:' + JSON.stringify(path), { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

const files = process.argv.slice(2).filter((a) => a !== '--all');
if (files.length === 0) {
  console.log('check-any-delta: no files given. Usage: node scripts/check-any-delta.mjs <files...>');
  process.exit(1);
}

let errors = 0;
for (const f of files) {
  let now;
  try {
    now = readFileSync(f, 'utf-8');
  } catch {
    console.log('SKIP  ' + f + ' (unreadable, likely deleted)');
    continue;
  }
  const base = headContent(f);
  const baseCount = base === null ? 0 : countSmells(base);
  const nowCount = countSmells(now);
  if (nowCount > baseCount) {
    console.log('FAIL  ' + f + ' — any/escape-cast ' + baseCount + ' -> ' + nowCount + ' (+' + (nowCount - baseCount) + ')');
    errors += 1;
  } else {
    console.log('OK    ' + f + ' — any/escape-cast ' + baseCount + ' -> ' + nowCount);
  }
}

console.log('\ncheck-any-delta: ' + errors + ' error(s) across ' + files.length + ' file(s).');
process.exit(errors > 0 ? 1 : 0);
