// scripts/install-hooks.mjs — make the repo gates default-on for every clone.
//
// Why this exists: .githooks/pre-commit holds the fast delta gates, but git
// ignores it unless core.hooksPath points there. That used to be a documented
// manual step ("enable once per clone"), which means a fresh clone — and every
// fresh agent machine — runs with no pre-commit gate at all, and nothing
// reports the gap: an absent guardrail looks exactly like clean code.
// Wired as package.json "prepare" so `npm install` / `npm ci` install it.
//
// Never fails the install: outside a git worktree (packaged builds, some CI
// sandboxes) there is nothing to configure. A hooks path owned by another tool
// (husky and friends) is reported, not clobbered.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WANTED = '.githooks';

if (!existsSync(join(root, WANTED, 'pre-commit'))) {
  console.log('install-hooks: no .githooks/pre-commit in this tree — nothing to install.');
  process.exit(0);
}

// `git config --get` exits 1 when the key is unset, so read it without throwing.
const run = (cmd) => {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

if (run('git rev-parse --is-inside-work-tree') !== 'true') {
  console.log('install-hooks: not a git worktree (or git unavailable) — skipped.');
  process.exit(0);
}

const current = run('git config --get core.hooksPath');
if (current === WANTED) {
  console.log(`install-hooks: core.hooksPath already ${WANTED}.`);
} else if (current) {
  console.log(`install-hooks: core.hooksPath is "${current}", left alone. Repo gates need: git config core.hooksPath ${WANTED}`);
} else {
  run(`git config core.hooksPath ${WANTED}`);
  console.log(`install-hooks: core.hooksPath set to ${WANTED} — pre-commit gates are now on (check:loc, any-delta, i18n, worker-strings).`);
}
