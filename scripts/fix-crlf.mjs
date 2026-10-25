#!/usr/bin/env node
// scripts/fix-crlf.mjs
// Normalizes files to LF line endings.

import fs from 'node:fs';

const files = process.argv.slice(2).filter((f) => !f.startsWith('-'));

if (files.length === 0) {
  console.log('fix-crlf: no files specified.');
  process.exit(0);
}

let fixed = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const stat = fs.statSync(file);
  if (stat.isDirectory()) continue;

  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('\r\n')) {
    fs.writeFileSync(file, content.replace(/\r\n/g, '\n'), 'utf8');
    fixed++;
    console.log(`FIXED ${file}`);
  }
}

console.log(`fix-crlf: normalized ${fixed} file(s) to LF.`);
