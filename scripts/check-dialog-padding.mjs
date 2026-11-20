// scripts/check-dialog-padding.mjs
// Mechanical gate: enforces minimum p-4 content padding on Dialog and Sheet containers
// per AGENTS.md Mandat Mobile-Responsive: "Padding konten p-4 sm:p-6".
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
const DIALOG_COMPONENT_PATTERN = /<(DialogHeader|DialogFooter|SheetHeader|SheetFooter)\b([^>]*)/g;

function scanDir(dir, violations = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'test' || entry === 'ui') continue;
      scanDir(fullPath, violations);
    } else if (/\.(tsx|jsx)$/.test(entry) && !entry.includes('.test.') && !entry.includes('.spec.')) {
      const code = readFileSync(fullPath, 'utf-8');
      let m;
      while ((m = DIALOG_COMPONENT_PATTERN.exec(code)) !== null) {
        const comp = m[1];
        const attrs = m[2];
        const classMatch = attrs.match(/className=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/);
        if (classMatch) {
          const cls = classMatch[1] || classMatch[2] || classMatch[3] || '';
          const tokens = cls.split(/\s+/);
          for (const tok of tokens) {
            // Check base padding: p-0 up to p-3.5
            if (/^p-(?:0|0\.5|1|1\.5|2|2\.5|3|3\.5)$/.test(tok)) {
              violations.push({
                file: relative(process.cwd(), fullPath).replace(/\\/g, '/'),
                component: comp,
                padding: tok,
              });
            }
          }
        }
      }
    }
  }
  return violations;
}

const violations = scanDir(ROOT);

if (violations.length > 0) {
  console.error('\n❌ check:dialog-padding FAILED: Sub-p-4 base padding detected on dialog/sheet containers:');
  for (const v of violations) {
    console.error(`   - ${v.file} -> <${v.component}>: '${v.padding}' (Mandated minimum: p-4)`);
  }
  console.error('\nPer AGENTS.md Mandat 2 (Mobile-Responsive Checklist): Dialog/Sheet containers must use at least p-4 content padding.\n');
  process.exit(1);
}

console.log('OK    check:dialog-padding — zero sub-p-4 padding on dialog/sheet containers across src/');
process.exit(0);
