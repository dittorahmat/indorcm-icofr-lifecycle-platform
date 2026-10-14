// scripts/check-i18n.mjs — i18n gates (no deps, plain node).
// Usage:
//   node scripts/check-i18n.mjs [--base <ref>] <touched-files...>
// Gate 1 (legacy): fails when a touched file contains MORE hardcoded first-arg
//   toast literals than its <base> version (default HEAD). New files compare
//   against zero. Test files excluded.
// Gate 2 (missing t keys): fails when a touched src file introduces a NEW
//   t('ns:key' | 'path') key that does not exist in the en locale bundle
//   (fallbackLng=en, so a key missing in en renders as a raw key like the
//   CSA worklist incident: t('worklist.cta') vs page.worklist.cta).
//   Dynamic keys (template interpolation, concatenation, whitespace) are
//   skipped by design. Missing-in-id-but-present-in-en is allowed (English
//   fallback renders, not a raw key).
import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOAST_LITERAL_PATTERN = /toast\.(?:loading|success|error|warning|info)\(\s*["`]/g;
const STATIC_KEY_PATTERN = /^[A-Za-z0-9_:.~-]+$/;

/**
 * Extract every t('key', ...) call with balanced parens (string-aware,
 * template-${}-aware). Returns [{ key, call }] where call is the full text
 * from `t(` to its matching `)`. A key whose call carries a fallback renders
 * that fallback in prod — never a raw key — so the gate only reports calls
 * with neither a string-literal second arg nor a `defaultValue` option.
 */
function extractTCalls(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const m = /\bt\(/.exec(text.slice(i));
    if (!m) break;
    const start = i + m.index;
    let j = start + 2;
    let depth = 1;
    let quote = null;
    let tplBrace = 0;
    while (j < text.length && depth > 0) {
      const c = text[j];
      const prev = text[j - 1];
      if (quote) {
        if (c === quote && prev !== '\\') quote = null;
        else if (quote === '`' && c === '$' && text[j + 1] === '{') tplBrace += 1;
        else if (quote === '`' && c === '}' && tplBrace > 0) tplBrace -= 1;
      } else if (c === "'" || c === '"' || c === '`') {
        quote = c;
      } else if (c === '(') {
        depth += 1;
      } else if (c === ')') {
        depth -= 1;
      }
      j += 1;
    }
    const call = text.slice(start, j);
    const keyMatch = /^t\(\s*['"`]([^'"`]+)['"`]/.exec(call);
    if (keyMatch) out.push({ key: keyMatch[1].trim(), call });
    i = j;
  }
  return out;
}

function hasFallback(call) {
  // String-literal second arg (deprecated i18next defaultValue shorthand)…
  if (/^t\(\s*['"`][^'"`]+['"`]\s*,\s*['"`]/.test(call)) return true;
  // …or an explicit defaultValue option (repo's dominant idiom).
  if (/defaultValue\s*:/.test(call)) return true;
  return false;
}
const NS_ARRAY_PATTERN = /useTranslation\(\s*\[([^\]]*)\]/g;
const NS_SINGLE_PATTERN = /useTranslation\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

const HERE = dirname(fileURLToPath(import.meta.url));
const EN_DIR = join(HERE, '..', 'src', 'i18n', 'locales', 'en');

function countSmells(text) {
  TOAST_LITERAL_PATTERN.lastIndex = 0;
  return (text.match(TOAST_LITERAL_PATTERN) || []).length;
}

function baseContent(path, base) {
  try {
    return execSync('git show ' + base + ':' + JSON.stringify(path), { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? prefix + '.' + k : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, path, out);
    } else {
      out.add(path);
    }
  }
  return out;
}

let enBundles = null;
function loadEnBundles() {
  if (enBundles) return enBundles;
  enBundles = new Map();
  let files = [];
  try {
    files = readdirSync(EN_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return enBundles;
  }
  for (const f of files) {
    const ns = f.slice(0, -'.json'.length);
    try {
      const json = JSON.parse(readFileSync(join(EN_DIR, f), 'utf-8'));
      enBundles.set(ns, flatten(json, '', new Set()));
    } catch {
      // boundary: unreadable locale file — skip instead of failing every consumer
    }
  }
  return enBundles;
}

function fileNamespaces(text) {
  const out = [];
  for (const m of text.matchAll(NS_ARRAY_PATTERN)) {
    for (const q of m[1].matchAll(/['"`]([^'"`]+)['"`]/g)) {
      if (!out.includes(q[1])) out.push(q[1]);
    }
  }
  for (const m of text.matchAll(NS_SINGLE_PATTERN)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

function missingKeysIn(text) {
  const bundles = loadEnBundles();
  if (bundles.size === 0) return [];
  const namespaces = fileNamespaces(text);
  const missing = new Set();
  for (const { key: raw, call } of extractTCalls(text)) {
    if (!raw || !STATIC_KEY_PATTERN.test(raw)) continue;
    if (hasFallback(call)) continue;
    if (raw.includes(':')) {
      const idx = raw.indexOf(':');
      const ns = raw.slice(0, idx);
      const path = raw.slice(idx + 1);
      const bundle = bundles.get(ns);
      if (bundle && bundle.has(path)) continue;
      // Unknown namespace itself is a smell — report as ns:key.
      missing.add(raw);
      continue;
    }
    const candidates = namespaces.length > 0 ? namespaces : ['common'];
    const found = candidates.some((ns) => bundles.get(ns)?.has(raw));
    if (!found) {
      // No hook in file (worker/shared): allow any namespace before flagging.
      if (namespaces.length === 0) {
        const anywhere = [...bundles.values()].some((s) => s.has(raw));
        if (anywhere) continue;
      }
      missing.add(namespaces.length > 0 ? `${candidates[0]}:${raw}` : raw);
    }
  }
  return [...missing];
}

let base = 'HEAD';
const files = [];
{
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
      base = args[++i];
    } else if (!args[i].startsWith('--')) {
      files.push(args[i]);
    }
  }
}
if (files.length === 0) {
  console.log('check-i18n: no files given. Usage: node scripts/check-i18n.mjs [--base <ref>] <files...>');
  process.exit(1);
}

let errors = 0;
for (const f of files) {
  const unix = f.replace(/\\/g, '/');
  if (/\.test\.|\.spec\.|src\/test\//.test(unix)) {
    console.log('SKIP  ' + f + ' (test file: literals are assertions by design)');
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
  const baseCount = baseText === null ? 0 : countSmells(baseText);
  const nowCount = countSmells(now);
  if (nowCount > baseCount) {
    console.log('FAIL  ' + f + ' — hardcoded toast strings ' + baseCount + ' -> ' + nowCount + ' (+' + (nowCount - baseCount) + ')');
    errors += 1;
    continue;
  } else {
    console.log('OK    ' + f + ' — hardcoded toast strings ' + baseCount + ' -> ' + nowCount);
  }

  if (!/\.(tsx|ts|jsx|js)$/.test(unix)) continue;
  if (unix.includes('src/i18n/locales/')) continue;
  if (!now.includes("t('") && !now.includes('t("') && !now.includes('t(`')) continue;
  const nowMissing = missingKeysIn(now);
  if (nowMissing.length === 0) {
    console.log('OK    ' + f + ' — t() keys resolve in en bundle');
    continue;
  }
  const baseMissing = baseText === null ? [] : missingKeysIn(baseText);
  const fresh = nowMissing.filter((k) => !baseMissing.includes(k));
  if (fresh.length > 0) {
    console.log('FAIL  ' + f + ' — missing en locale keys: ' + fresh.join(', '));
    errors += 1;
  } else {
    console.log('OK    ' + f + ' — no new missing keys (' + nowMissing.length + ' pre-existing)');
  }
}

console.log('\ncheck-i18n: ' + errors + ' error(s) across ' + files.length + ' file(s).');
process.exit(errors > 0 ? 1 : 0);
