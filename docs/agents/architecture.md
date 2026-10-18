# Architecture deepening rounds

How this repo pays down shallow/tangled modules, and what is left to do.
Read this before starting an architecture round; it replaces per-session
re-discovery of hot-spots.

## What a round is

**Deepening** = move behaviour behind a narrow interface at a clean seam, test
through that interface, and delete the shallow tests it replaces
(replace-don't-layer). Vocabulary: `.agents/skills/codebase-design/SKILL.md`
(module / interface / seam / adapter / depth-as-leverage / deletion test) and
`DEEPENING.md` (dependency categories → test strategy).

Trigger rules that force a touch to deepen: `AGENTS.md` §"Penghapusan Tech
Debt" and the code-smell catalog (soft 400 / hard 600 non-empty LOC, twin
views, duplicated normalizers, mirror server-state).

## The round process (proven over rounds 5–7)

1. **Recon, two parallel read-only agents** — client (`src/**` + client-side
   `shared/**`) and worker (`worker/**` + server-side `shared/**`). Each writes
   a hot-spot report: evidence (`file:line`), deletion test, dependency
   category, proposed narrow interface, blast radius, test plan, risk, LOC
   delta, ranked table, environment ideas, rejected list.
2. **Triage by the coordinator** into 4–6 workstreams with **disjoint file
   ownership** (parallel editors share one working copy — `heavy-cli.md`).
3. **Each workstream** gets its report section as the brief (context pointer,
   never a copy), an explicit owned-file list, and runs only *scoped* gates
   (`check:loc` / `check:any-delta` / `check:i18n` / `eslint` / `vitest` on its
   own files). It does not commit.
4. **Join** — the coordinator runs the full sequence once, sequentially:
   `check:loc` → `check:any-delta` → `check:i18n` → `type-check` → `lint` →
   `build` → `test`; then commits per workstream and opens the PR.
5. **Retro** — fold the recon's "environment ideas" into real gates and docs,
   then update the backlog below. Every round must leave the environment
   stricter than it found it.

**Rounds 8+ skip recon when the previous round left unlanded candidates with
evidence.** Round 7's reports still described five unfixed hot-spots in full
(evidence, seam, test plan, blast radius), so round 8 used the report sections
*directly* as the workstream briefs — no re-discovery, no new recon agents. Only
run a fresh recon when the backlog is exhausted or a new area is in scope.

**Concurrency ceiling (learned the hard way in round 9).** Spawning agents is
rate-limited by the provider: 5 of 5 spawns died in round 9, and 4 of 5 in round
8. Budget a round for **at most 1–2 concurrent subagents**, expect some to die
mid-task, and have the coordinator take bounded high-value slices directly
instead. A killed agent is worse than no agent — its partial work still has to be
read, verified and finished. Never report a round as complete because agents were
*dispatched*; report it complete when the join gates pass on what actually
landed, and shrink the round rather than shipping a broken one.

## Hot-spot reports (context pointers)

- `docs/agents/arch-hotspots-client.md` — `src/**` + client `shared/**`.
- `docs/agents/arch-hotspots-worker.md` — `worker/**` + worker `shared/**`.

When a candidate lands, tick it here rather than editing the reports; the
reports stay as the evidence snapshot of the round that produced them.

## Round log

| Round | Branch / PR | Landed |
| --- | --- | --- |
| 5 | `arch/deepen-5-plus-retro` / #90 | suggest normalize seam, CSA record-row twin seam, worklist grouping, view-transition lock, unversioned cache TTL |
| 6 | `arch/deepen-6-plus-retro` / #91 | CSA assessed-detail (Row/Card thin adapters), findings presentation seam, materiality `getGroupMultiplier` via `entityCount`, scoping `buildView`, RCM ingestion contract |
| 7 | `arch/deepen-7-review` | worker C5 effectiveness single-source · worker C3 BPM OCR seam + node-type parity · worker C1 `migration.ts` route split + materiality seam + guarded rollover · client C1 worksheet control-scope seam · client C5 year-scoped CSA keys + single evidence compressor · client C2 role/level single-source |
| 8 | `arch/deepen-8-review` (stacked on #92) | worker C6 `bpm-service.ts` 559 → 306 + `bpm-match` / `bpm-process-hierarchy` / `bpm-diagrams` seams · worker C4 simulation lifecycle on the canonical table, `as never` 9 → 0 · client C3 one testing-row + column owner · client C6 `SettingsPage` 478 → 59, cache-as-draft · client C4 one IDR owner. Gate added: `check:worker-strings` |
| 9 | `arch/deepen-9-review` / #94 | worker C2 `users.ts` 471 → 351 (dev-route split + ONE owner for the three webhook payload shapes) · worker C7 `rcm-matrix-service.ts` 327 → 132 (one builder; per-kind difference as data). Round deliberately cut short — the provider rate limit killed 5 of 5 spawned agents |
| 10 | `arch/round10-queue` / #108 | backlog published to the tracker (13 issues, `ready-for-agent` + `ready-for-human`), then the queue worked: **#98** `SOCMonitoringPage` 513 → 146 + one badge seam (zero tests → 21) · **#101** the mutating flow-prefix GET → POST + `rbac(['Admin'])` + tenant-explicit. Issue **#107** filed for the `rcm:soc.*` bundle entries |

## Round 9 follow-ups (disclosed, deliberately not landed)

- **`POST /settings/test-webhook` now sends the production payload** the channel
  adapters send, so the Slack body gained the severity line + action button and
  the generic body's `event` is `icofr.notification` (was `icorf.webhook.test`).
  That is the point of a test endpoint — one shape, not two — but it is a visible
  change for anyone whose receiver filtered on the old event name.
- **`users.ts` still declares 8 `c.req.json<any>()`** (pre-existing; invisible to
  `check:any-delta` because its regex matches `: any`/`as any`, not a type
  argument). Typing each route's body is the remaining `any` work there.
- **`worker/routes/users.ts` holds six unrelated sub-domains** (profile, admin,
  departments, settings, notification prefs). Only `/dev/*` was split out; the
  rest of the route-split pattern is still owed.

## Round 8 follow-ups (disclosed, deliberately not landed)
- **Integration-test mocks must mirror the service's transaction handle.** Round
  8 wrapped `createDiagram`/`deleteDiagram`/`deleteProcess`/
  `batchReorganizeProcesses` in one transaction; the two hand-rolled `src/test`
  mocks predated that and lacked `db.transaction`. When a service gains an
  `inTransaction` wrapper, its mocks need `transaction: vi.fn((cb) => cb(db))`.
- **`deleteProcess` no longer calls the public `deleteDiagram`** (it calls the
  diagram seam directly), so tests assert the cascade's *effect*, not a spy on
  the sibling method. `dod-format.ts#getSeverityMeta`'s hardcoded labels are the
  client-C8 item, untouched here.


## Round 7 follow-ups (disclosed, deliberately not landed)

- **Mutating GET in `worker/routes/bpm.ts`** — flagged `FIXME(arch)`. Fixing it
  needs a verb change plus a client-caller update; `check:api-contract` has an
  empty allowlist, so it is not a drive-by fix.
- **Non-prod env guard on the rollover route** — deliberately NOT added: the
  year-end rollover is a live production feature, so `rbac` is the correct
  guard. Adding a confirmation token would change the client contract.
- [x] **`check:loc` failure text** now names the split target (barrel ≤15 LOC +
  ≤350 LOC files) instead of only the violation — landed in round 8.
- **`csaWorklistKey` still has three local owners** (`csa-assessed-detail.ts`,
  `use-csa-worklist.ts`, `CSAWorklistTab.tsx`) — all now carry the year, so it
  is not the round-5 bug, but worklist-only callers need a
  `csaWorklistKey(year)` export on `src/hooks/csa/csa-keys.ts`.
- **`worker/app.ts:312`** reads the ICOFR role from `member.role` while
  `worker/db/seed.ts:81` writes `'admin'|'member'` there — possible pre-existing
  role-source mismatch, outside every workstream's owned files.
- **`shared/workflow-transitions.ts` SCOPING row does not describe the
  materiality-simulation lifecycle.** The table declares `Pending CFO` →
  `Reject: 'Draft'` with `requiredRole: Line 2/Admin`, while production (and the
  UI) uses CFO at `Pending CFO`, Commissioner at `Pending Komut`, and rejects to
  `'Rejected'`; `Rejected` and `Pending Deletion Approval` are absent from its
  SCOPING rows. Round 8 converged only the *Approved* path onto the table and
  preserved production behaviour. Resolving it is a domain decision (extend the
  table vs change the flow), not an architecture drive-by.
- **Grandfathered hardcoded string** `use-evidence-upload.ts:114`
  (`toast.success('Bukti berhasil diunggah')`, key already exists): the
  `check:i18n` toast rule forces its fix on the next touch of that file.


## Open backlog

**The backlog lives in the GitHub issue tracker — deliberately not duplicated
here.** Per-issue state changes every time a PR merges, and a copied list rots
within a round (this section was already stale once). Query it instead:

- `gh issue list --state open --label ready-for-agent` — self-contained briefs;
  every body points at its `arch-hotspots-*` section for the frozen evidence.
- `gh issue list --state open --label ready-for-human` — a domain decision gates
  the work before an agent can proceed.

The round log below records what **landed**; the reports hold the evidence. If
the tracker is ever unreachable, `docs/agents/issue-tracker.md` has the fallback.

## Environment backlog (mechanical guards these rounds earned)

Each item names the drift it would have caught. Do not add a guard without a
precedent that failed in production or shipped green-but-wrong.

- [x] **Banned-cast parity.** `scripts/check-any-delta.mjs` already counts
  `as never` / `as unknown as` alongside `any` and skips non-code files
  (lines 12–13, 53); wired into `.githooks/pre-commit`. Landed in an earlier
  round — the round-7 inventory (11 production casts) is grandfathered by the
  delta baseline.
- [x] **Route-split note.** Now in `docs/agents/guardrails.md` §"Route splits
  keep the barrel and the mount line", including the Hono duplicate-route trap.
- [x] **`check:loc` scope.** Touched mode now applies the same `src`/`worker`/
  `shared` `.ts`/`.tsx` scope as `--all`, and prints `SKIP (out of LOC scope)`
  for locale/data JSON instead of failing it.
- [x] **Literal-union parity.** Round 7 landed the pattern for the OCR node-type
  enum: `shared/bpm-node-types.ts` is an `as const satisfies` array plus a
  compile-checked exhaustive flag, and `shared/bpm-node-types.test.ts` locks it
  (it was 6 members short of `BPMNode['type']`). A repo-wide gate for every
  hand-copied enum is still open; precedent pattern: `workflowStatusesFor`
  iterating the canonical table.
- [ ] **`no-restricted-syntax`: no writing GET, and writes must pass `rbac(`.**
  A `no-restricted-syntax` selector cannot express this (it needs flow analysis
  of the handler body), so it wants a `eslint-local/` rule like
  `local/mutation-requires-onerror`: warn-first, escalate once the baseline
  hits zero. Precedent: the `bpm.ts` mutating `all` endpoint and the unguarded
  `migration.ts` year-clone.
- [x] **Worker string gate.** `scripts/check-worker-strings.mjs` (delta mode,
  `npm run check:worker-strings`) fails on new prose in a worker code slot
  (`bad(c, '…')`, `throw new Error('…')`) — wired into `.githooks/pre-commit`
  and the CI "Repo gates" step. Baseline 81 findings, grandfathered by the
  delta; whole-tree inventory via report mode. Landed in round 8.
- [x] **Duplicate-body detector — deferred with reason** (round 9). Its cited
  precedents (3 matrix selects, 2 webhook payload sets, 2 year clones) were fixed
  by rounds 8–9, so a fuzzy similarity detector would ship with no live precedent
  — the speculative abstraction `AGENTS.md`'s YAGNI rule bans. Re-open it when a
  real duplicate-body drift escapes review again.
- [ ] **Two tsconfigs, two narrowing semantics.** `src/test/**` integration
  tests pull the `worker/app` chain into `tsconfig.app.json` (`strict: false`),
  so worker code is checked under settings where boolean discriminants stop
  narrowing (round-7 rollover: worker project green, app project red). The real
  fix is a dedicated project for the integration tests (strict settings) or
  narrowing those imports; until then the trap is a `CODING_STANDARDS.md` rule.
