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

## Round 7 follow-ups (disclosed, deliberately not landed)

- **Mutating GET in `worker/routes/bpm.ts`** — flagged `FIXME(arch)`. Fixing it
  needs a verb change plus a client-caller update; `check:api-contract` has an
  empty allowlist, so it is not a drive-by fix.
- **Non-prod env guard on the rollover route** — deliberately NOT added: the
  year-end rollover is a live production feature, so `rbac` is the correct
  guard. Adding a confirmation token would change the client contract.
- **`check:loc` failure text** should name the split target (barrel ≤15 LOC +
  ≤350 LOC files) instead of only the violation.
- **`csaWorklistKey` still has three local owners** (`csa-assessed-detail.ts`,
  `use-csa-worklist.ts`, `CSAWorklistTab.tsx`) — all now carry the year, so it
  is not the round-5 bug, but worklist-only callers need a
  `csaWorklistKey(year)` export on `src/hooks/csa/csa-keys.ts`.
- **`worker/app.ts:312`** reads the ICOFR role from `member.role` while
  `worker/db/seed.ts:81` writes `'admin'|'member'` there — possible pre-existing
  role-source mismatch, outside every workstream's owned files.
- **Grandfathered hardcoded string** `use-evidence-upload.ts:114`
  (`toast.success('Bukti berhasil diunggah')`, key already exists): the
  `check:i18n` toast rule forces its fix on the next touch of that file.


## Open backlog (candidates from the round-7 reports)

Round 7 landed worker C5, C3, C1 and client C1, C5, C2 (see the round log).

Worker (see `arch-hotspots-worker.md` for evidence): C2 `users.ts` split +
single webhook payload builder · C4 simulation lifecycle vs canonical
`shared/workflow-transitions.ts` · C6 `bpm-service.ts` (559) match/hierarchy
split + typed errors · C7 one matrix read builder (TLC/ELC/ITGC) · C8
infrastructure SOC dedupe · C9 one CSA test-record write seam · C10 `rbac`
coverage on mutating endpoints.

Client (`arch-hotspots-client.md`): C3 `ReportsPage` test-row derivation ×3 +
disagreeing export column sets · C4 IDR money formatted 8 ways (two without a
locale) · C6 `SettingsPage` mirror server-state + 3× webhook card · C7
`SOCMonitoringPage` (513) badge matrices per view · C8 severity
tone/label/class across 5 modules · C9 `CustomizableDashboard` layout algebra
· C10 4-IPO/7-assertion field set declared 8× with 3 label schemes.

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
- [ ] **Worker string gate.** `check:i18n` cannot see strings `throw`n from
  `worker/**` and rendered by `bad(c, e.message)`. Force `AppError(code, …)`.
  Precedent: three Indonesian sentences thrown from `bpm-service.ts`.
- [ ] **Duplicate-body detector.** A review-time script flagging
  structurally-similar blocks in `worker/**`. Precedent: 3 matrix selects, 2
  SOC inserts, 2 year clones, 2 webhook payload sets.
- [ ] **`check:loc` failure text** names the split target (see follow-ups).
- [ ] **Two tsconfigs, two narrowing semantics.** `src/test/**` integration
  tests pull the `worker/app` chain into `tsconfig.app.json` (`strict: false`),
  so worker code is checked under settings where boolean discriminants stop
  narrowing (round-7 rollover: worker project green, app project red). The real
  fix is a dedicated project for the integration tests (strict settings) or
  narrowing those imports; until then the trap is a `CODING_STANDARDS.md` rule.
