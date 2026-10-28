import fs from 'node:fs';
import path from 'node:path';

/**
 * Gate to enforce indexed period/year query standards and prevent slow regex/EXISTS patterns.
 * Mandated by AGENTS.md §"Standar Predikat Periode/Tahun Terindeks".
 */
const ROUTES_DIR = path.resolve(process.cwd(), 'worker/routes');
const BANNED_PATTERNS = [
  {
    regex: /~ *'[0-9]\{4\}'/,
    description: "Banned regex pattern ~ '[0-9]{4}' on period filtering. Use matchesPeriodYear() instead.",
  },
];

let hasErrors = false;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.regex.test(content)) {
          console.error(`[check-period-queries] ERROR in ${path.relative(process.cwd(), fullPath)}: ${pattern.description}`);
          hasErrors = true;
        }
      }
    }
  }
}

scanDir(ROUTES_DIR);

if (hasErrors) {
  process.exit(1);
} else {
  console.log('check-period-queries: 0 error(s) in worker routes.');
}
