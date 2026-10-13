// scripts/check-i18n.mjs — "no new hardcoded toast strings" gate (no deps, plain node).
// Usage:
//   node scripts/check-i18n.mjs [--base <ref>] <touched-files...>
// Fails when a touched file contains MORE hardcoded first-arg toast literals
// than its <base> version (default HEAD). New files compare against zero.
// Test files are excluded: assertions use literals by design.
// Scope is deliberately narrow — toast.loading/success/error/warning/info
// with a string/template first arg (the observed silent-English failure mode).
// Dynamic args (err.message, t('key')) never match.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const TOAST_LITERAL_PATTERN = /toast\.(?:loading|success|error|warning|info)\(\s*["`]/g;

function countSmells(text) {
  TOAST_LITERAL_PATTERN.lastIndex = 0;
  return (text.match(TOAST_LITERAL_PATTERN) || []).length;
}

function baseContent(path, base) {
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
    } else if (!args[i].startsWith('--')) {
      files.push(args[i]);
    }
  }
}
if (files.length === 0) {
  console.log('check-i18n: no files given. Usage: node scripts/check-i18n.mjs [--base <ref>] <files...>');
  process.exit(1);
}

let errors = 0;
for (const f of files) {
  if (/\.test\.|\.spec\.|src\/test\//.test(f.replace(/\\/g, '/'))) {
    console.log('SKIP  ' + f + ' (test file: literals are assertions by design)');
    continue;
  }
  let now;
  try {
    now = readFileSync(f, 'utf-8');
  } catch {
    console.log('SKIP  ' + f + ' (unreadable, likely deleted)');
    continue;
  }
  const baseText = baseContent(f, base);
  const baseCount = baseText === null ? 0 : countSmells(baseText);
  const nowCount = countSmells(now);
  if (nowCount > baseCount) {
    console.log('FAIL  ' + f + ' — hardcoded toast strings ' + baseCount + ' -> ' + nowCount + ' (+' + (nowCount - baseCount) + ')');
    errors += 1;
  } else {
    console.log('OK    ' + f + ' — hardcoded toast strings ' + baseCount + ' -> ' + nowCount);
  }
}

console.log('\ncheck-i18n: ' + errors + ' error(s) across ' + files.length + ' file(s).');
process.exit(errors > 0 ? 1 : 0);
