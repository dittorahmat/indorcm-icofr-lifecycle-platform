// scripts/check-loc.mjs — LOC + escape-hatch gate (no deps, runs on plain node).
// Usage:
//   node scripts/check-loc.mjs --all                 full scan, fails on hard-limit (>600)
//   node scripts/check-loc.mjs [--base <ref>] <files...>  touched-file gate, fails on soft-limit (>400)
//   node scripts/check-loc.mjs --strict <files...>   additionally fails on any soft-limit hit
// Grandfather rule (mirrors AGENTS.md): a touched file already over the soft
// limit passes when it strictly shrinks vs <base> (bug-fix paydown). <base>
// defaults to the branch point (merge-base with origin/main) so the verdict does
// not change when you commit — see scripts/lib/delta-base.mjs. Note that a
// HEAD default was actively wrong here: committing a paydown made the file its
// own baseline, so the same tree failed after `git commit` that passed before.
// Growing, flat, crossing, or new-file breaches still fail.
// Exemptions mirror AGENTS.md: data-blobs, shadcn vendor, tests, drizzle SQL, generated.
// Touched-file mode applies the same scope as the full scan (`src`/`worker`/
// `shared` `.ts`/`.tsx`): a locale bundle or any other non-source path passed
// by a caller is outside the LOC contract and must not fail it.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolveBase } from './lib/delta-base.mjs';

const SOFT = 400;
const HARD = 600;

const IN_SCOPE = /^(src|worker|shared)\/.*\.tsx?$/;

const EXEMPT = [
  /mock-data\.ts$/,
  /shared\/constants\//,
  /src\/components\/ui\//,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /(^|\/)drizzle\//,
  /\.generated\.[jt]sx?$/,
  /\.d\.ts$/,
];

const args = process.argv.slice(2);
const strict = args.includes('--strict');
let explicitBase = null;
{
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) explicitBase = args[++i];
  }
}
const filtered = args.filter((a) => a !== '--strict' && a !== '--all' && a !== '--base' && a !== explicitBase);
const { ref: base, label: baseLabel } = resolveBase(explicitBase);

function listAll() {
  const out = execSync('git ls-files "src/**/*.ts" "src/**/*.tsx" "shared/**/*.ts" "worker/**/*.ts"', {
    encoding: 'utf-8',
  });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

function isExempt(path) {
  return EXEMPT.some((re) => re.test(path.replace(/\\/g, '/')));
}

function headCount(path) {
  try {
    const out = execSync('git show ' + JSON.stringify(base) + ':' + JSON.stringify(path), { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (!out) return 0;
    return out.split('\n').filter((line) => line.trim() !== '').length;
  } catch {
    return null; // New file (or renamed): no baseline, strict.
  }
}
function countLines(path) {
  try {
    const text = readFileSync(path, 'utf-8');
    if (!text) return 0;
    // Canonical: non-blank lines only. (Raw `(Get-Content <file> | Measure-Object -Line).Lines`
    // counts blank lines too, so it always reads slightly higher.)
    return text.split('\n').filter((line) => line.trim() !== '').length;
  } catch {
    return -1;
  }
}

function smellCounts(path) {
  try {
    const text = readFileSync(path, 'utf-8');
    return {
      any: (text.match(/:\s*any\b|as any\b/g) || []).length,
      bang: (text.match(/[A-Za-z0-9_)\]]!/g) || []).length,
    };
  } catch {
    return { any: 0, bang: 0 };
  }
}

const touchedMode = filtered.length > 0;
const inScope = (f) => IN_SCOPE.test(f.replace(/\\/g, '/'));
const files = touchedMode ? filtered.filter(inScope) : listAll();
const outOfScope = touchedMode ? filtered.filter((f) => !inScope(f)) : [];

let errors = 0;
let warnings = 0;

for (const f of outOfScope) {
  console.log(`SKIP  ${f} (out of LOC scope: src/worker/shared .ts/.tsx only)`);
}

for (const f of files) {
  if (isExempt(f)) continue;
  const lines = countLines(f);
  if (lines < 0) {
    console.log(`SKIP  ${f} (unreadable)`);
    continue;
  }
  const { any, bang } = smellCounts(f);
  const extra = any + bang > 0 ? `  [any:${any} !:${bang}]` : '';
  if (lines > HARD) {
    console.log(`FAIL  ${f} — ${lines} LOC exceeds hard limit ${HARD}${extra}`);
    errors += 1;
  } else if (lines > SOFT && (touchedMode || strict)) {
    const baseline = headCount(f);
    if (baseline !== null && lines < baseline) {
      console.log(`OK    ${f} — ${lines} LOC over soft limit ${SOFT} but shrunk vs baseline ${baseline} (grandfather paydown)${extra}`);
    } else {
      console.log(`FAIL  ${f} — ${lines} LOC exceeds soft limit ${SOFT} (split in this change)${extra}`);
      console.log(`      target: orchestrator <=150 LOC + per-area files <=350 LOC (extract 1 hook + 1 sub-component; see AGENTS.md "Soft Limit")`);
      errors += 1;
    }
  } else if (lines > SOFT) {
    console.log(`WARN  ${f} — ${lines} LOC over soft limit ${SOFT} (grandfather: split on touch)${extra}`);
    warnings += 1;
  }
}

console.log(`\ncheck-loc: ${errors} error(s), ${warnings} warning(s) across ${files.length} file(s) [base: ${baseLabel}].`);
process.exit(errors > 0 ? 1 : 0);
