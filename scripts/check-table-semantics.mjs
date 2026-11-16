#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/**
 * check-table-semantics.mjs
 * Mechanical guardrail to prevent HTML/CSS table-layout spec mismatches:
 * 1. Prohibits `min-width` or `min-w-*` on <col> tags (W3C standard only allows width, visibility, background, border).
 * 2. Enforces <colgroup> for any <table> that utilizes multi-level grouping headers with colSpan.
 */

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

function getTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== '__tests__' && file !== 'node_modules') {
        results = results.concat(getTsxFiles(fullPath));
      }
    } else if (file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getTsxFiles(srcDir);
const errors = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');

  // Check 1: <col ... minWidth or min-w- ... />
  // Look for <col tags
  const colRegex = /<col\b([^>]*)\/?>/gi;
  let match;
  while ((match = colRegex.exec(content)) !== null) {
    const attrs = match[1];
    if (attrs.includes('minWidth') || /min-w-\[?[a-zA-Z0-9]+\]?/.test(attrs)) {
      errors.push(`${relPath}: <col> tag specifies 'minWidth' or 'min-w-*'. HTML/CSS spec ignores min-width on <col>. Use explicit 'width' on <col>, and place 'minWidth' on <th>/<td> instead.`);
    }
  }

  // Check 2: Multi-level table headers with colSpan should have <colgroup>
  // If a file has <th ... colSpan={...} and a raw <table ...> that has no <colgroup>
  if (content.includes('colSpan') && /<table\b[^>]*>/i.test(content)) {
    // Check if colSpan is used inside <thead> or <tr> within table
    const hasColSpanInHeader = /<th\b[^>]*colSpan/i.test(content);
    if (hasColSpanInHeader && !content.includes('<colgroup>')) {
      errors.push(`${relPath}: Table contains multi-level group header (th with colSpan) but does not define a <colgroup>. In table-layout: fixed, browser ignores row-2 <th> widths under colSpan unless <colgroup> is provided.`);
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ check-table-semantics failed:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log('✅ check-table-semantics passed: zero invalid <col> minWidth and multi-level tables define <colgroup>.');
}
