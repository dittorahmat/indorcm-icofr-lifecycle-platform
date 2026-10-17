# Architecture hot-spots — server/domain (`worker/**` + worker-consumed `shared/**`)

Reconnaissance for the next "arch(review): deepen N hot-spot modules" batch on
branch `arch/deepen-7-review`. Read-only; no production/test source was edited.
Eligible surface: `worker/**` plus `shared/**` modules the worker consumes.

Method
- LOC = **non-empty lines**, exactly `scripts/check-loc.mjs` (`split('\n').filter(l => l.trim() !== '')`).
  Counts below were taken with an in-memory node walker over the working copy; no heavy
  CLI was run (no `type-check` / `lint` / `test` / `build`, no DB, no migrations).
- Deepening vocabulary from `.agents/skills/codebase-design/{SKILL,DEEPENING}.md`:
  module / interface / seam / adapter / depth-as-leverage / deletion test /
  in-process · local-substitutable · remote-owned · true-external.
- Review rules from `CODING_STANDARDS.md` (seam codes produced once, single-sourced
  normalizers, twin views, mutation `onError`) and `AGENTS.md` §9–10 (god file 400/600,
  route-split pattern, pure-logic extraction, `any`/`as never`/`!`, GET-mutating).
- Already-deepened modules (AI suggest service/route, `shared/ai-cache.ts`,
  `shared/suggest-guards.ts`, `rcm-ingestion.ts`, `rcm-matrix-write.ts` port+store,
  `deficiency-trigger.ts`, `csa-verdict.ts`) are **not** re-proposed.

Current worker/shared surface of interest — all non-empty LOC >400 (god files) plus the
near-limit files this report reasons about (exemptions listed after):

| file | non-empty LOC | `: any`/`as any` | `as never`/`as unknown as` | non-null `!` |
| --- | ---: | ---: | ---: | ---: |
| `worker/services/bpm-service.ts` | 559 | 8 | 0 | 0 |
| `worker/routes/migration.ts` | 505 | 8 | 0 | 0 |
| `worker/routes/users.ts` | 471 | 10 | 0 | 8 |
| `worker/routes/bpm.ts` | 379 | 7 | 0 | 30 |
| `shared/testing-decision.ts` | 356 | 1 | 0 | 0 |
| `shared/control-linkage.ts` | 349 | 0 | 0 | 0 |
| `worker/services/rcm-matrix-service.ts` | 327 | 0 | 0 | 0 |
| `worker/services/bpm/bpm-sync.ts` | 317 | 19 | 0 | 0 |
| `worker/routes/infrastructure.ts` | 295 | 1 | 0 | 0 |
| `worker/routes/csa/csa-samples-testing.ts` | 238 | 3 | 0 | 0 |
| `worker/routes/scoping/scoping-simulation-lifecycle.ts` | 196 | 0 | **3** | 3 |
| `worker/routes/scoping/scoping-simulations.ts` | 176 | 0 | **6** | 0 |
| `worker/routes/reporting.ts` | 117 | 10 | 0 | 0 |

Exempt data-blobs (not candidates): `shared/mock-data.ts` 1486,
`shared/constants/scoping-defaults.ts` 942.

---

## C1 — `migration.ts`: inline TB/RCM ingestion + a second, unguarded year-clone

**Files (non-empty LOC now):** `worker/routes/migration.ts` **505**; duplicated peer
logic in `worker/services/scoping-service.ts` **213** and
`worker/routes/scoping/scoping-snapshots.ts` **129**.

**Tangle evidence**
- God route barrel, 505 LOC, still a single flat file (no `worker/routes/migration/` split).
- `/migration/finalize` is **not a transaction** and does direction-changing domain work inline:
  TB → GL snapshot + rows (`migration.ts:24-67`), FSLI aggregation + PM materiality
  decision (`:69-105`), then RCM→process→risk→control fan-out (`:129-245`).
  The significance rule is inline and untested:
  `isQuantitative: finalBalance >= pmValue` (`:101`).
- `/migration/rollover` is a **second year-clone implementation** with no `rbac` guard
  (`migration.ts:254`; only `finalize` at `:15` is guarded — grep confirms `rbac` appears
  twice in the file: the import and line 15). It clones bpmDiagrams/rcms/controls/
  rcmControls/deficiencies/actionPlans with id remapping (`:286-546`), while
  `ScopingService.carryForward` (`scoping-service.ts:118-245`) clones the same artefacts
  (bpmDiagrams/rcms/controls/rcmControls/bpmNodeRcms) from a different entry point.
  Same behaviour, two owners, neither shares a seam.
- GL row ingestion is also duplicated: `scoping-snapshots.ts:31-80` (snapshot + chunked
  `glRows` insert, 100/batch) vs `migration.ts:27-67` (same insert, same batch size).
- Error leak: `catch (err: any) { return c.json({ success: false, error: err.message }, 500) }`
  at `:248-250` and `:549-551` — raw driver text crosses the seam instead of
  `AppError` + `ok/bad/notFound`.

**Deletion test.** Delete the route and the complexity reappears: (a) FSLI
aggregation + PM significance must be re-derived by whoever calls `finalize`;
(b) year cloning re-appears beside `carryForward` (already two copies);
(c) chunked GL-row ingestion re-appears beside `POST /gl-snapshots`. Three
duplicated primitives, no single owner.

**Dependency category.** Two layers.
- FSLI aggregation + significance (pure) → **in-process**; testable with plain
  fixtures, **no Postgres**.
- Year clone / GL ingestion → **local-substitutable**: the repo has no PGlite harness
  (`@electric-sql/pglite` appears only as a drizzle peer dep in `package-lock.json`;
  PGlite was used out-of-repo for ADR-0003). So the clone seam is tested the repo's
  existing way: mocked drizzle chain (`src/test/bpm-service-cascade-delete.test.ts`) or a
  `store` port with an in-memory fake, as `rcm-matrix-write.ts` already does. Prefer the
  **port + in-memory fake** (`two adapters` = prod drizzle + fake) so the seam needs no DB.

**Proposed narrow interface**
```ts
// shared/scoping-materiality.ts  (pure, in-process)
export interface FsliAggregate { name: string; balance: number; fsliBalance: number; fsliCode?: string }
export interface SignificantAccount { name: string; balance: number; fsliCode?: string; isQuantitative: boolean; assignedDepartmentIds: string[] }
export function aggregateFsliBalances(rows: readonly FsliRow[], pmValue: number): SignificantAccount[];
// → replaces migration.ts:69-105 (no Map/parseFloat inline in the handler)

// worker/services/period-rollover.ts (port + adapter)
export interface YearCloneStore {
  selectBpmDiagrams(orgId: string, year: number): Promise<BpmDiagramRow[]>;
  insertBpmDiagrams(rows: BpmDiagramRow[]): Promise<void>;
  /* … one method per artefact pair; same shape as DeficiencyTriggerStore */
}
export interface PeriodRolloverDeps { store: YearCloneStore; now?: () => Date }
export function planRollover(input: { sourceYear: number; targetYear: number; force: boolean; existingTarget: boolean }):
  { ok: true } | { ok: false; code: 'ROLLOVER_SAME_YEAR' | 'ROLLOVER_TARGET_DIRTY' | 'ROLLOVER_BAD_YEAR'; message: string; status: number };
export function cloneYear(deps: PeriodRolloverDeps, target: { orgId: string; userId: string; sourceYear: number; targetYear: number }): Promise<{ diagrams: number; risks: number; controls: number }>;
```
**Not in the interface:** drizzle, `c.req`, Hono, audit-log writes, notification dispatch.
Route barrels own those.

**Route split (byte-identical URLs).**
`worker/routes/migration/finalize.ts` + `worker/routes/migration/rollover.ts` +
barrel `worker/routes/migration.ts` mounting both via `.route('/', subApp)`.
`default export` name and mount in `worker/app.ts:382` unchanged.
URLs must remain `POST /migration/finalize`, `POST /migration/rollover`.

**Blast radius.** `worker/app.ts:382` (import unchanged); route-lock
`worker/routes/__tests__/migration.test.ts:18-19` (URL list unchanged, may need the
`GET`-style assert only); `scripts/check-api-contract.mjs` `ALLOWLIST` is empty, so
byte-identical paths are mandatory. Add `rbac(['Line 2','Admin'])` to `rollover`
(behaviour change — needs sign-off; it is the only unguarded tenant-wide destructive route).

**Test plan.** New `shared/scoping-materiality.test.ts` (aggregation, PM threshold
boundary `>=`, fsliBalance-preferred-over-balance rule), plus
`worker/services/__tests__/period-rollover.test.ts` with the in-memory store asserting
plan reason codes and one-clone-per-artefact counts. **Delete:** nothing to delete
cleanly (no tests exist for either path today) — but any new shallow
`migration` handler test must not re-assert the aggregation arithmetic.

**Risk:** medium (rollover touches many tables; `force` semantics + new rbac are
behaviour changes) — split the PR: (1) route split + pure aggregation + rbac on
rollover; (2) clone seam extraction.
**Expected LOC delta:** `migration.ts` 505 → ~14 (barrel) + ~120 + ~90; new pure
module ~60; net new code roughly flat; `scoping-service.ts` shrinks by ~100 if
`carryForward` delegates to `cloneYear`.
**Confidence:** verified by reading code.

---

## C2 — `users.ts`: route barrel + a second webhook payload builder

**Files (non-empty LOC now):** `worker/routes/users.ts` **471** (`: any` 10, non-null `!` 8);
duplicated payload shapes in `worker/services/notifications/slack-adapter.ts` 59,
`teams-adapter.ts` 46, `generic-webhook-adapter.ts` 38.

**Tangle evidence**
- God route barrel: profile, user admin, departments, org settings, notification prefs and
  dev tools in one 471-LOC file — exceeds the 400 soft limit and the route-split pattern
  in AGENTS.md:112 is not applied.
- `POST /settings/test-webhook` (`users.ts:320-396`) re-implements the Slack
  Block Kit, Teams MessageCard and generic JSON bodies inline — the *same* three payload
  shapes the adapters already own (`slack-adapter.ts:18-59`,
  `teams-adapter.ts:31-44`, `generic-webhook-adapter.ts:17-36`). Six payload builders for
  three shapes; the route copies are untested (only the adapters have
  `src/test/notification-adapters.test.ts`).
- `POST /settings/test-email` inlines a 25-line HTML template in the handler (`:293-318`).
- `assertDevAllowed(c: any)` / `assertConfirmToken(c: any)` (`:463`, `:469`) plus six
  `c.req.json<any>()` are the file's `any` budget; `c.req.param('id')!` ×3 are the `!` budget.
- `POST /dev/purge-all` runs 23 raw `db.execute(sql\`DELETE FROM …\`)` statements with no
  transaction (`:498-520`) — a mid-list failure leaves a half-purged tenant.

**Deletion test.** Delete the inlined builders and the three shapes must be re-derived
by every new provider-test path; delete the barrel and six unrelated sub-domains collapse
back into one file. The adapters are the second caller that justifies the shared builder
(DEEPENING "two adapters = real seam").

**Dependency category.** Payload builders + split → **in-process** (pure
`buildXPayload(payload) → unknown`, no fetch, no DB). SMTP HTML → in-process template
function. Dev purge → local-substitutable (needs the mocked drizzle chain that
`users.test.ts` already uses).

**Proposed narrow interface**
```ts
// worker/services/notifications/payloads.ts (pure, single-sourced)
export interface WebhookTestInput { title: string; message: string; type?: string; link?: string; appUrl: string }
export function buildSlackPayload(input: WebhookTestInput): Record<string, unknown>;
export function buildTeamsPayload(input: WebhookTestInput): Record<string, unknown>;
export function buildGenericWebhookPayload(input: WebhookTestInput): Record<string, unknown>;
export function buildTestWebhookPayload(provider: 'slack' | 'msTeams' | 'generic', input: WebhookTestInput): Record<string, unknown>;
```
**Not in the interface:** `fetch`, `response.ok` mapping (stays in the route/adapters),
`c.env`, theme-colour table ownership beyond the payload (keep `themeColor` in the builder
so Teams tone cannot drift).

**Route split (byte-identical URLs).**
`worker/routes/users/profile.ts` (`/user/me`, `/user/preferences`, `/user/profile`),
`worker/routes/users/user-admin.ts` (`/users*`), `worker/routes/users/departments.ts`,
`worker/routes/users/settings.ts` (`/settings`, `/settings/test-email`, `/settings/test-webhook`),
`worker/routes/users/notification-preferences.ts` (`/users/me/notification-preferences`),
`worker/routes/users/dev-tools.ts` (`/dev/*`, keeping `assertDevAllowed`/`assertConfirmToken`),
barrel `worker/routes/users.ts`. All 21 URLs in `users.test.ts:149-170` stay byte-identical.

**Blast radius.** `worker/app.ts:377` (barrel import unchanged); route-lock
`worker/routes/__tests__/users.test.ts:142-171` (21 URL assertions at `:149-169`); `src/test/notification-adapters.test.ts`
(payload-shape assertions may move to the new builder test). Every split file must stay
≤350 LOC.

**Test plan.** New `worker/services/notifications/__tests__/payloads.test.ts` asserting
the three literal shapes (`'@type': 'MessageCard'`, `'@context'`, slack `blocks[0].text.type`,
generic `event: 'icofr.webhook.test'` vs `icofr.notification`), and that
`buildTestWebhookPayload` output equals the adapter builder for the same input.
**Delete:** the inline per-provider assertions duplicated in the adapters' test if they
recomputed the payload the same way (replace-don't-layer).

**Risk:** low (mechanical split + pure extraction), medium only if the rbac set per
sub-app is tightened in the same PR — keep that separate.
**Expected LOC delta:** `users.ts` 471 → ~16 barrel + 6 files ≤150 each; builders ~70 new.
**Confidence:** verified by reading code.

---

## C3 — `bpm.ts`: OCR prompt/schema/repair inline + a mutating `all` endpoint

**Files (non-empty LOC now):** `worker/routes/bpm.ts` **379** (`: any` 7, non-null `!` 30);
node-type literals also live in `shared/types/rcm-bpm.ts:54`,
`src/components/rcm/editor/ocr/ocr-shape-badges.ts:29-72`, `src/utils/bpm-constants.ts`.

**Tangle evidence**
- ~70-line LLM prompt (`systemInstruction`, `bpm.ts:119-187`), a hand-written
  `responseSchema` (`:207-261`) and a 3-stage JSON parse/repair fallback
  (`:270-297`) all sit inside the route handler. Nothing here is reachable by a test.
- The OCR node-type `enum` (`:218-226`) is a **fifth copy** of the node-type literal set
  whose source of truth is `BPMNode['type']` (`shared/types/rcm-bpm.ts:52-54`) — a
  hand-copied literal list that has **already drifted**: the OCR enum omits
  `system`, `risk`, `control`, `docked-risk`, `docked-control`, `off-page-ref`, each of
  which the editor (`src/components/rcm/editor/bpm-canvas-types.ts`, `BPMShapePalette.tsx`)
  supports. This is precisely the class CODING_STANDARDS §"Seam codes are produced once"
  forbids, and it is live drift today, not a hypothetical.
- `bpm.all('/bpm-diagrams/cleanup-flow-prefix', …)` (`:27`) accepts **GET** and mutates
  (`cleanupFlowPrefixes` renames every `Flow: `-prefixed diagram) with **no `rbac`** and no
  confirm token — AGENTS.md §9 "GET mutating" violation.
- Ad-hoc error shapes: `c.json({ success: false, error: 'Year parameter is required' }, 400)`
  (`:322`) instead of `bad(...)`; `catch (e: any) { return bad(c, e.message) }` x3
  (`:353-355`, `:378-379`, `:392-393`) forwarding raw thrown strings (some Indonesian,
  from `bpm-service.ts`).

**Deletion test.** Delete the inline prompt/schema/parse and every future BPM-OCR caller
(the editor's diagram import, the `/csa` sample screenshot path if added) re-pastes the
same prompt and 34-entry enum; delete the OCR enum copy and the drift risk vanishes only
if the schema derives from the shared union.

**Dependency category.** Prompt + schema + `parseOcrResult(raw)` → **in-process**
(pure string → `{nodes, edges}`), testable with **no DB and no API key**. The LLM call is
**true-external**: `AIService` is already injected (`AIService({...})` at `:111`), so the
new module takes the generator as a parameter and tests pass a stub.

**Proposed narrow interface**
```ts
// worker/services/bpm/bpm-ocr.ts
// shared/types/rcm-bpm.ts gains a named export: `export const BPM_NODE_TYPES = [...] as const satisfies readonly BPMNode['type'][]`
// and `export type BpmNodeType = BPMNode['type']`.
import type { BpmNodeType } from '@shared/types';
export const OCR_EXCLUDED_NODE_TYPES: readonly BpmNodeType[] = ['system', 'risk', 'control', 'docked-risk', 'docked-control', 'off-page-ref'];
export const BPM_OCR_SYSTEM_INSTRUCTION: string;                     // pure constant
export const BPM_OCR_RESPONSE_SCHEMA: object;                        // enum derived from BPM_NODE_TYPES
export interface OcrDiagram { nodes: Array<{ id: string; type: BpmNodeType; label: string; position: { x: number; y: number }; parentId?: string }>; edges: Array<{ id: string; source: string; target: string; label?: string }> }
export function parseOcrResult(raw: string): OcrDiagram;             // encapsulate the jsonrepair + truncate fallbacks
export async function extractDiagramFromImage(generate: ChatGenerate, image: string): Promise<OcrDiagram>;
```
**Not in the interface:** Hono context, `GEMINI_API_KEY` guard (stays in the route),
`console.error` logging, the `bad(c, …)` mapping.
`parseOcrResult` throws a typed `AppError('BPM_OCR_UNPARSEABLE', …, 502)`.
The 6 previously-omitted types are documented as an explicit exclusion list so the
**intentional** difference is stated once instead of being an invisible omission.

**Blast radius.** `worker/routes/bpm.ts` only (OCR handler). Route-lock
`worker/routes/__tests__/bpm.test.ts` must keep `POST /bpm-diagrams/ocr` and should add
the corrected method for cleanup (`POST /bpm-diagrams/cleanup-flow-prefix`) — **that is a
URL/method change** (`.all` → `.post`), so it needs a client-call audit
(`grep` for `cleanup-flow-prefix` in `src/`) before it lands.
`check-api-contract` ALLOWLIST is empty: if the client calls it with GET today, changing
the verb breaks the contract gate.

**Test plan.** New `worker/services/bpm/__tests__/bpm-ocr.test.ts`: valid JSON; fenced
```json block; mid-token truncation repaired by the fallback; non-object repaired to
`{nodes:[],edges:[]}`; unknown node type rejected or coerced (decide once and lock it);
`BPM_OCR_RESPONSE_SCHEMA.enum` parity with `BPM_NODE_TYPES` minus the declared exclusions
(this assertion fails today — it locks the 6-member drift shut).
**Delete:** nothing today (route handler has no test) — do **not** add a
prompt-string snapshot test (implementation-coupled).

**Risk:** medium (prompt text must stay byte-identical for model behaviour; the
`.all` → `.post` verb change is contract-visible).
**Expected LOC delta:** `bpm.ts` 379 → ~250 (a real shrink under the 400 line even
before a split); new module ~200 (split prompt constant into
`bpm-ocr-prompt.ts` if it exceeds 350).
**Confidence:** verified by reading code.

---

## C4 — Materiality-simulation lifecycle: parallel status machine vs the canonical table

**Files (non-empty LOC now):** `worker/routes/scoping/scoping-simulation-lifecycle.ts` **196**
(`as never` 3, `!` 3); `worker/routes/scoping/scoping-simulations.ts` **176** (`as never` 6);
canonical owner `shared/workflow-transitions.ts` **275**.

**Tangle evidence**
- `POST /simulations/:id/approve` re-implements a role×status transition decision inline,
  untested (`scoping-simulation-lifecycle.ts:61-68`):
  ```ts
  if (userRole === 'CFO' && sim.status === 'Pending CFO') nextStatus = 'Pending Komut';
  else if (userRole === 'Commissioner' && sim.status === 'Pending Komut') nextStatus = 'Approved';
  else if (userRole === 'Admin') nextStatus = sim.status === 'Pending CFO' ? 'Pending Komut' : 'Approved';
  ```
  `shared/workflow-transitions.ts:74-98` already declares the SCOPING table
  (`Pending CFO --Review--> Pending Komut --Approve--> Approved`), with
  `requiredRole` and `for`-entity view. The route's machine is a **parallel taxonomy**
  (it uses `Approve`/`Reject` where the table uses `Review`/`Approve`) — the exact drift
  CODING_STANDARDS §"Seam codes are produced once" and the `workflowStatusesFor` coverage
  test exist to prevent.
- `as never` type-suppression casts (AGENTS.md §9 explicitly bans them):
  `scoping-simulations.ts:90,97,99,102,135,143`; `scoping-simulation-lifecycle.ts:84,140,191`.
- `POST /simulations/:id/reject` duplicates the history-entry shape and target-status
  choice inline (`:108-158`).
- Non-null `sim.createdBy!` (`:51`, `:98`, `:148`) on a DB row.

**Deletion test.** Delete the inline machine and the transition decision reappears in
every scoping lifecycle writer (`approve`, `reject`, `request-deletion`, `/workflow`,
`submitSimulation` in `scoping-service.ts:21-71`) — i.e. it must be re-derived once per
entry point. The canonical table already pays for it once.

**Dependency category.** **In-process** (pure decision over `(status, role, action)`),
testable with **no Postgres**. The handler then persists via the existing drizzle calls.

**Proposed narrow interface**
```ts
// shared/scoping-simulation-status.ts  (pure; imports the canonical table)
import type { UserRole, SimulationStatus } from './types';
export interface ApprovalOutcome { nextStatus: SimulationStatus; historyAction: 'Approve' | 'Reject' | 'Request Deletion' }
export function decideSimulationApproval(input: { status: SimulationStatus; role: UserRole }):
  { ok: true; nextStatus: SimulationStatus }
  | { ok: false; code: 'SIMULATION_APPROVAL_INVALID_ACTION' | 'SIMULATION_APPROVAL_FORBIDDEN'; message: string; status: number };
export function isDeletionApproval(status: SimulationStatus): boolean;
```
Alternative (preferred if acceptable): express the CFO/Komut steps as `Review`/`Approve`
rows inside `WORKFLOW_TRANSITION_RULES.SCOPING` and have the handler call
`decideTransition({ entityType: 'SCOPING', … })` — one table, zero new modules.
**Not in the interface:** notification send, audit write, `invalidateAiCachesForOrg`,
`as never` casts (cast the literal once at the drizzle boundary with a domain type instead).

**Blast radius.** `worker/routes/scoping/scoping-simulation-lifecycle.ts` (approve/reject),
`worker/routes/scoping/scoping-simulations.ts` (remove `as never`),
`worker/services/scoping-service.ts:21-71` (submit sets `Pending CFO`),
route-lock `worker/routes/__tests__/scoping.test.ts:24-27` (URLs unchanged),
client blueprint users of `forEntity('SCOPING', …)` (must not observe a changed table).
`shared/workflow-transitions.test.ts` (275-LOC module's test) gains SCOPING assertions.

**Test plan.** New `shared/scoping-simulation-status.test.ts` (CFO/Komut/Admin matrix,
illegal status → typed code, deletion path) — or extend `shared/workflow-transitions.test.ts`
if the table route is chosen. **Delete:** any test that recomputes `nextStatus` the way the
handler did (there is none today; keep it that way).

**Risk:** low–medium (transition semantics are regulatory; the Admin branch
`Pending CFO → Pending Komut` must be preserved, and the table's `Review`/`Approve`
vocabulary must be mapped explicitly rather than silently renamed).
**Expected LOC delta:** lifecycle 196 → ~150; simulations 176 → ~165 (cast removal only);
new pure module ≤60.
**Confidence:** verified by reading code.

---

## C5 — Deficiency summary / effectiveness: same conclusion produced server- and client-side

**Files (non-empty LOC now):** `worker/routes/reporting.ts` **117** (`: any` 10);
client twin `src/components/reports/regulatory/lampiran11-helpers.ts` **31**
(has `regulatory-helpers.test.ts`).

**Tangle evidence**
- `GET /reports/summary` computes severity/status tallies and an effectiveness value inline
  with `any`-typed filters (`reporting.ts:26-41`):
  ```ts
  const effectiveness = hasMaterialWeakness ? 0 : 100; // Simplified logic for summary
  ```
- The client already owns a tested version of that conclusion:
  `summarizeEffectiveness(items)` (`lampiran11-helpers.ts:13-27`) returns `mwCount/sdCount/cdCount/isEffective`
  with `isEffective: mwCount === 0`. Two owners, two encodings (`0|100` number vs
  `isEffective` boolean), no shared module → the class CODING_STANDARDS calls out
  ("Normalizers … single-sourced like codes").
- `ReportsPage.tsx:102` then re-filters `deficienciesBySeverity` for MW on the client —
  a third place re-deriving the same severity classification.

**Deletion test.** Delete the server aggregation and each consumer (reports page, Lampiran 11
report, DoD report) re-filters the raw severity strings; delete the client helper and the
regulatory conclusion is re-derived from the server's opaque `0|100`.

**Dependency category.** **In-process** (pure array → counts), testable with **no Postgres**
by passing deficiency rows. The route keeps the drizzle read.

**Proposed narrow interface**
```ts
// shared/deficiency-summary.ts  (consumed by worker route AND client helper)
import type { Deficiency, DeficiencySeverity } from './types';
export interface DeficiencySummary {
  bySeverity: Array<{ name: DeficiencySeverity; count: number }>;
  byStatus: Array<{ name: string; count: number }>;
  openCount: number;
  mwCount: number;
  isEffective: boolean;   // single meaning: no Material Weakness
}
export function summarizeDeficiencies(items: readonly Pick<Deficiency, 'severity' | 'status'>[]): DeficiencySummary;
```
**Not in the interface:** HTTP shape, `totalControls`/`totalRcm` counts (stay in the route),
drizzle, and any `0|100` percentage encoding (if the UI needs a number it derives it from
`isEffective` in one place).
`src/components/reports/regulatory/lampiran11-helpers.ts` re-exports/uses
`summarizeDeficiencies` so there is one owner.

**Blast radius.** `worker/routes/reporting.ts` (summary handler);
`src/components/reports/regulatory/lampiran11-helpers.ts` + its test;
`src/pages/reports/ReportsPage.tsx:102`; route-lock
`worker/routes/__tests__/reporting.test.ts:18` (`GET /reports/summary` unchanged).
The response field `effectiveness` is client-visible — keep it or add
`effective: boolean` alongside for one release.

**Test plan.** New `shared/deficiency-summary.test.ts` (MW present/absent, empty list,
SD-not-MW is effective, status tallies). **Delete:** the client's duplicate
count-derivation assertions in `regulatory-helpers.test.ts` that recompute what the shared
function now owns (keep the `isAssessmentSigned` test).

**Risk:** low. **Expected LOC delta:** `reporting.ts` 117 → ~95; new module ~45;
client helper −15. **Confidence:** verified by reading code.

---

## C6 — `bpm-service.ts` (559): name-match normalizer ×4, `throw new Error`, non-atomic cascade

**Files (non-empty LOC now):** `worker/services/bpm-service.ts` **559** (`: any` 8);
helpers already exist at `worker/services/bpm/{bpm-utils,bpm-sync,bpm-hydrator}.ts`
(9 / 317 / 80).

**Tangle evidence**
- Grandfathered god file, 559 LOC (>soft 400), 8 `any` (`body: any` at `:77`, `:106`,
  `:189`; `updateData: any` at `:456`; `(diag.nodes as any[])` at `:45`, `:307`;
  `let diag: any` at `:263`).
- The sub-process name normalizer is copy-pasted four times as raw SQL —
  `:53`, `:128`, `:594`, `:604`:
  `` sql`TRIM(LOWER(${bpmProcesses.name})) = TRIM(LOWER(${diag.subProcess}))` ``
  (plus `scripts/repair-bpm-sync.ts:57`): a second normalizer with no owner, exactly the
  `textOf ×3` pattern CODING_STANDARDS §"Normalizers are single-sourced" burned down.
- Validation is thrown as bare strings, and three of them are **user-facing Indonesian
  text** (`:475`, `:499`, `:504`, `:507`, `:516`, `:572`) surfaced verbatim by
  `bpm.ts:353-393` via `bad(c, e.message)` — string-match/`AppError` violation, and not
  localized.
- Non-atomic multi-step writes: `deleteProcess` performs 6 mutations with no transaction
  (`:614-626`), `deleteDiagram` 3 (`:216-226`), `batchReorganizeProcesses` 2 updates + an
  audit write with no transaction (`:519-536`). A failure between the `controls`
  null-out and the `bpmProcesses` delete leaves dangling rows.
- Shallow mirror tests already lock *call order* rather than behaviour:
  `src/test/bpm-service-cascade-delete.test.ts:38-39` asserts
  `toHaveBeenNthCalledWith(1, bpmNodeRcms)`.

**Deletion test.** Delete `BpmService` and its read/aggregate logic reappears in the route
handlers (`bpm.ts` constructs it per request) — but the *earning-its-keep* parts are the
child-count rollup (`:360-380`), the reorganize decision (`:488-573`) and the name
matching. Those are what a seam should expose; the pass-through selects should not grow.

**Dependency category.** Child-count rollup + reorganize decision + name matcher →
**in-process** (pure / SQL-chunk builder), testable with **no DB**; use drizzle's
`sql` + `.toSQL()` or assert the returned decision, never a live query.
`deleteProcess` cascade stays **local-substitutable** via the existing mocked-drizzle test
style, or is wrapped in a `store` port.

**Proposed narrow interface**
```ts
// worker/services/bpm/bpm-match.ts
export function normalizeProcessName(value: string): string;                 // single owner of trim+lower
export function sameSubProcess(column: PgColumn, value: string): SQL;        // replaces the 4 copies

// worker/services/bpm/bpm-process-hierarchy.ts
export interface ProcessRow { id: string; parentId: string | null; riskCount: number | null; controlCount: number | null }
export function rollupChildCounts(rows: readonly ProcessRow[]): Map<string, { risks: number; controls: number }>;  // bpm-service.ts:360-380
export type ReorganizeAction = 'demote' | 'promote';
export function planReorganize(input: { action: ReorganizeAction; targetParentId?: string; processIds: readonly string[]; targetExists: boolean }):
  { ok: true; action: ReorganizeAction } | { ok: false; code: 'BPM_REORGANIZE_EMPTY' | 'BPM_DEMOTE_TARGET_REQUIRED' | 'BPM_SELF_PARENT' | 'BPM_TARGET_NOT_FOUND' | 'BPM_ACTION_INVALID'; message: string; status: number };
```
**Not in the interface:** drizzle reads/writes, `AuditService`, `BpmSyncManager`,
`BpmHydrator`, the audit-description prose. `updateProcess`'s unique-code check keeps its
`AppError('BPM_CODE_TAKEN', …, 409)`.

**Blast radius.** `worker/routes/bpm.ts:350-395` (three `bad(c, e.message)` sites become
`AppError` propagation through `app.onError`, which already maps `status`+`code` —
`app.ts:332-348`); route-lock `worker/routes/__tests__/bpm.test.ts` (URLs unchanged);
`src/test/bpm-service-cascade-delete.test.ts` and
`src/test/bpm-hierarchy-and-reorganize.test.ts` (reorganize assertions move to the pure
module). Touching this file must **shrink** it (LOC gate grandfather rule) — nothing may
be added before ≥1 module is extracted.

**Test plan.** New `worker/services/bpm/__tests__/bpm-process-hierarchy.test.ts`
(rollup with/without children, demote/promote matrix, each reason code) and
`bpm-match.test.ts` (case/whitespace equivalence on aliased input — the CODING_STANDARDS
"assert identical output on aliased input" rule). **Delete:** the mock-order assertions in
`bpm-service-cascade-delete.test.ts` that encode implementation sequencing rather than
observation; replace with cascade-outcome assertions once a store port exists (phase 2).

**Risk:** medium. `updateDiagram` is the write path for the editor and the cascade is
sequence-sensitive; do the extraction in two PRs (pure helpers first, port second).
**Expected LOC delta:** `bpm-service.ts` 559 → ~430 in PR 1, → ~300 after the port;
new modules ~90 + ~60.
**Confidence:** verified by reading code.

---

## C7 — `rcm-matrix-service.ts`: three near-identical matrix read queries

**Files (non-empty LOC now):** `worker/services/rcm-matrix-service.ts` **327**
(0 `any` — the write seams are already clean, see `rcm-matrix-write.ts` / `rcm-matrix-drizzle.ts`).

**Tangle evidence.** `getTlcMatrix` (`:71-162`), `getElcMatrix` (`:164-235`) and
`getItgcMatrix` (`:237-295`) repeat the same select shape — the same ~20 columns
(`ipoC..assertionPd`, `controlType`, `frequency`, `isKeyControl`, …) and the same
`from(rcmControls).innerJoin(rcms).innerJoin(controls).leftJoin(bpmNodeRcms)
.leftJoin(bpmDiagrams).leftJoin(parentProcess)` graph — three times. Only the level
condition and the projection tail differ. The `subProcessName` CASE and the
`COALESCE(parent, self, rcms.process)` pairs are duplicated verbatim
(`:81-89` vs `:180-186` vs `:254-260`).

**Deletion test.** Delete one getter and its column list + join graph must be re-written;
a new level (e.g. a future "TLC-EUC") copies the block a fourth time.

**Dependency category.** **Local-substitutable.** The seam executes SQL against Postgres;
the repo has no in-suite PGlite harness, so a *pure builder* is the compatible shape:
`buildMatrixSelect(db, { level, withDeficiencyAssertions })` returns the drizzle query
object and can be asserted via `.toSQL()` (dialect + sql text) with **no DB**; the row
behaviour keeps the existing mocked-drizzle route test style.

**Proposed narrow interface**
```ts
// worker/services/rcm-matrix-select.ts
export interface MatrixReadSpec { level: 'TLC' | 'ELC' | 'ITGC'; withDeficiencyAssertions: boolean; withCoso: boolean; withItgc: boolean }
export function buildMatrixQuery(db: DrizzleDb, spec: MatrixReadSpec): MatrixQuery;   // returns the .from(...).leftJoin(...) chain
export function matrixConditions(orgId: string, filters: { level: string; year?: string; bpmProcessId?: string; noGL?: string }): SQL[];  // matrix-service.ts:145-156 / 167-171 / 240-245
```
**Not in the interface:** `attachTods`, `orgMeta`, `applyAssertionFallback`,
`getCosoComponent`, the projection maps — those stay in the service.

**Blast radius.** `worker/services/rcm-matrix-service.ts` only (read methods);
`worker/routes/rcm/rcm-matrix.ts` untouched; route-lock
`worker/routes/__tests__/rcm.test.ts:34-38` unchanged. Behaviour must be byte-identical —
`getItgcMatrix` legitimately joins `bpmProcesses` only through `parentProcess`, so the
builder must model that asymmetry as a flag, not "unify" it away.

**Test plan.** New `worker/services/__tests__/rcm-matrix-select.test.ts` asserting
`buildMatrixQuery(...).toSQL()` contains the expected joins for each level and that the
TLC variant alone carries the `accountAssertions` join. **Delete:** nothing
(no read tests exist); do not add an SQL-text snapshot for the whole statement — assert
the distinguishing joins only.

**Risk:** medium (silent result-set drift on a compliance-critical matrix; must keep the
`noGL` suffix `LIKE`/jsonb `?` behaviour from ADR-0003 untouched).
**Expected LOC delta:** 327 → ~230; new module ~110.
**Confidence:** verified by reading code.

---

## C8 — `infrastructure.ts`: duplicated SOC evaluation write + route barrel

**Files (non-empty LOC now):** `worker/routes/infrastructure.ts` **295** (`: any` 1 at `:51`).

**Tangle evidence.** `POST /soc-reports/:id/evaluate` (`:297-321`) and
`POST /soc-evaluations` (`:323-346`) are byte-near-identical inserts of the same
7-attribute shape (`attrA..attrG`, `auditorOpinion`, `evaluatedAt`) differing only in how
`socReportId` is obtained — one rule (`?? false`) copy-pasted twice.
`PATCH /applications/:id` hand-rolls a 10-branch allow-list (`:51-61`) while the repo
already has a config-driven field-map precedent (`CONTROL_FIELDS_MAP` in
`rcm-matrix-projection.ts`). `/applications/:id/controls` classifies legacy rows with an
inline predicate (`:232-233`) that duplicates the client's level/prefix logic.

**Deletion test.** Delete the second SOC insert and the attribute list must be re-typed
where a SOC report is evaluated from the SOC Monitoring page.

**Dependency category.** Attribute-normalizer + allow-list → **in-process**; the inserts
stay local-substitutable via the existing `infrastructure.test.ts` style.

**Proposed narrow interface**
```ts
// worker/services/soc-evaluation.ts (pure)
export interface SocAttributeInput { attrA?: unknown; /* …G */ auditorOpinion?: unknown }
export function normalizeSocEvaluation(input: SocAttributeInput): { attrA: boolean; /* …G */ auditorOpinion: string };
export function buildSocEvaluationRow(input: { id: string; organizationId: string; socReportId: string; evaluatedBy: string; body: SocAttributeInput; now: Date }): SocEvaluationInsert;
```
**Not in the interface:** `crypto.randomUUID`, route params, response shape.

**Route split (byte-identical URLs).** `worker/routes/infrastructure/applications.ts`
(apps + documents + controls), `…/vendors-soc.ts` (vendors, soc-reports, soc-evaluations),
barrel `worker/routes/infrastructure.ts`. URLs in
`worker/routes/__tests__/infrastructure.test.ts` (incl. `POST /soc-evaluations`, `:31`)
stay byte-identical.

**Blast radius.** `worker/app.ts:378`; `infrastructure.test.ts`;
`src/pages/rcm/SOCMonitoringPage.tsx` consumers (response shape unchanged).
**Test plan.** New `worker/services/__tests__/soc-evaluation.test.ts` (defaults for missing
attrs, string opinion passes through, unknown keys ignored). **Delete:** none.
**Risk:** low. **Expected LOC delta:** 295 → ~12 barrel + 2 files ~140/60; new module ~40.
**Confidence:** verified by reading code.

---

## C9 — `csa-samples-testing.ts`: two create-test endpoints over one seam

**Files (non-empty LOC now):** `worker/routes/csa/csa-samples-testing.ts` **238** (`: any` 3);
seam already exists at `worker/services/csa-verdict.ts` **138** (uses `@shared/testing-decision`).

**Tangle evidence.** `POST /tests` (`:149-228`) and `POST /csa/testing-records`
(`:244-280`) both: fetch the control, run a decision
(`decideTestSubmission` vs `decideTestingRecord`), guard on `!decision.isValid`, insert a
`testRecords` row, and differ only in field breadth + the TOD deficiency trigger. The
insert-row literal is written twice (`:177-197` vs `:265-276`). `decideTestingRecord` is a
strict subset of `decideTestSubmission` (`csa-verdict.ts:75-104`), so one body → decision
mapping serves both. Also `POST /csa/samples/batch` does a per-sample SELECT-then
INSERT/UPDATE loop (`:42-60`) — an N+1 with no transaction.

**Deletion test.** Delete `/csa/testing-records` and the client's TOE workbench loses its
write path; delete the shared row builder and the two handlers must each keep their own
copy of the record shape (already true → the duplication is currently *paying no rent*).

**Dependency category.** Decision mapping → **in-process** (already);
row building → **in-process**; the batch upsert loop → local-substitutable.

**Proposed narrow interface**
```ts
// worker/services/csa-verdict.ts (extend the existing seam, no new module)
export interface TestingWriteInput { controlRow: RawTestingControl | null; body: TestingRecordBody & { testType?: unknown; comments?: unknown; period?: unknown; samples?: unknown } }
export function decideTestingWrite(input: TestingWriteInput): { ok: true; verdict: TestingVerdict; testType: 'TOD' | 'TOE' } | { ok: false; code: 'TEST_SAMPLE_BELOW_TABLE22' };
// worker/services/csa-test-record.ts
export function buildTestRecordRow(input: { id: string; organizationId: string; controlId: string; testType: 'TOD'|'TOE'; period: string; verdict: TestingVerdict; testedBy: string; now: Date; body: Record<string, unknown> }): TestRecordInsert;
export function buildTestSamples(recordId: string, organizationId: string, samples: readonly unknown[], newId: () => string): TestSampleInsert[];
```
**Not in the interface:** the two route paths (both stay), the deficiency trigger call
(kept behind `triggerAuditDeficiency`), the response body, the client's legacy
`POST /tests` contract.

**Blast radius.** `csa-samples-testing.ts` only; route-lock
`worker/routes/__tests__/csa.test.ts` (URLs unchanged — both endpoints stay);
`src/test/csa-*` consumers if any assert the created record shape.
**Test plan.** Extend `worker/services/csa-verdict` tests (or add
`worker/services/__tests__/csa-test-record.test.ts`) asserting both endpoints' bodies
produce the same row for the same input, and the Table-22 rejection code. **Delete:** any
duplicate per-endpoint "invalid sample size" assertion.
**Risk:** low (keep both URLs; no client change).
**Expected LOC delta:** 238 → ~190; seam additions ~40.
**Confidence:** verified by reading code.

---

## C10 — Unguarded mutating endpoints (systemic, guardrail-shaped)

**Files (non-empty LOC now):** `worker/routes/remediation.ts` **234**,
`worker/routes/infrastructure.ts` **295**, `worker/routes/transactions.ts` **130**,
`worker/routes/bpm.ts` **379**, `worker/routes/migration.ts` **505**.

**Tangle evidence.** `rbac` is applied ad hoc; these mutating handlers have none:
`migration.ts:254` (`/migration/rollover`, tenant-wide destructive, `force` flag),
`remediation.ts:54,111,199,226` (`/actionplans`, `/aggregatedeficiencies`,
`/deficiencies/:id`), `infrastructure.ts:22,45,70,102,166,252,274,297,323`
(applications/vendors/SOC writes), `transactions.ts:45,106,136` (upload/replace/delete),
`bpm.ts:27` (`.all` → GET-mutating cleanup). RBAC middleware itself is correct
(`lib/guard.ts:10-21`); the gap is *coverage*, not the primitive.

**Deletion test.** Not a module — the leverage is a mechanical guard, not a seam.
Included because it is the highest-severity finding and it needs a guardrail
(environment idea below) rather than a per-file reminder.

**Dependency category.** n/a (route wiring).
**Proposed narrow interface.** n/a. Fix pattern: every `POST|PUT|PATCH|DELETE` route
declares `rbac([...])`; destructive non-prod-only routes reuse the existing
`assertDevAllowed`/`assertConfirmToken` pattern from `users.ts:463-474` (extract it to
`worker/lib/dev-guard.ts` — it then has **two** callers, satisfying YAGNI).

**Blast radius.** Any client call that would start receiving 403 — audit
(`grep` the `api(` call sites) before tightening. `migration/rollover` and the
`infrastructure`/`remediation` writes are the priority.
**Risk:** medium (403 regressions for legitimately-allowed roles — pick the role list from
the UI's own gating).
**Expected LOC delta:** ≤5 per route + ~25 for `dev-guard.ts`.

---

## Ranked summary

| ID | title | impact | risk | files (LOC) | new test file |
| --- | --- | --- | --- | --- | --- |
| C1 | `migration.ts` split + materiality/rollover seams | high | med | migration.ts 505, scoping-service.ts 213, scoping-snapshots.ts 129 | `shared/scoping-materiality.test.ts`, `worker/services/__tests__/period-rollover.test.ts` |
| C2 | `users.ts` split + single webhook payload builder | high | low | users.ts 471, slack/teams/generic adapters | `worker/services/notifications/__tests__/payloads.test.ts` |
| C3 | BPM OCR prompt/schema/parse seam + GET-mutating fix | high | med | bpm.ts 379 | `worker/services/bpm/__tests__/bpm-ocr.test.ts` |
| C4 | simulation lifecycle status machine → canonical table | high | low–med | scoping-simulation-lifecycle.ts 196, scoping-simulations.ts 176 | `shared/scoping-simulation-status.test.ts` |
| C5 | deficiency summary/effectiveness single-sourced | med–high | low | reporting.ts 117, lampiran11-helpers.ts 31 | `shared/deficiency-summary.test.ts` |
| C6 | `bpm-service.ts` match/hierarchy extraction + typed errors | high | med | bpm-service.ts 559 | `worker/services/bpm/__tests__/bpm-process-hierarchy.test.ts`, `bpm-match.test.ts` |
| C7 | one matrix read builder for TLC/ELC/ITGC | med | med | rcm-matrix-service.ts 327 | `worker/services/__tests__/rcm-matrix-select.test.ts` |
| C8 | infrastructure split + SOC evaluation normalizer | med | low | infrastructure.ts 295 | `worker/services/__tests__/soc-evaluation.test.ts` |
| C9 | one test-record write seam for both CSA endpoints | med | low | csa-samples-testing.ts 238, csa-verdict.ts 138 | `worker/services/__tests__/csa-test-record.test.ts` |
| C10 | rbac coverage on mutating endpoints | high | med | migration/remediation/infrastructure/transactions/bpm | `worker/routes/__tests__/*` (role 403 cases) |

Suggested PR order: **C5, C2, C4** (low risk, pure extraction, immediate drift kill) →
**C3, C1** (medium, high value) → **C6, C7** (grandfathered god files, must shrink) →
**C8, C9, C10**.

---

## Environment ideas (feed the retro step)

1. **VERB/MUTATION GATE.** Extend `eslint.config.js` `no-restricted-syntax` to flag
   Hono router calls `.all(` and `.get(` whose handler performs `db.insert/update/delete/
   execute` (the `bpm.ts:27` class), and flag any `POST|PUT|PATCH|DELETE` registration
   without `rbac(`/`assertDevAllowed(` in its argument list. Mechanical, cheap, would have
   caught C10 and half of C1.
2. **`as never` / `as unknown as` delta gate.** `scripts/check-any-delta.mjs` already
   counts `any`; extend the same regex set to the banned casts and wire it into
   `.githooks/pre-commit` + `verify.yml`. `scoping-simulations.ts` (6) and
   `scoping-simulation-lifecycle.ts` (3) would have failed on arrival (C4).
3. **LITERAL-UNION PARITY TEST.** A test that asserts every hand-copied enum in
   `worker/**` derives from its `shared/types/**` union — precedent already exists
   (`workflowStatusesFor` iterates the canonical table so "parallel taxonomies cannot
   drift", `shared/workflow-transitions.ts:274-278`). Immediate target: the OCR node-type
   enum (`bpm.ts:218-226` vs `BPMNode['type']`, `shared/types/rcm-bpm.ts:54`) — which is
   **already 6 members short** (`system`, `risk`, `control`, `docked-risk`,
   `docked-control`, `off-page-ref`), i.e. the gate catches live drift, not a hypothetical.
4. **WORKER-STRING I18N GATE.** `check:i18n` only sees `t()` and `toast.*()`. Three
   user-facing Indonesian strings are *thrown* from `bpm-service.ts` and rendered by
   `bad(c, e.message)` — add a check that `worker/**` contains no literal human-readable
   sentence outside comments/constants (or force `AppError(code, …)` with codes only).
   Catches the C6 error-shape class and enforces `AppError` vocabulary repo-wide.
5. **DUPLICATE-BODY DETECTOR (heuristic).** A review-time script that flags
   `>=N` structurally-similar blocks in `worker/**` (normalised identifier/token stream):
   would have surfaced the 3 matrix selects (C7), the 2 SOC inserts (C8), the 2 year clones
   (C1) and the 2 webhook payload sets (C2) without a human reading 300-line diffs.
6. **ROUTE-LOCK CHECKLIST CODIFICATION.** `worker/routes/__tests__/<domain>.test.ts`
   already locks URLs byte-identical; add a note in `docs/agents/guardrails.md` that a
   route split **must** also keep the barrel's `default export` name and the `app.ts`
   mount line untouched, since `check-api-contract` has an **empty** ALLOWLIST (no waiver
   path exists).
7. **LOC GATE MESSAGE.** `check:loc` prints "split in this change"; add the exact
   suggested split (barrel ≤15 LOC + ≤350 files) to the failure text so grandfather files
   (C1/C2/C6) state the target, not just the violation.

---

## Rejected / not worth it (deletion test applied)

- `shared/testing-decision.ts` (356) — already the single verdict seam with
  `csa-verdict.ts` as the only adapter; splitting fragments one test surface (the
  interface *is* the test surface).
- `worker/services/ai-service.ts` (369), `worker/services/ai/suggest-risk-controls.ts`,
  `worker/routes/ai-{suggest,docs}*`, `shared/ai-cache.ts`, `shared/suggest-guards.ts` —
  explicitly already deepened (ADR-0007) and excluded by the brief.
- `worker/services/rcm-matrix-write.ts` + `rcm-matrix-drizzle.ts` — already port + drizzle
  adapter + in-memory fake; nothing shallow left (the read side is C7).
- `worker/services/deficiency-trigger.ts` + `deficiency-service.ts` — already
  port/adapter with a fake and a typed-event seam; `eventForVerdict` is single-owner.
- `shared/workflow-transitions.ts` (275) — the canonical table; C4 *uses* it, does not
  duplicate it.
- `shared/control-linkage.ts` (349) — the shared node-walk seam consumed by
  `bpm-sync.ts`; there is no second variant to collapse.
- `worker/services/bpm/bpm-sync.ts` (317, 19 `any`) — internally dense, but it already
  delegates the node walk to `shared/control-linkage.ts`; the remaining
  `db.execute` deletes are DB-bound with one caller, so a port would be a single-adapter
  seam today (YAGNI). Fold the typed-error/`any` paydown into C6's touch.
- `worker/app.ts` (350) — license + auth middleware with `as any` casts, but it is boot
  wiring with exactly one caller; extracting it buys no test leverage (mocking Better-Auth
  is the hard part either way) and it is high-risk to touch.
- `worker/services/notifications/dispatcher.ts` (92, 4 `any`) — the `any`s are
  boundary types (`db`, `env`) on an already-tested adapter registry; tightening is a
  type-only chore under the `any`-delta gate, not a deepening.
- `worker/db/seed.ts` (167), `worker/db/wipeout-demo.ts` (142),
  `worker/scripts/backfill-csa-deficiencies.ts` (60) — ops scripts, one caller each, no
  second consumer; excluded from product seams by design.
- `worker/routes/rcm/rcm-items.ts` (84), `rcm-controls.ts` (96), `rcm/rcm-matrix.ts` (135),
  `worker/routes/csa/csa-{worklist,records,schedules}.ts`, `account-assertions.ts` (86),
  `audit.ts` (34), `license.ts` (82), `notifications.ts` (134) — thin adapters already
  under the limits; splitting them adds mount lines without removing behaviour.
- Splitting `worker/routes/bpm.ts` (379 < 400) purely for LOC — not required; only the OCR
  block (C3) is the actual tangle there.
- `worker/routes/scoping/scoping-simulation-accounts.ts` (111) and
  `worker/routes/scoping/scoping-snapshots.ts` (129) as standalone candidates — the GL
  ingestion duplication is folded into C1 (single owner there), so no separate module.
