# Heavy CLI execution (Windows OOM guard)

`type-check` / `lint` / `build` / `test` emit large output that can crash the
PowerShell host with `System.OutOfMemoryException` when piped/buffered at
once (observed 2026-09-28: `npm run type-check | Select-Object -Last 30`
killed the host, while the same `tsc` redirected to a file exited 0).

- NEVER pipe heavy-command output through PowerShell formatters
  (`Select-Object -Last`, `tail`, `head`). Redirect to a file first, then
  read the file in chunks:
  `npx tsc --noEmit -p tsconfig.app.json > $env:TEMP\opencode\tsc-app.log 2>&1; echo "EXIT:$LASTEXITCODE"`.
- Unix `head`/`tail` do not exist in PowerShell — use
  `Select-Object -First/-Last` (or `Get-Content ... | Select-Object`), and
  only on files already written to disk, never on live heavy-command output.
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
