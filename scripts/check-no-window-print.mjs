// scripts/check-no-window-print.mjs
// Mechanical gate: bans window.print() calls across production frontend code.
// Regulatory compliance requires vector PDF downloads via regulatory-pdf-builder,
// never browser print-screens.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
const BANNED_PATTERN = /\bwindow\.print\s*\(/g;

function scanDir(dir, violations = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'test') continue;
      scanDir(fullPath, violations);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry) && !entry.includes('.test.') && !entry.includes('.spec.')) {
      const content = readFileSync(fullPath, 'utf-8');
      const matches = content.match(BANNED_PATTERN);
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
  console.error('\n❌ check:no-window-print FAILED: window.print() detected in production code:');
  for (const v of violations) {
    console.error(`   - ${v.file}: ${v.count} occurrence(s)`);
  }
  console.error('Use formal PDF document generators from src/lib/pdf/ instead.\n');
  process.exit(1);
}

console.log('OK    check:no-window-print — zero window.print() calls across src/');
process.exit(0);
