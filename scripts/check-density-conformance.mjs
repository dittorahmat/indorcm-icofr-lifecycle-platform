#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * check-density-conformance.mjs
 * 
 * Verifies that compliance tables and workbench views do not use legacy
 * loose padding tokens (e.g. py-4 or loose cell padding) without justification.
 */

const TARGET_DIRS = [
  'src/pages/testing',
  'src/pages/deficiencies',
  'src/pages/reports',
  'src/components/testing',
  'src/components/deficiencies',
  'src/components/reports',
];

const BANNED_PATTERNS = [
  { regex: /<TableCell[^>]*\bpy-4\b/g, label: 'Loose TableCell padding (py-4 found, use py-2 px-3)' },
  { regex: /<TableHead[^>]*\bpy-4\b/g, label: 'Loose TableHead padding (py-4 found, use py-2 px-3)' },
];

function scanDir(dir, fileList = []) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry !== '__tests__' && entry !== 'node_modules') {
          scanDir(fullPath, fileList);
        }
      } else if (stat.isFile() && (entry.endsWith('.tsx') || entry.endsWith('.ts'))) {
        fileList.push(fullPath);
      }
    }
  } catch (err) {
    // skip non-existent
  }
  return fileList;
}

let violations = 0;

for (const dir of TARGET_DIRS) {
  const files = scanDir(dir);
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const { regex, label } of BANNED_PATTERNS) {
      const matches = content.match(regex);
      if (matches) {
        console.error(`FAIL  ${file}: ${label} (${matches.length} occurrences)`);
        violations += matches.length;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\nTotal violations: ${violations}. Please standardize table density to py-2 px-3.`);
  process.exit(1);
} else {
  console.log('OK    check:density — all targeted compliance tables conform to compact density standards.');
  process.exit(0);
}
