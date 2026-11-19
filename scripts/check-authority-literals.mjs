#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/**
 * Scan client code under src/ to ensure role comparisons do not use raw string literals.
 * Anti-drift rule (#107): All UI permissions MUST call can(role, capability) from shared/entity-authority.ts.
 */
const SRC_DIR = path.resolve('src');

const BANNED_ROLE_LITERAL_REGEX = /\b(?:userRole|currentRole|role|user\?\.role|currentUser\?\.role)\s*(?:===|!==|==|!=)\s*['"](Admin|Line 1|Line 2|Line 3|External Auditor|Commissioner|CFO|Director)['"]/g;
const BANNED_ROLE_REVERSE_REGEX = /['"](Admin|Line 1|Line 2|Line 3|External Auditor|Commissioner|CFO|Director)['"]\s*(?:===|!==|==|!=)\s*\b(?:userRole|currentRole|role|user\?\.role|currentUser\?\.role)/g;

let errors = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      if (entry.name.includes('.test.') || fullPath.includes('__tests__') || entry.name.includes('.spec.')) {
        continue;
      }
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }

    let match;
    BANNED_ROLE_LITERAL_REGEX.lastIndex = 0;
    while ((match = BANNED_ROLE_LITERAL_REGEX.exec(line)) !== null) {
      console.error(`ERROR: ${filePath}:${index + 1}`);
      console.error(`  Literal role check detected: "${match[0]}"`);
      console.error(`  Use can(role, capability) from shared/entity-authority.ts instead of raw role comparisons.\n`);
      errors++;
    }

    BANNED_ROLE_REVERSE_REGEX.lastIndex = 0;
    while ((match = BANNED_ROLE_REVERSE_REGEX.exec(line)) !== null) {
      console.error(`ERROR: ${filePath}:${index + 1}`);
      console.error(`  Literal role check detected: "${match[0]}"`);
      console.error(`  Use can(role, capability) from shared/entity-authority.ts instead of raw role comparisons.\n`);
      errors++;
    }
  });
}

scanDir(SRC_DIR);

if (errors > 0) {
  console.error(`check:authority-literals failed with ${errors} violation(s).`);
  process.exit(1);
} else {
  console.log('OK    check:authority-literals — zero raw role literal comparisons across src/');
}
