// scripts/check-theme-tokens.mjs
// Mechanical gate:
// 1. Bans raw/hardcoded hex colors (#xxx, #xxxxxx) in src/index.css outside comments.
//    Requires CSS variables hsl(var(--...)) or semantic tokens.
// 2. Bans ambiguous arbitrary duration and ease classes in src/ (duration-[...ms], ease-[cubic-bezier...])
//    to avoid Vite/Tailwind compiler ambiguity warnings.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';

let violations = 0;

// 1. Check src/index.css for raw hex values outside comments
const rootArgIndex = process.argv.indexOf('--root');
const ROOT_DIR = rootArgIndex !== -1 && process.argv[rootArgIndex + 1] ? resolve(process.argv[rootArgIndex + 1]) : process.cwd();

const INDEX_CSS = resolve(ROOT_DIR, 'src/index.css');
if (existsSync(INDEX_CSS)) {
  const cssContent = readFileSync(INDEX_CSS, 'utf-8');
  const lines = cssContent.split('\n');

  lines.forEach((line, idx) => {
    // Strip comments
    const stripped = line.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');
    // Match hex color like #6CABDD, #fff, #123456
    const hexMatch = stripped.match(/#[0-9a-fA-F]{3,8}\b/);
    if (hexMatch) {
      console.error(`❌ [THEME-TOKEN-SLOP] src/index.css:${idx + 1}: Found hardcoded hex color '${hexMatch[0]}'.`);
      console.error(`   -> Solution: Colors in index.css must use semantic variables like 'hsl(var(--header-mancity))'.`);
      violations++;
    }
  });
}

// 2. Scan src/**/*.{tsx,jsx} for ambiguous arbitrary duration / easing utility classes
const ROOT_SRC = resolve(ROOT_DIR, 'src');
const AMBIGUOUS_DURATION_EASE = /(?:^|[\s"'`])(duration-\[[0-9]+ms\]|ease-\[cubic-bezier[^\]]+\]|group-\[\.toaster\]:duration-\[[0-9]+ms\]|group-\[\.toaster\]:ease-\[cubic-bezier[^\]]+\])(?:$|[\s"'`])/g;

function scanDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'test' || entry === 'node_modules' || entry === 'dist') continue;
      scanDir(fullPath);
    } else if (/\.(tsx|jsx)$/.test(entry)) {
      const content = readFileSync(fullPath, 'utf-8');
      const matches = content.match(AMBIGUOUS_DURATION_EASE);
      if (matches) {
        const rel = relative(process.cwd(), fullPath).replace(/\\/g, '/');
        console.error(`❌ [AMBIGUOUS-TRANSITION] ${rel}: Found ambiguous arbitrary transition classes: ${matches.join(', ')}`);
        console.error(`   -> Solution: Use tailwind tokens defined in tailwind.config.js (e.g. 'duration-150', 'duration-250', 'ease-spring-standard').`);
        violations += matches.length;
      }
    }
  }
}

if (existsSync(ROOT_SRC)) {
  scanDir(ROOT_SRC);
}

if (violations > 0) {
  console.error(`\n🚫 check:theme-tokens failed with ${violations} violation(s).\n`);
  process.exit(1);
}

console.log('OK    check:theme-tokens — zero hardcoded hex in index.css and zero ambiguous duration/ease classes across src/');
process.exit(0);
