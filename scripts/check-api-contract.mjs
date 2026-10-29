// scripts/check-api-contract.mjs — frontend→backend API contract (no deps, plain node).
// Usage:
//   node scripts/check-api-contract.mjs [--root <dir>]
// Fails when a frontend (method, path) call has no matching backend route.
// Method-aware on purpose: a path that exists for GET but is called with PUT
// (the missing-PUT post-mortem) must fail. One-directional only — backend
// routes without a frontend caller are legitimate (admin/dev surfaces).
//
// Frontend sources: api(...) / fetch(...) calls under src/** (tests excluded).
// Dynamic `const url = ... : ...` / `const method = ...` ternaries in the same
// file are expanded into variant pairs. Anything else unresolvable is listed
// as UNRESOLVED (info only, never fails). Known limitation: '/api/' + string
// concatenation is not joined (the tree uses template literals throughout).
// Backend sources: Hono .get/.post/.put/.patch/.delete/.options/.all(path)
// literals under worker/routes/**, resolved through barrel `.route(prefix)`
// mounts (convention: worker/routes/<B>.ts mounts worker/routes/<B>/*).
// app.ts mounts every barrel at /api, which is stripped before comparing.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = (() => {
  const i = process.argv.indexOf('--root');
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : process.cwd();
})();

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const normSeg = (s) => (s.startsWith(':') || s === '*' ? ':param' : s);
function normPath(p) {
  return p.replace(/\$\{[^}]*\}/g, ':param').split('?')[0].split('/').filter(Boolean).map(normSeg);
}

function matches(front, back) {
  if (front.length !== back.length) return false;
  return front.every((s, i) => s === back[i] || s === ':param' || back[i] === ':param');
}

// ---- backend ----
function collectBackend() {
  const files = walk(join(root, 'worker', 'routes')).filter(
    (f) => !f.includes('__tests__'),
  );
  // Barrel prefixes: worker/routes/<B>.ts mounting worker/routes/<B>/*.
  const barrelPrefix = new Map(); // subdir -> prefixes[]
  for (const f of files) {
    const rel = relative(join(root, 'worker', 'routes'), f).replace(/\\/g, '/');
    if (rel.includes('/')) continue;
    const text = readFileSync(f, 'utf-8');
    const mounts = [...text.matchAll(/\.route\(\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
    if (mounts.length > 0) barrelPrefix.set(rel.replace(/\.ts$/, ''), mounts);
  }
  const routes = [];
  const callRe = /\.(get|post|put|patch|delete|options|all)\s*\(\s*(['"`])/g;
  for (const f of files) {
    const rel = relative(join(root, 'worker', 'routes'), f).replace(/\\/g, '/');
    const dir = rel.includes('/') ? rel.slice(0, rel.indexOf('/')) : null;
    const prefixes = (dir && barrelPrefix.get(dir)) || [''];
    const text = readFileSync(f, 'utf-8');
    let m;
    callRe.lastIndex = 0;
    while ((m = callRe.exec(text))) {
      const q = m[2];
      const end = text.indexOf(q, m.index + m[0].length);
      if (end < 0) continue;
      const lit = text.slice(m.index + m[0].length, end);
      if (!lit.startsWith('/')) continue; // c.get('orgId') & friends
      for (const prefix of prefixes) {
        routes.push({ method: m[1].toUpperCase(), path: normPath(prefix + lit), file: rel });
      }
    }
  }
  return routes;
}

// ---- frontend ----
const CALLEES = ['api', 'fetch'];

// Out of scope by design: the api() wrapper itself (unresolvable `path`
// param) and Better Auth client endpoints (served by the auth handler,
// never declared as Hono route literals).
const SKIP_FILES = ['src/lib/api-client.ts'];
const SKIP_PREFIXES = ['/api/auth/'];

function splitTernary(rhs) {
  // Splits `cond ? then : else` at top level; returns null when not a ternary.
  let depth = 0;
  let str = null;
  let q = -1;
  for (let i = 0; i < rhs.length; i++) {
    const ch = rhs[i];
    if (str) {
      if (ch === '\\') { i++; continue; }
      if (ch === str) str = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { str = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth++; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { depth--; continue; }
    if (ch === '?' && depth === 0 && rhs[i + 1] !== '?' && rhs[i + 1] !== '.') { q = i; break; }
  }
  if (q < 0) return null;
  depth = 0;
  str = null;
  for (let i = q + 1; i < rhs.length; i++) {
    const ch = rhs[i];
    if (str) {
      if (ch === '\\') { i++; continue; }
      if (ch === str) str = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { str = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth++; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { depth--; continue; }
    if (ch === ':' && depth === 0) return [rhs.slice(q + 1, i), rhs.slice(i + 1)];
  }
  return null;
}

function litsOf(rhs, kind) {
  if (kind === 'api') return [...rhs.matchAll(/(['"`])(\/api\/[^'"`]*?)\1/g)].map((x) => x[2]);
  return [...rhs.matchAll(/['"`](GET|POST|PUT|PATCH|DELETE)['"`]/g)].map((x) => x[1]);
}

function scanBalanced(text, i, terminator) {
  // Index just past the depth-0 terminator (';' or '}'), or -1.
  const closers = [];
  let str = null;
  for (let j = i; j < text.length; j++) {
    const ch = text[j];
    if (str) {
      if (ch === '\\') { j++; continue; }
      if (ch === str) { str = null; continue; }
      if (str === '`' && ch === '$' && text[j + 1] === '{') {
        const inner = scanBalanced(text, j + 2, '}');
        if (inner < 0) return -1;
        j = inner - 1;
        continue;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { str = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') {
      closers.push(ch === '(' ? ')' : ch === '[' ? ']' : '}');
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      if (closers.length > 0) {
        if (ch !== closers.pop()) return -1;
        continue;
      }
      if (terminator === '}' && ch === '}') return j + 1;
      return -1;
    }
    if (ch === ';' && closers.length === 0) {
      return terminator === ';' ? j + 1 : -1;
    }
  }
  return -1;
}

function constDecls(text) {
  // name -> [{ index, rhs }], supporting TS annotations, nesting (a `const`
  // inside a call argument is still found), and redeclaration (call sites
  // resolve to the nearest preceding declaration — an approximation when
  // the same name is reused across scopes, noted in UNRESOLVED output).
  const map = new Map();
  const headRe = /(?:const|let)\s+([A-Za-z_$][\w$]*)(?:\s*:[^=;]+)?\s*=\s*/g;
  let m;
  while ((m = headRe.exec(text))) {
    const end = scanBalanced(text, m.index + m[0].length, ';');
    if (end > 0) {
      const list = map.get(m[1]) || [];
      list.push({ index: m.index, rhs: text.slice(m.index + m[0].length, end - 1) });
      map.set(m[1], list);
    }
    headRe.lastIndex = m.index + 1; // keep scanning inside for nested decls
  }
  return map;
}

function nearestBefore(list, index) {
  let best = null;
  for (const d of list) {
    if (d.index <= index && (!best || d.index > best.index)) best = d;
  }
  return best;
}

function balancedCall(text, openParen) {
  // openParen points at '('. Returns the full call text or null.
  let depth = 0;
  let str = null;
  for (let j = openParen; j < text.length; j++) {
    const ch = text[j];
    if (str) {
      if (ch === '\\') { j++; continue; }
      if (ch === str) { str = null; continue; }
      if (str === '`' && ch === '$' && text[j + 1] === '{') {
        const inner = scanBalanced(text, j + 2, '}');
        if (inner < 0) return null;
        j = inner - 1;
        continue;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { str = ch; continue; }
    if (ch === '(') { depth++; continue; }
    if (ch === ')') {
      depth--;
      if (depth === 0) return text.slice(openParen, j + 1);
    }
  }
  return null;
}

function collectFrontend() {
  const files = walk(join(root, 'src')).filter((f) => {
    const rel = f.replace(/\\/g, '/');
    return !/\.test\.|\.spec\.|src\/test\//.test(rel) && !SKIP_FILES.some((s) => rel.endsWith(s));
  });
  const calls = [];
  const unresolved = [];
  for (const f of files) {
    const rel = relative(root, f).replace(/\\/g, '/');
    const text = readFileSync(f, 'utf-8');
    const decls = constDecls(text);
    const re = /(?<![\w$])(api|fetch)\s*(<[^()]*>)?\(/g;
    let m;
    while ((m = re.exec(text))) {
      const callText = balancedCall(text, m.index + m[0].length - 1);
      if (!callText) continue;
      const inner = callText.slice(1, -1);
      const first = inner.match(/^\s*(['"`])|^\s*([A-Za-z_$][\w$]*)/);
      let urlVariants = [];
      let urlRhs = null;
      if (first && first[1]) {
        const q = first[1];
        const end = inner.indexOf(q, 1);
        if (end < 0) continue;
        const lit = inner.slice(1, end);
        if (!lit.startsWith('/api/')) continue; // Absolute URL or non-API path.
        urlVariants = [lit];
      } else if (first && first[2]) {
        const decl = nearestBefore(decls.get(first[2]) || [], m.index);
        if (!decl) {
          unresolved.push({ file: rel, line: lineOf(text, m.index), hint: 'var ' + first[2] });
          continue;
        }
        urlRhs = decl.rhs;
        urlVariants = litsOf(decl.rhs, 'api');
        if (urlVariants.length === 0) continue;
      } else {
        continue;
      }
      const inlineMeths = [...inner.matchAll(/method\s*:\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]/g)].map((x) => x[1]);
      const pairs = [];
      if (inlineMeths.length > 0) {
        for (const v of urlVariants) for (const method of inlineMeths) pairs.push([v, method]);
      } else {
        // Shorthand `{ method }` or `method: methodVar` via sibling const.
        const ref = inner.match(/(?:^|[,{]\s*)method\s*(?::\s*([A-Za-z_$][\w$]*))?(?=[,}])/);
        const varName = (ref && ref[1]) || (/[{,]\s*method\s*[,}]/.test(inner) ? 'method' : null);
        const mDecl = varName ? nearestBefore(decls.get(varName) || [], m.index) : null;
        const methRhs = mDecl ? mDecl.rhs : null;
        const urlTernary = urlRhs ? splitTernary(urlRhs) : null;
        const methTernary = methRhs ? splitTernary(methRhs) : null;
        const nested = (p) => (p ? splitTernary(p[0]) !== null || splitTernary(p[1]) !== null : false);
        if (urlTernary && methTernary && !nested(urlTernary) && !nested(methTernary)) {
          // Correlated `cond ? A : B` idiom — pair branch-wise, never cross.
          pairs.push([litsOf(urlTernary[0], 'api')[0], litsOf(methTernary[0], 'method')[0]]);
          pairs.push([litsOf(urlTernary[1], 'api')[0], litsOf(methTernary[1], 'method')[0]]);
        } else {
          const methVariants = methRhs ? litsOf(methRhs, 'method') : [];
          for (const v of urlVariants) {
            for (const method of methVariants.length > 0 ? methVariants : ['GET']) {
              pairs.push([v, method]);
            }
          }
        }
      }
      for (const [v, method] of pairs) {
        if (!v || !method || v.startsWith('/api/auth/')) continue;
        calls.push({ method, path: normPath(v.replace(/^\/api/, '')), raw: v, file: rel, line: lineOf(text, m.index) });
      }
    }
  }
  return { calls, unresolved };
}

// ---- compare ----
const backend = collectBackend();
const { calls, unresolved } = collectFrontend();

// Triaged gaps: frontend calls with no backend route that are knowingly
// accepted for now. NEVER add a reason-free entry; each must name the
// follow-up. New unmatched calls still fail. Paths are post-/api segments,
// ':param' wildcards any single segment.
const ALLOWLIST = [
];

function allowlisted(call) {
  return ALLOWLIST.find(
    (a) => a.method === call.method && matches(call.path, a.path.map(normSeg)),
  );
}

const seen = new Set();
const violations = [];
const allowed = [];
for (const c of calls) {
  const key = c.method + ' ' + c.path.join('/');
  if (seen.has(key)) continue;
  seen.add(key);
  const ok = backend.some((b) => b.method === c.method && matches(c.path, b.path));
  if (ok) continue;
  const waiver = allowlisted(c);
  if (waiver) {
    allowed.push({ call: c, reason: waiver.reason });
    continue;
  }
  violations.push(c);
}

// Check for double-unwrapping anti-pattern: api<{ success: ... }> or api<ApiResponse<...>>
const doubleUnwrapViolations = [];
for (const file of walk(join(root, 'src')).filter((f) => !f.includes('__tests__') && !/\.test\.tsx?$/.test(f))) {
  const content = readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/api\s*<\s*(\{\s*success\b|ApiResponse\b)/g)];
  for (const m of matches) {
    doubleUnwrapViolations.push({
      file: relative(root, file).replace(/\\/g, '/'),
      line: lineOf(content, m.index),
      match: m[0],
    });
  }
}

if (doubleUnwrapViolations.length > 0) {
  console.log('FAIL — double-unwrapping detected in api<T>() generic calls (api<T> unwraps automatically):');
  for (const v of doubleUnwrapViolations) {
    console.log('  ' + v.match + '  <- ' + v.file + ':' + v.line);
  }
  process.exit(1);
}

console.log('check-api-contract: backend routes=' + backend.length + ', frontend calls=' + calls.length + ' (' + seen.size + ' unique), unresolved=' + unresolved.length);
for (const u of unresolved.slice(0, 20)) {
  console.log('  UNRESOLVED ' + u.file + ':' + u.line + ' (' + u.hint + ')');
}
for (const a of allowed) {
  console.log('  ALLOWLISTED ' + a.call.method + ' ' + a.call.raw + '  <- ' + a.call.file + ':' + a.call.line + '  [' + a.reason + ']');
}
if (violations.length > 0) {
  console.log('FAIL — frontend calls with no backend route:');
  for (const v of violations) {
    console.log('  ' + v.method + ' ' + v.raw + '  <- ' + v.file + ':' + v.line);
  }
  process.exit(1);
}
console.log('check-api-contract: 0 violation(s).');
