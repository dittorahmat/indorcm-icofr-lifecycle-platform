// scripts/check-number-inputs.mjs
// Mechanical gate: bans raw lowercase `<input ... type="number"` HTML tag usage.
// Enforces using the canonical capitalized `<Input />` component from `@/components/ui/input`
// so all numeric inputs have defense-in-depth anti-stepper/spin-button styles and auto-select.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
// Match `<input ... type="number"` with lowercase tag (not `<Input`)
const RAW_LOWERCASE_INPUT_PATTERN = /<input\b[^>]*\btype=['"]number['"]/g;

function scanDir(dir, violations = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'test') continue;
      scanDir(fullPath, violations);
    } else if (/\.(tsx|jsx)$/.test(entry) && !entry.includes('.test.') && !entry.includes('.spec.')) {
      const content = readFileSync(fullPath, 'utf-8');
      const matches = content.match(RAW_LOWERCASE_INPUT_PATTERN);
      if (matches) {
        violations.push({
          file: relative(process.cwd(), fullPath).replace(/\\/g, '/'),
          count: matches.length,
        });
      }
    }
  }
  return violations;
}

const violations = scanDir(ROOT);

if (violations.length > 0) {
  console.error('\n❌ check:number-inputs FAILED: raw HTML <input type="number"> detected:');
  for (const v of violations) {
    console.error(`   - ${v.file}: ${v.count} occurrence(s)`);
  }
  console.error('Use the canonical `<Input />` component from `@/components/ui/input` instead.\n');
  process.exit(1);
}

console.log('OK    check:number-inputs — zero raw HTML <input type="number"> calls across src/');
process.exit(0);
