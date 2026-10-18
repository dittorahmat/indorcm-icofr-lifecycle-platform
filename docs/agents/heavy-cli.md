# Heavy CLI execution (Windows OOM guard)

`type-check` / `lint` / `build` / `test` emit large output that can crash the
PowerShell host with `System.OutOfMemoryException` when piped/buffered at
once (observed 2026-09-28: `npm run type-check | Select-Object -Last 30`
killed the host, while the same `tsc` redirected to a file exited 0).

- NEVER pipe heavy-command output through PowerShell formatters
  (`Select-Object -Last`, `tail`, `head`). Redirect to a file first, then
  read the file in chunks:
  `npx tsc --noEmit -p tsconfig.app.json > $env:TEMP\opencode\tsc-app.log 2>&1; echo "EXIT:$LASTEXITCODE"`.
- No Unix coreutils in PowerShell (`head`/`tail`, `uniq`, `sort`, `grep`,
  `sed`, `awk`, `tail -n`, pipes like `sort | uniq -c | sort -rn`): none exist on win32
  pwsh and each fails the command outright (observed 2026-10-16: `uniq`
  killed a hot-spot `git log` pipeline; bare `tail` killed a test-log read;
  observed 2026-10-17: `head -n` and `sed -n` failed the same way in this repo).
  PowerShell-native equivalents only, and only on files already written to
  disk, never on live heavy-command output:
  `Get-Content <file> | Select-Object -First/-Last N` (head/tail),
  `... | Group-Object | Sort-Object Count -Descending` (uniq -c + sort),
  `Select-String -Path <file> -Pattern ...` (grep).
- No `python3 -c` with shell metacharacters (`<`, `>`, `|`) in pwsh: PowerShell
  reserves `<` for future use and kills the command before Python starts
  (observed 2026-10-17). Prefer `default.read`/`default.grep` tools for file
  inspection; reserve `shell` for `git`/`npm`/`npx` only.
- No custom vitest reporters (`--reporter=basic` does not exist; observed
  2026-10-17 startup error). Bare `npx vitest run <files>` only; redirect to
  a file first, then `Get-Content -Tail`.
- Run `type-check` per tsconfig (`tsconfig.app.json`, then
  `tsconfig.worker.json`) instead of the combined script when memory is
  constrained.
- If Node itself OOMs (JS heap), raise the heap first:
  `$env:NODE_OPTIONS="--max-old-space-size=4096"`.
- If `vite build` dies during chunk rendering with esbuild `fatal error:
  runtime: cannot allocate memory` (observed 2026-10-13: 1313 modules
  transformed, then native OOM), it is container RAM, not code: validate
  bundling with `npx vite build --minify false` and treat CI as the final
  build gate.
- NEVER run two heavy commands in parallel (e.g. `build` + `test` at once) —
  concurrent Node processes exhaust OS RAM and crash with native
  `node::Realloc` assertion failures. Run them sequentially.
- If a command is known to exceed the tool's foreground timeout (~120s),
  start it in the background instead of timing out in the foreground: full
  `npm test` (~130s observed 2026-10-14) and a cold `npm run build` (>120s)
  always run in background; read the redirected log file when notified.
  Foreground with an explicit `timeout` ≥ 600000 is an acceptable alternative
  when the caller blocks on the result (observed 2026-10-17: cold build timed
  out at 120s, warm retry finished in 28s).
- Parallel editing subagents share one working copy: scope verification per
  workstream only (`npx eslint <owned files>`, targeted `vitest` on owned
  suites). Whole-repo `type-check`/`test` run only after the join — otherwise
  in-flight edits from a sibling workstream pollute the result (observed
  2026-10-17: ingestion workstream's `tsc` flagged half-edited CSA files).
- Multi-line git messages go through a FILE, never `-m` with embedded quotes:
  `Set-Content msg.txt …; git commit -F msg.txt`. PowerShell escapes with a
  backtick, so a `\"` inside a double-quoted `-m` terminates the string, git
  receives stray arguments, and the command fails while the surrounding output
  still scrolls as if it worked (observed 2026-10-18: an `-m` body containing
  `\"\"` left the branch pushed at `main` with NO commit on it).
- Verify every write landed; never trust the appearance. After a commit check
  `git log --oneline -1` AND `git rev-list --count origin/main..HEAD`; after a
  push confirm the ref moved (`33b17b0..d3da715`). Two observed 2026-10-18
  cases: the silent no-commit above, and `gh run watch` reporting `exit=1` for a
  run that was merely CANCELLED as superseded by the next push — read
  `status/conclusion/headSha` before diagnosing a failure.
