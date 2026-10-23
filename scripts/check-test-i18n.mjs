// scripts/check-test-i18n.mjs - tests must not mock i18n with their own table.
// Usage: node scripts/check-test-i18n.mjs [--root <dir>]   (whole tree, takes no file list)
//
// Why: docs/agents/guardrails.md tells test authors to use
// `src/test/mock-i18n.ts` (`strictT` / `validateI18nKey`), which throws when a
// key is missing from the `en` bundle. A hand-rolled mock cannot fail: it either
// returns the key (hiding a renamed key) or returns a hardcoded string that the
// product never renders (the CSA worklist incident). Two such mocks shipped in
// `fix-bpm-ocr-coordinate-faithful-layout` and only a human review caught them,
// so the rule is checked here instead of trusted to discipline.
//
// Flagged shapes (only inside a `vi.mock('react-i18next', ...)` file that does
// not import the helper):
//   1. identity mock:  t: (key) => key
//   2. hardcoded map:  if (key === 'a.b') return 'Some English text'
// A mock that reads the real locale objects (e.g. DoDWorksheetDialog) is not an
// identity mock and stays allowed.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// `--root <dir>` points the scan at a fixture tree (used by the gate's own
// test); the default is the repo this script lives in.
const rootIndex = process.argv.indexOf('--root');
const ROOT = resolve(rootIndex === -1 ? '.' : process.argv[rootIndex + 1]);

const ROOTS = ['src', 'worker'];
const MOCK = /vi\.mock\(\s*['"]react-i18next['"]/;
const HELPER = /from\s+['"][^'"]*mock-i18n['"]/;
const IDENTITY = /\bt\s*:\s*\(\s*(\w+)(?:\s*:\s*string)?\s*\)\s*=>\s*\1\s*[,}]/;
const DEFAULT_VALUE_FALLBACK = /=>\s*opts\?\.defaultValue\s*(?:\|\||\?\?)\s*key\s*[,}]/;
const HARDCODED = /if\s*\(\s*key\s*===\s*['"][^'"]+['"]\s*\)\s*return\s*['"]/;

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.test\.tsx?$/.test(entry)) out.push(path);
  }
}

const files = [];
for (const root of ROOTS) {
  const dir = join(ROOT, root);
  if (existsSync(dir)) walk(dir, files);
}
files.sort();

let errors = 0;
let checked = 0;
for (const file of files) {
  const label = relative(ROOT, file);
  const text = readFileSync(file, 'utf-8');
  if (!MOCK.test(text)) continue;
  checked += 1;
  if (HELPER.test(text)) continue;

  const identity = IDENTITY.exec(text);
  if (identity) {
    console.log(`FAIL  ${label} - identity i18n mock (t: (${identity[1]}) => ${identity[1]}) hides missing keys; use strictT from src/test/mock-i18n.ts`);
    errors += 1;
    continue;
  }
  if (DEFAULT_VALUE_FALLBACK.test(text)) {
    console.log(`FAIL  ${label} - i18n mock falls back to its own key/defaultValue without checking the en bundle; use strictT from src/test/mock-i18n.ts`);
    errors += 1;
    continue;
  }
  if (HARDCODED.test(text)) {
    console.log(`FAIL  ${label} - hardcoded i18n table; use strictT from src/test/mock-i18n.ts so the en bundle is the source of truth`);
    errors += 1;
  }
}

console.log(`\ncheck-test-i18n: ${errors} error(s) across ${checked} mocked file(s) (${files.length} test files scanned).`);
process.exit(errors > 0 ? 1 : 0);
