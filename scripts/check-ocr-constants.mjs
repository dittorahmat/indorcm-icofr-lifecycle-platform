// scripts/check-ocr-constants.mjs - lane geometry has exactly one definition site.
// Usage: node scripts/check-ocr-constants.mjs [--root <dir>]   (whole tree, takes no file list)
//
// Why: the OCR layout shipped with `LANE_FOOTER = 80` re-declared in the rank
// engine and the audit re-deriving the lane height formula by hand. The three
// copies agreed on the day they were written, which is exactly why nobody
// noticed; the next tweak to one of them would have made the audit bless a
// layout the engine no longer produces. AGENTS.md says the constants live in
// `ocr-layout-rows.ts` / `ocr-layout-deoverlap.ts`; this gate is what makes that
// sentence true instead of aspirational.
//
// A consumer imports the symbol. Only the owner file may declare it.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const rootIndex = process.argv.indexOf('--root');
const ROOT = resolve(rootIndex === -1 ? '.' : process.argv[rootIndex + 1]);

/** Owner file -> symbols it is allowed to declare. */
const OWNERS = new Map([
  [
    'src/utils/ocr-layout-rows.ts',
    ['LANE_MIN_W', 'LANE_MIN_H', 'LANE_FOOTER', 'LANE_PADDING_X', 'ROW_GAP', 'ROW_MERGE_TOLERANCE', 'CONTENT_TOP', 'contentLaneHeight'],
  ],
  ['src/utils/ocr-layout-deoverlap.ts', ['MIN_NODE_CLEARANCE', 'boxesOverlap']],
  ['src/utils/bpm-constants.ts', ['DOWNWARD_PLUNGE_THRESHOLD_DY', 'SAME_LANE_SEQUENTIAL_FLOW_THRESHOLD_DY', 'SAFE_HEADER_CEILING']],
]);

const DECLARATION = /(?:^|\s)(?:export\s+)?(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/;

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(entry)) out.push(path);
  }
}

const symbolOwner = new Map();
for (const [file, symbols] of OWNERS) for (const symbol of symbols) symbolOwner.set(symbol, file);

const files = [];
const sourceRoot = join(ROOT, 'src');
if (existsSync(sourceRoot)) walk(sourceRoot, files);
files.sort();

const failures = [];
for (const file of files) {
  const key = relative(ROOT, file).replace(/\\/g, '/');
  const owner = OWNERS.get(key);
  const lines = readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const match = DECLARATION.exec(lines[i]);
    if (!match) continue;
    const symbol = match[1];
    const expected = symbolOwner.get(symbol);
    if (!expected) continue;
    if (owner?.includes(symbol)) continue;
    failures.push(`${key}:${i + 1}  re-declares ${symbol} (owner: ${expected})`);
  }
}

for (const failure of failures) console.log(`FAIL  ${failure}`);
console.log(`\ncheck-ocr-constants: ${failures.length} duplicate declaration(s) (${files.length} source files scanned).`);
process.exit(failures.length > 0 ? 1 : 0);
