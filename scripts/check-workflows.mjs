// scripts/check-workflows.mjs — every GitHub workflow must parse, and must
// declare the two things GitHub needs to run it (`on`, non-empty `jobs`).
// Usage: node scripts/check-workflows.mjs      (whole tree, takes no file list)
//
// Why a whole-tree gate and not a delta gate: a workflow file is valid or it is
// not, and a broken one fails in the worst possible way — GitHub refuses the
// whole file, reports "This run likely failed because of a workflow file issue"
// with ZERO jobs and no log, and nothing in this repo turns red. The PR simply
// stops being verified.
//
// That is not hypothetical: `verify.yml` (the gate that verifies everything
// else) became unparseable in commit 57f75cf, where the rbac-delta line landed
// one indentation level shallower than the `run: |` block body it belongs to.
// Every run for the next four commits reported a startup failure in 0s
// (39200554676 / 39207065068) while the last real run (39196925657, 6m48s,
// success) predated it. The YAML reason for the dedented line is exact:
// "Implicit keys need to be on a single line".
//
// Parsing uses the `yaml` package rather than a hand-rolled indentation check:
// a regex that guesses what GitHub would accept is a worse parser than the one
// that rejected the file, and it would fail honest workflows instead.
import { readFileSync, readdirSync } from 'node:fs';

const DIR = '.github/workflows';

let parse;
try {
  ({ parse } = await import('yaml'));
} catch {
  console.log('SKIP  workflow check — the `yaml` package is not installed (npm ci installs it).');
  process.exit(0);
}

const names = readdirSync(DIR)
  .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
  .sort();

let errors = 0;
for (const name of names) {
  const path = `${DIR}/${name}`;
  let doc;
  try {
    doc = parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    // The parser's message starts with the reason plus the position; the rest is
    // a caret diagram that the console would wrap into noise.
    const reason = String(e.message).split('\n')[0];
    console.log(`FAIL  ${path} — GitHub cannot parse this file: ${reason}`);
    errors += 1;
    continue;
  }
  if (!doc?.on) {
    console.log(`FAIL  ${path} — no \`on:\` trigger, so GitHub would never run it`);
    errors += 1;
    continue;
  }
  const jobs = Object.keys(doc.jobs ?? {});
  if (jobs.length === 0) {
    console.log(`FAIL  ${path} — no jobs, so a run would start and do nothing`);
    errors += 1;
    continue;
  }
  console.log(`OK    ${path} — on: ${Object.keys(doc.on).join('+')}, job(s): ${jobs.join(', ')}`);
}

console.log(`\ncheck-workflows: ${errors} error(s) across ${names.length} workflow(s).`);
process.exit(errors > 0 ? 1 : 0);
