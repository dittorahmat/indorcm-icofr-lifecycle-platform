// scripts/check-any-delta.mjs — "no new `any`" gate (no deps, runs on plain node).
// Usage:
//   node scripts/check-any-delta.mjs [--base <ref>] <touched-files...>
// Fails when a touched file contains MORE `any`/escape-cast occurrences than
// its <base> version (default HEAD). New files are compared against a zero baseline.
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

function headContent(path, base) {
  try {
    return execSync('git show ' + base + ':' + JSON.stringify(path), { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

let base = 'HEAD';
const files = [];
{
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
      base = args[++i];
    } else if (args[i] !== '--all' && !args[i].startsWith('--')) {
      files.push(args[i]);
    }
  }
}
if (files.length === 0) {
  console.log('check-any-delta: no files given. Usage: node scripts/check-any-delta.mjs [--base <ref>] <files...>');
  process.exit(1);
}

let errors = 0;
for (const f of files) {
  // Code gate: prose files may name this command, and that mention alone
  // would count as a smell — hence the extension skip below.
  if (!/\.(tsx|ts|jsx|js|mjs|cjs|mts|cts)$/.test(f.replace(/\\/g, '/'))) {
    console.log('SKIP  ' + f + ' (not a code file)');
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
  const baseCount = baseText === null ? 0 : countSmells(baseText);
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
