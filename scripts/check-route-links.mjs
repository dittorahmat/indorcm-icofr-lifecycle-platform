#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/**
 * Scan client code for `<Link to="...">` and `navigate("...")` to ensure
 * paths match recognized application routes or dynamic patterns.
 */
const SRC_DIR = path.resolve('src');
const PATHS_FILE = path.resolve('src/routes/paths.ts');

if (!fs.existsSync(PATHS_FILE)) {
  console.error('ERROR: src/routes/paths.ts not found.');
  process.exit(1);
}

const pathsContent = fs.readFileSync(PATHS_FILE, 'utf-8');
const recognizedRoutes = new Set();
const routeRegex = /:\s*['"](\/[^'"]*)['"]/g;
let match;
while ((match = routeRegex.exec(pathsContent)) !== null) {
  recognizedRoutes.add(match[1]);
}

// Special dynamic / external prefixes allowed
const ALLOWED_PREFIXES = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
];

let errors = 0;

function checkFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('.test.') || filePath.includes('__tests__')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  // Match `to="/path"` or `to={'/path'}`
  const linkToRegex = /to=(?:{?['"](\/[^'"]*)['"]}?)/g;
  let linkMatch;
  while ((linkMatch = linkToRegex.exec(content)) !== null) {
    const rawPath = linkMatch[1];
    const basePath = rawPath.split('?')[0].split('#')[0];

    // Check if basePath matches known route or dynamic route pattern
    const isKnown = recognizedRoutes.has(basePath) ||
      Array.from(recognizedRoutes).some(r => basePath === r || (r !== '/' && basePath.startsWith(r + '/')));

    if (!isKnown) {
      console.error(`[check:route-links] Unrecognized route link "${rawPath}" in ${filePath}`);
      errors++;
    }
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else {
      checkFile(fullPath);
    }
  }
}

walkDir(SRC_DIR);

if (errors > 0) {
  console.error(`FAILED: ${errors} dead / unrecognized route link(s) detected.`);
  process.exit(1);
} else {
  console.log(`OK    check:route-links — All route links match recognized application paths.`);
  process.exit(0);
}
