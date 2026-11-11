#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/**
 * check-contrast-slop.mjs
 * Mechanical check to prevent low-contrast text and dark-container anti-patterns on light surfaces.
 * 
 * Banned on light surfaces (unless preceded by `dark:`):
 * 1. `text-white/50`, `text-white/60`, `text-white/70`, `text-white/80` (invisible transparent white on light headers/cards)
 * 2. `bg-primary-container text-on-primary` when used as an overall card/banner surface
 */

const filesArg = process.argv.slice(2).filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx'));

function collectFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '__tests__' && entry.name !== 'dist') {
        results.push(...collectFiles(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      if (!entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const filesToCheck = filesArg.length > 0 ? filesArg : [
  ...collectFiles('src/components/layout'),
  ...collectFiles('src/components/dashboard'),
  ...collectFiles('src/components/rcm'),
  ...collectFiles('src/components/testing'),
  ...collectFiles('src/components/deficiencies'),
  ...collectFiles('src/pages/scoping'),
  ...collectFiles('src/pages/analytics')
];

let totalViolations = 0;

for (const file of filesToCheck) {
  if (!fs.existsSync(file)) continue;
  if (file.includes('test') || file.includes('spec')) continue;

  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // 1. Transparent white text without dark: prefix
    const transparentWhiteMatch = line.match(/(?<!dark:)\btext-white\/(?:50|60|70|80)\b/);
    if (transparentWhiteMatch) {
      console.error(`❌ [CONTRAST-SLOP] ${file}:${index + 1}: Found '${transparentWhiteMatch[0]}' without dark: prefix.`);
      console.error(`   -> Solution: Use semantic tokens like 'text-muted-foreground' or 'text-foreground' for light surfaces.`);
      totalViolations++;
    }

    // 2. Banner/Card container using dark container on light surface
    if (line.includes('bg-primary-container text-on-primary') && !line.includes('dark:')) {
      console.error(`❌ [CONTRAST-SLOP] ${file}:${index + 1}: Found dark card banner container 'bg-primary-container text-on-primary'.`);
      console.error(`   -> Solution: Compliance cards must use 'bg-white dark:bg-card' (SOVEREIGN_CARD_CONTAINER).`);
      totalViolations++;
    }
  });
}

if (totalViolations > 0) {
  console.error(`\n🚫 check-contrast-slop failed: ${totalViolations} low-contrast violation(s) found.`);
  process.exit(1);
} else {
  console.log('✅ check-contrast-slop passed: All inspected components comply with WCAG AA light contrast standards.');
  process.exit(0);
}
