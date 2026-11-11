// scripts/check-font-slop.mjs
// Mechanical gate: bans arbitrary font-size utility classes below 12px (text-[...px] with size < 12)
// Enforces minimum text-xs (12px) per AGENTS.md Mandat 1 Anti-AI Slop Checklist.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
// Match text-[0px] through text-[11px] or text-[0.0px] up to text-[11.9px]
const SUB_12PX_PATTERN = /\btext-\[(?:[0-9]|1[01])(?:\.[0-9]+)?px\]/g;

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
      const matches = content.match(SUB_12PX_PATTERN);
      if (matches) {
        violations.push({
          file: relative(process.cwd(), fullPath).replace(/\\/g, '/'),
          matches,
        });
      }
    }
  }
  return violations;
}

const violations = scanDir(ROOT);

if (violations.length > 0) {
  console.error('\n❌ check:font-slop FAILED: Sub-12px font utility classes detected:');
  for (const v of violations) {
    console.error(`   - ${v.file}: ${v.matches.join(', ')}`);
  }
  console.error('All typography, badges, chips, and table cells must be at least text-xs (12px) per AGENTS.md.\n');
  process.exit(1);
}

console.log('OK    check:font-slop — zero sub-12px font utility classes across src/');
process.exit(0);
