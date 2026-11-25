import fs from 'node:fs';
import path from 'node:path';

/**
 * Gate to enforce Drizzle ORM standards and ban hardcoded raw SQL table names
 * (such as icofr.controls, icofr.rcms, etc.).
 * Mandated by AGENTS.md §"Standar Drizzle ORM & Larangan Raw SQL Table Identifier".
 */
const SCAN_DIRS = [
  path.resolve(process.cwd(), 'worker'),
  path.resolve(process.cwd(), 'src'),
];

// Matches raw schema-qualified tables like `icofr.controls`, `icofr.rcms`, etc. inside code
const BANNED_PATTERNS = [
  {
    regex: /\bFROM\s+icofr\.[a-z_]+/i,
    description: "Banned raw SQL table identifier 'icofr.<table_name>'. Use Drizzle schema objects (e.g. \`FROM \${schema.tableName}\`) instead.",
  },
  {
    regex: /\bJOIN\s+icofr\.[a-z_]+/i,
    description: "Banned raw SQL table identifier 'JOIN icofr.<table_name>'. Use Drizzle schema objects (e.g. \`JOIN \${schema.tableName}\`) instead.",
  },
  {
    regex: /\bUPDATE\s+icofr\.[a-z_]+/i,
    description: "Banned raw SQL table identifier 'UPDATE icofr.<table_name>'. Use Drizzle schema objects instead.",
  },
  {
    regex: /\bINSERT\s+INTO\s+icofr\.[a-z_]+/i,
    description: "Banned raw SQL table identifier 'INSERT INTO icofr.<table_name>'. Use Drizzle schema objects instead.",
  },
];

let hasErrors = false;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        scanDir(fullPath);
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))
    ) {
      // Exclude tests and migrations
      if (fullPath.includes('__tests__') || fullPath.includes('drizzle')) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of BANNED_PATTERNS) {
          if (pattern.regex.test(line)) {
            console.error(
              `[check-drizzle-sql] ERROR in ${path.relative(process.cwd(), fullPath)}:${i + 1}: ${pattern.description}\n  > ${line.trim()}`
            );
            hasErrors = true;
          }
        }
      }
    }
  }
}

for (const dir of SCAN_DIRS) {
  scanDir(dir);
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('check-drizzle-sql: 0 error(s) in worker and src code.');
}
