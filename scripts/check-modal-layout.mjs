// scripts/check-modal-layout.mjs
// Mechanical gate enforcing modal layout invariants & tabs visibility:
// 1. src/components/ui/tabs.tsx must include `data-[state=inactive]:hidden` in TabsContent
// 2. Embedded RCM and matrix pages (RCMTLCPage, RCMELCPage, RCMITGCPage) must have `min-w-0 max-w-full w-full overflow-hidden` on content root
// 3. CSA sample creation must reference createDefaultSampleControlResults rather than ad-hoc inline loops
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const violations = [];

// 1. Verify TabsContent definition in src/components/ui/tabs.tsx
const tabsPath = resolve(process.cwd(), 'src/components/ui/tabs.tsx');
if (existsSync(tabsPath)) {
  const tabsCode = readFileSync(tabsPath, 'utf-8');
  if (!tabsCode.includes('data-[state=inactive]:hidden')) {
    violations.push({
      file: 'src/components/ui/tabs.tsx',
      rule: 'TabsContent must enforce data-[state=inactive]:hidden to prevent inactive tab panels from displacing active panel coordinates.',
    });
  }
}

// 2. Verify embedded page content containers
const embeddedPages = [
  'src/pages/rcm/RCMTLCPage.tsx',
  'src/pages/rcm/RCMELCPage.tsx',
  'src/pages/rcm/RCMITGCPage.tsx',
];

for (const relPath of embeddedPages) {
  const fullPath = resolve(process.cwd(), relPath);
  if (!existsSync(fullPath)) continue;
  const code = readFileSync(fullPath, 'utf-8');
  // Check for content definition
  const contentMatch = code.match(/const\s+content\s*=\s*\(\s*<div\b([^>]*)/);
  if (contentMatch) {
    const attrs = contentMatch[1];
    const hasMinW0 = attrs.includes('min-w-0');
    const hasMaxWFull = attrs.includes('max-w-full');
    const hasWFull = attrs.includes('w-full');
    const hasOverflowHidden = attrs.includes('overflow-hidden');
    if (!hasMinW0 || !hasMaxWFull || !hasWFull || !hasOverflowHidden) {
      violations.push({
        file: relPath,
        rule: `Embedded matrix container must carry "min-w-0 max-w-full w-full overflow-hidden". Missing: ${[
          !hasMinW0 && 'min-w-0',
          !hasMaxWFull && 'max-w-full',
          !hasWFull && 'w-full',
          !hasOverflowHidden && 'overflow-hidden',
        ].filter(Boolean).join(', ')}`,
      });
    }
  }
}

// 3. Verify single source of truth for sample initialization
const csaFormPath = resolve(process.cwd(), 'src/components/bpm/CSAForm.tsx');
if (existsSync(csaFormPath)) {
  const csaCode = readFileSync(csaFormPath, 'utf-8');
  if (!csaCode.includes('createDefaultSampleControlResults')) {
    violations.push({
      file: 'src/components/bpm/CSAForm.tsx',
      rule: 'handleAddSample must use createDefaultSampleControlResults from src/hooks/csa/csa-sample-init.ts to prevent sample initialization drift.',
    });
  }
}

const useCsaPath = resolve(process.cwd(), 'src/hooks/use-csa.ts');
if (existsSync(useCsaPath)) {
  const useCsaCode = readFileSync(useCsaPath, 'utf-8');
  if (!useCsaCode.includes('createDefaultSampleControlResults')) {
    violations.push({
      file: 'src/hooks/use-csa.ts',
      rule: 'initializeFromSamples must use createDefaultSampleControlResults from src/hooks/csa/csa-sample-init.ts to ensure uniform default control states.',
    });
  }
}

if (violations.length > 0) {
  console.error('\n❌ check:modal-layout FAILED: Layout or sample initialization invariant violation:');
  for (const v of violations) {
    console.error(`   - ${v.file}: ${v.rule}`);
  }
  console.error('\nPer AGENTS.md Invarian Isolasi Layout Tab Modal Dialog & Inisialisasi Sampel CSA.\n');
  process.exit(1);
}

console.log('OK    check:modal-layout — all modal tabs, embedded matrix bounds, and sample initializers conform to invariants.');
process.exit(0);
