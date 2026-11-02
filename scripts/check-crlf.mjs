#!/usr/bin/env node
// scripts/check-crlf.mjs
// Ensures staged or specified files use strict LF line endings (\n), banning CRLF (\r\n).

import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2).filter((f) => !f.startsWith('-'));

if (files.length === 0) {
  process.exit(0);
}

let hasError = false;
let autoFixed = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const stat = fs.statSync(file);
  if (stat.isDirectory()) continue;

  const content = fs.readFileSync(file, 'utf8');
  // Check for \r\n (0x0D 0x0A)
  if (content.includes('\r\n')) {
    try {
      fs.writeFileSync(file, content.replace(/\r\n/g, '\n'), 'utf8');
      autoFixed++;
      console.log(`AUTO-FIXED ${file} — normalized CRLF (\\r\\n) to LF (\\n).`);
    } catch (err) {
      console.error(`FAIL  ${file} — contains CRLF (\\r\\n) and could not be auto-fixed: ${err}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\ncheck-crlf: files must use LF line endings. Run `npm run fix:crlf` to normalize.');
  process.exit(1);
} else {
  if (autoFixed > 0) {
    console.log(`check-crlf: auto-fixed ${autoFixed} file(s) to LF.`);
  } else {
    console.log(`check-crlf: all ${files.length} file(s) use LF.`);
  }
}
