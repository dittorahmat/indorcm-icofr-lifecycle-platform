// scripts/check-worker-strings.mjs — worker emitting user-facing prose in a
// CODE slot (no deps, runs on plain node).
// Usage:
//   node scripts/check-worker-strings.mjs [--base <ref>] <files...>   delta gate
//   node scripts/check-worker-strings.mjs                             whole-tree report
// Fails when a scanned file produces MORE prose-as-code findings than its
// <base> version. <base> defaults to the branch point (merge-base with
// origin/main) so the verdict does not change when you commit — see
// scripts/lib/delta-base.mjs. New files compare against a zero baseline.
// With no files it prints the whole-worker inventory and always exits 0
// (burn-down view).
//
// Why: `check:i18n` only sees client `t()` / `toast.*()` literals, so a sentence
// thrown from `worker/**` and surfaced by `bad(c, e.message)` bypasses every
// gate. Codes belong on a literal union; prose belongs in the optional message:
// `AppError(code, message, status)` / `bad(c, code, status, message)`.
// Precedent: the Indonesian sentences thrown from `bpm-service.ts`.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolveBase } from './lib/delta-base.mjs';

const CODE_ONLY = /^[A-Za-z0-9_.:-]+$/;

const RULES = [
  {
    // throw new Error('Kontrol tidak ditemukan')  -> AppError(code, message, status)
    re: /throw\s+new\s+Error\(\s*(['"`])(.*?)\1/g,
    hint: 'throw AppError(code, message, status)',
  },
  {
    // bad(c, 'Kontrol tidak ditemukan', 400)      -> bad(c, CODE, 400, message)
    re: /\b(?:bad|notFound)\(\s*[A-Za-z_$][\w$.]*\s*,\s*(['"`])(.*?)\1/g,
    hint: 'first arg is the stable code; pass prose as the message arg',
  },
  {
    // Presentation styling classes leaked into backend responses: statusColor: 'text-emerald-700'
    re: /(['"`])((?:text|bg|border|ring)-[a-z]+-[0-9]+)\1/g,
    hint: 'backend must not emit UI styling classes; return semantic enum',
    isStyleToken: true,
  },
];

const isTest = (path) =>
  /\.(test|spec)\.[jt]sx?$/.test(path) || /(^|\/)__tests__\//.test(path);
const inScope = (path) => /^worker\/.*\.tsx?$/.test(path);
const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

/** A quoted literal that reads as human prose rather than a code. */
function proseLiteral(raw) {
  const text = (raw ?? '').trim();
  if (!text || text.includes('${')) return null;
  if (CODE_ONLY.test(text)) return null;
  if (!/\s/.test(text) || !/[A-Za-z]/.test(text)) return null;
  return text;
}

/** Findings per source line, so the message can name the prose. */
function findings(text) {
  const out = [];
  text.split('\n').forEach((line, index) => {
    if (isComment(line)) return;
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let hit;
      while ((hit = rule.re.exec(line)) !== null) {
        if (rule.isStyleToken) {
          out.push({ line: index + 1, prose: hit[2], hint: rule.hint });
        } else {
          const prose = proseLiteral(hit[2]);
          if (prose) out.push({ line: index + 1, prose, hint: rule.hint });
        }
      }
    }
  });
  return out;
}

function baseContent(path, base) {
  try {
    return execSync('git show ' + base + ':' + JSON.stringify(path), {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function listWorkerFiles() {
  const out = execSync('git ls-files "worker/**/*.ts"', { encoding: 'utf-8' });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

const argv = process.argv.slice(2);
let explicitBase = null;
const files = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--base' && argv[i + 1]) explicitBase = argv[++i];
  else if (!argv[i].startsWith('--')) files.push(argv[i]);
}
const { ref: base, label: baseLabel } = resolveBase(explicitBase);

// Whole-tree report mode: inventory for the burn-down, never fails.
if (files.length === 0) {
  let total = 0;
  for (const file of listWorkerFiles()) {
    if (isTest(file)) continue;
    const hits = findings(readFileSync(file, 'utf-8'));
    for (const hit of hits) {
      console.log(`WARN  ${file}:${hit.line} — user-facing prose as a code: "${hit.prose}"`);
    }
    total += hits.length;
  }
  console.log(`\ncheck-worker-strings: ${total} finding(s) in the worker tree (report mode — exits 0).`);
  console.log('Burn down on touch; the delta gate fails only on NEW prose.');
  process.exit(0);
}

let errors = 0;
for (const raw of files) {
  const f = raw.replace(/\\/g, '/');
  if (!inScope(f)) {
    console.log('SKIP  ' + f + ' (out of scope: worker/**/*.ts only)');
    continue;
  }
  if (isTest(f)) {
    console.log('SKIP  ' + f + ' (test file)');
    continue;
  }
  let now;
  try {
    now = readFileSync(f, 'utf-8');
  } catch {
    console.log('SKIP  ' + f + ' (unreadable, likely deleted)');
    continue;
  }
  const baseText = baseContent(f, base);
  const baseHits = baseText === null ? [] : findings(baseText);
  const nowHits = findings(now);
  if (nowHits.length > baseHits.length) {
    console.log(
      `FAIL  ${f} — worker prose-as-code ${baseHits.length} -> ${nowHits.length} (+${nowHits.length - baseHits.length})`,
    );
    const known = new Set(baseHits.map((h) => h.prose));
    for (const hit of nowHits) {
      if (known.has(hit.prose)) continue;
      console.log(`      ${f}:${hit.line} "${hit.prose}" — ${hit.hint}`);
    }
    errors += 1;
  } else {
    console.log(`OK    ${f} — worker prose-as-code ${baseHits.length} -> ${nowHits.length}`);
  }
}

console.log(`\ncheck-worker-strings: ${errors} error(s) across ${files.length} file(s) [base: ${baseLabel}].`);
process.exit(errors > 0 ? 1 : 0);
