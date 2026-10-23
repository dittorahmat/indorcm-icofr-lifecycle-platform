// scripts/check-doc-refs.mjs - comments may not cite a path that does not exist.
// Usage: node scripts/check-doc-refs.mjs [--root <dir>]   (whole tree, takes no file list)
//
// Why: `src/utils/ocr-layout-audit.ts` shipped a header naming
// `scripts/ocr-pdf-audit.ts`, a file that never existed. Green type-check, green
// lint, green tests - the comment was simply false, and it sent the next reader
// hunting for an oracle that was not there. A dead path is as costly as dead
// code, so every repo-root-relative path written in a comment is checked.
//
// Scope: comments only, `src/**` + `worker/**` sources. Product code strings are
// not checked (they hold user copy and route templates, not file citations).
// Tokens containing glob/placeholder characters stay out of scope, because a
// wildcard cannot be checked with existsSync.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const rootIndex = process.argv.indexOf('--root');
const ROOT = resolve(rootIndex === -1 ? '.' : process.argv[rootIndex + 1]);
const ROOTS = ['src', 'worker'];
const TOKEN = /(?:^|[\s`'"(])((?:src|worker|shared|scripts|docs|fixtures)\/[A-Za-z0-9_\-./]+)/g;
const SKIP_CHARS = /[*{}<>$\s]/;

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(entry)) out.push(path);
  }
}

/** Yields `{ line, text }` for every comment line, including block comments. */
function* comments(source) {
  let inBlock = false;
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (inBlock) {
      const end = line.indexOf('*/');
      yield { line: i + 1, text: end === -1 ? line : line.slice(0, end) };
      if (end !== -1) inBlock = false;
      continue;
    }
    const block = line.indexOf('/*');
    const slash = line.indexOf('//');
    if (block !== -1 && (slash === -1 || block < slash)) {
      const end = line.indexOf('*/', block + 2);
      yield { line: i + 1, text: end === -1 ? line.slice(block + 2) : line.slice(block + 2, end) };
      inBlock = end === -1;
    } else if (slash !== -1 && (slash === 0 || /\s/.test(line[slash - 1]))) {
      yield { line: i + 1, text: line.slice(slash + 2) };
    }
  }
}

const files = [];
for (const root of ROOTS) {
  const dir = join(ROOT, root);
  if (existsSync(dir)) walk(dir, files);
}
files.sort();

const failures = [];
for (const file of files) {
  const label = relative(ROOT, file);
  for (const comment of comments(readFileSync(file, 'utf-8'))) {
    for (const match of comment.text.matchAll(TOKEN)) {
      const token = match[1].replace(/[.,;:)]+$/, '');
      if (token.endsWith('/') || SKIP_CHARS.test(token)) continue;
      // Extensionless citations are prose or module specifiers (`worker/app`);
      // only a filename with an extension is a verifiable file citation.
      if (!/\.[A-Za-z0-9]+$/.test(token)) continue;
      if (!existsSync(resolve(ROOT, token))) failures.push(`${label}:${comment.line}  ${token}`);
    }
  }
}

for (const failure of failures) console.log(`FAIL  ${failure}`);
console.log(`\ncheck-doc-refs: ${failures.length} dead path(s) in comments (${files.length} source files scanned).`);
process.exit(failures.length > 0 ? 1 : 0);
