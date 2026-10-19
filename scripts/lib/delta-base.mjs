// scripts/lib/delta-base.mjs — the ONE base-resolution rule for the delta gates.
//
// Why this exists: every delta gate ("no NEW X vs <base>") defaulted its base to
// HEAD. That verdict depends on whether you have committed. Before `git commit`,
// HEAD is the pre-change state and the gate reads true; after committing, the
// change IS HEAD and every delta collapses to zero — a gate that goes green
// exactly when it stops being able to see your work.
//
// The correct base is the branch point: how this change stands against the line
// it will merge into. That is also what the grandfather rule in AGENTS.md means
// by "shrunk vs HEAD" — compare the file to the version it started from, not to
// itself.
//
// Precedence: explicit --base wins (CI passes origin/<base_ref>) → else the
// merge-base of HEAD with the first base branch that resolves → else HEAD, so a
// repo with no base branch (fresh clone, no remote) still gates per commit.
import { execSync } from 'node:child_process';

const BASE_BRANCHES = ['origin/main', 'main', 'origin/master', 'master'];

export function resolveBase(explicit) {
  if (explicit) return { ref: explicit, label: `--base ${explicit}` };
  for (const branch of BASE_BRANCHES) {
    try {
      execSync('git rev-parse --verify --quiet ' + JSON.stringify(branch), { stdio: 'ignore' });
      const ref = execSync('git merge-base ' + JSON.stringify(branch) + ' HEAD', { encoding: 'utf-8' }).trim();
      if (ref) return { ref, label: `merge-base with ${branch} (${ref.slice(0, 8)})` };
    } catch {
      // Branch absent in this clone — try the next candidate.
    }
  }
  return { ref: 'HEAD', label: 'HEAD (no base branch found)' };
}
