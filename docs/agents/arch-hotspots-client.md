# Client-side architecture hot-spots (batch 7)

Scope: `src/**` plus cross-cutting `shared/**` consumed by the client.
Method: `scripts/check-loc.mjs` counting rule (non-empty lines), read-only reconnaissance on
branch `arch/deepen-7-review`. Vocabulary per `.agents/skills/codebase-design` (module,
interface, seam, adapter, depth, deletion test) and
`docs/adr/0001..0007`, `CODING_STANDARDS.md`, `AGENTS.md` §"Code Smell".

Excluded by rule (not re-proposed): everything listed as already deepened in the brief
(`csa-record-detail.ts` / `useCsaRecordDetail.ts` / `CSARecordRow|Card`, `findings-excel-export.ts`,
`scoping-materiality-view.ts` / `useScopingPage.ts`, `rcm-ingestion.ts` /
`rcm-template-downloader.ts` / `rcm-reconciliation-matcher.ts`, `shared/ai-cache.ts`,
`shared/suggest-guards.ts`, `csa-view-transition.ts`, `use-csa-worklist.ts`).

Legend: **LOC** = non-empty lines as of this reading.

---

## C1. Worksheet control-scope matcher exists three times, and its test is a copy of the implementation

**Files**

| file | LOC |
| --- | --- |
| `src/components/bpm/BPMWorksheet.tsx` | 511 |
| `src/components/bpm/BPMModal.tsx` | 279 |
| `src/components/bpm/CSAModal.tsx` | 78 |
| `src/components/bpm/__tests__/BPMModalScoping.test.ts` | test |

**Tangle evidence**

The same "which `Control[]` rows belong to this BPM process / GL / year" filter is written out
three times and once more inside the test:

- `src/components/bpm/BPMWorksheet.tsx:112-138`
- `src/components/bpm/BPMModal.tsx:112-138` (byte-identical apart from the parameter name `year` vs `workingYear`)
- `src/components/bpm/CSAModal.tsx:37-51` — **already drifted**: no year check, and Match 1/2 skip the FSLI restriction entirely:

```ts
// CSAModal.tsx:42-48  (BUG: no year guard, no fsliCodes guard)
if (bpmProcessId && c.bpmProcessId === bpmProcessId) return true;
if (targetSub && cSub === targetSub) return true;
if (!c.bpmProcessId && !cSub && c.fsliCodes?.includes(noGL)) return true;
```

`src/components/bpm/__tests__/BPMModalScoping.test.ts:48-84` re-declares `filterControls` verbatim
and then asserts against its own copy (`:86-131`), so it cannot ever disagree with
`BPMModal.tsx`. `CODING_STANDARDS.md:8-23` ("Seam codes are produced once…a test that recomputes
the expected code the way the implementation does is tautological") names this exact failure.

The three call sites are all live: `BPMModal` → `CSATabContent` (`BPMModal.tsx:266-274`,
`controls={controls || []}`), `CSAModal` → `CSATabContent` (`CSAModal.tsx:75-80`, consumed by
`src/pages/csa/components/CSAWorklistTab.tsx:185` and `src/pages/bpm/BPMPage.tsx:445`), and
`BPMWorksheet.tsx:108-140` itself. `BPMPage.tsx` imports **both** modals (lines 12-13), i.e. the
same page renders two different scopes for the same audit worksheet.

**Deletion test** — delete the shared matcher and complexity reappears at 4 seams (3 call sites +
1 test copy); that is exactly what happened: `CSAModal` already answers differently from
`BPMModal`, so a control from FY-2025 or from another GL can enter a CSA assessment that Line 2
later validates.

**Dependency category** — in-process (pure predicate over an in-memory `Control[]`). No adapter
needed; test through the module interface directly.

**Proposed narrow interface** (`shared/worksheet-control-scope.ts`, since `worker/` may later need
the same rule — current consumers are client-only, so `src/components/bpm/worksheet-control-scope.ts`
is also acceptable):

```ts
export interface WorksheetScope { bpmProcessId?: string; subProcessName?: string; noGL?: string; year?: string | number }
export function controlInWorksheetScope(c: Control, scope: WorksheetScope): boolean;
export function filterWorksheetControls(items: readonly Control[], scope: WorksheetScope): Control[];
```

Explicitly **not** in the interface: query keys, `useQuery`, query invalidation, badges, fetching,
the `enabled` flag, or the CSAModal "orphan" fallback (that variant must be modelled as an explicit
`allowOrphanFallback: boolean` option or deleted — decide in the PR and cover it with a test).

**Blast radius** — 4 files (`BPMWorksheet.tsx`, `BPMModal.tsx`, `CSAModal.tsx`, the test file).
`BPMWorksheet.tsx` is grandfathered at 511 LOC: this change must **shrink** it (the 30-line filter
leaves) and additionally extract the mobile summary card (`:374-437`, derives `code`/`name`/`type`/
`nature`/assertion count inline from `row.original as any`) plus one mutation hook, to satisfy the
soft limit honestly.

**Test plan** — new `shared/worksheet-control-scope.test.ts` (or
`src/components/bpm/__tests__/worksheet-control-scope.test.ts`) with the case table lifted from
`BPMModalScoping.test.ts:5-46` (fixtures are good) but asserting the **real** module; add cases the
copy never had: FY mismatch rejected, GL mismatch rejected when `fsliCodes` non-empty, control with
empty `fsliCodes` admitted, orphan fallback on/off. **Delete**
`src/components/bpm/__tests__/BPMModalScoping.test.ts` (replace-don't-layer). Add one wiring
assertion per view (`getAllByText` per `AGENTS.md` §Responsive Dual-Render Testing) only if the
JSX changes.

**Risk** — medium. The rule is compliance-relevant (which controls get tested), and `CSAModal`
currently behaves differently, so "correct" must be pinned by the new test rather than assumed.
**Expected LOC delta** — −40 duplicated lines, +~35 in the new module +~60 test, `BPMWorksheet`
−60..−90 net.

**Confidence** — verified by reading all four files in full.

---

## C2. `UserRole` / `UserLevel` option lists are hand-written literals; two union members are unassignable and one is written with the wrong spelling

**Files**

| file | LOC |
| --- | --- |
| `shared/types/common.ts` | union source of truth (L19-20) |
| `src/pages/admin/UserManagementPage.tsx` | 447 |
| `src/components/app-sidebar.tsx` | 361 |
| `src/pages/scoping/ApprovalPage.tsx` | 286 |

**Tangle evidence**

```ts
// shared/types/common.ts:19-20
export type UserRole  = "Line 1" | "Line 2" | "Line 3" | "Admin" | "External Auditor" | "Commissioner" | "CFO";
export type UserLevel = "Staff" | "Manager" | "Head" | "Director";
```

The admin UI writes role/level as raw strings, twice (add dialog and edit dialog):

```tsx
// UserManagementPage.tsx:259 and :414  (identical)
<SelectItem value="Komisaris">Commissioner</SelectItem>
```

- `"Komisaris"` is **not** a member of `UserRole`; the member is `"Commissioner"`. `tsc` cannot see
  it because `value` is a plain `string` prop and the write is `Object.fromEntries(new FormData(...))`
  (`:180`, `:187`, `:193`, `:200` — untyped `any` payloads).
- The backend does not validate either: `worker/routes/users.ts:108` `role: body.role || 'Line 1'`
  and `:129-130` `set({ role: body.role })` persist whatever arrived.
- `UserLevel` has `"Director"`, but the level selects offer only Staff/Manager/Head
  (`:264-273`, `:419-428`) → a Director can never be created and the edit dialog will show an empty select.
- `"External Auditor"` is likewise absent from the picker.
- The wrong spelling has already propagated: `src/components/app-sidebar.tsx:84` and `:196` gate the
  approvals entry on `role === 'Komisaris'`, and `:90` counts `Pending Komut` — while
  `src/pages/scoping/ApprovalPage.tsx:85` and `worker/routes/scoping/scoping-simulation-lifecycle.ts:64`
  use `'Commissioner'`. Real Commissioner accounts therefore never see the sidebar badge, and
  accounts created through the UI carry a value no other branch recognises. `worker/db/seed.ts:13`
  hedges with `u.role === 'Commissioner' || u.role === 'Komisaris'` — the drift is already
  acknowledged in code.

**Deletion test** — delete an option-list module and the 6 role literals + 3 level literals respawn
in 2 dialogs, plus `app-sidebar` and `field-lini1` keep their own spellings. The complexity
(union ↔ label ↔ allowed value) is real and currently spread over ≥5 files.

**Dependency category** — in-process option config (pure) + remote-owned write (`POST/PUT
/api/users` via `api()`). Config is unit-tested in-process; the route-lock suite
(`worker/routes/__tests__/users.test.ts`) already pins the transport.

**Proposed narrow interface** (`src/pages/admin/user-options.ts` — 2 callers, so a module is
justified; keep it out of `shared/` until the worker needs it):

```ts
import type { UserRole, UserLevel } from '@shared/types';
// Record<UserRole, …> => adding a union member without a label is a tsc error
export const USER_ROLE_LABELS: Record<UserRole, string>;
export const USER_LEVEL_LABELS: Record<UserLevel, string>;
export const userRoleOptions: ReadonlyArray<{ value: UserRole; label: string }>;
export const userLevelOptions: ReadonlyArray<{ value: UserLevel; label: string }>;
```

Explicitly **not** in the interface: the `<Select>` JSX, the form field wrapper, `FormData`
serialisation, or the display label language (labels stay `t()` keys / plain strings passed in by
the caller).

**Blast radius** — 3 files changed + 2 discriminant bugs fixed (`app-sidebar.tsx:84,90,196` must
switch to `'Commissioner'`; either the seed's `'Komisaris'` hedge, the ApprovalPage check, or both
survive as the single spelling). No touched file is >400 LOC. Decide and document whether existing
rows holding `'Komisaris'` are migrated (data question) — if not, the sidebar/gate checks must keep
accepting both until then, and that must be an explicit, tested decision rather than an accident.

**Test plan** — new `src/pages/admin/__tests__/user-options.test.ts`: (a) every `UserRole` value has
exactly one option, (b) every `UserLevel` value has exactly one option, (c) the option `value`
fields are a subset of the union (locks out `'Komisaris'`), (d) one integration assertion that the
add-user select renders one option per union member (the picker is the actual bug surface). Delete/
shrink nothing here — there is no existing test for this page. `src/lib/field-lini1.test.ts` stays.

**Risk** — low-medium. Low code risk, but it changes an authorization-adjacent string, so it needs
one sentence in the PR stating the accepted spelling and the treatment of existing rows.
**Expected LOC delta** — `UserManagementPage` −40/+10 (two selects collapse to `.map`), +~25 new
module, +~50 test, `app-sidebar` net 0.

**Confidence** — verified by reading `common.ts`, `UserManagementPage.tsx`, `app-sidebar.tsx`,
`ApprovalPage.tsx`, `worker/routes/users.ts`, `worker/db/seed.ts`.

---

## C3. `ReportsPage` builds the same test-result row three times, and the export/table column configs disagree

**Files**

| file | LOC |
| --- | --- |
| `src/pages/reports/ReportsPage.tsx` | 361 |
| `src/pages/testing/TestWorkbench.tsx` | 343 |
| `src/pages/testing/__tests__/` | none for `TestWorkbench` |

**Tangle evidence**

One record set (`testsData` + `controlsData` + `rcmData`) is derived in three unrelated places
inside a single file, each re-implementing the same five lookups:

```tsx
// (1) Excel rows            ReportsPage.tsx:58-75
const control = (controlsData || []).find((c) => c.id === tr.controlId);
const rcm = (rcmData || []).find((r) => r.id === (control as any)?.rcmId);
const attrCount = tr.evaluationAttributes ? Object.values(tr.evaluationAttributes).filter(Boolean).length : 0;
// (2) mobile card           :227-257   (control/rcm find again; result?green:red again)
// (3) desktop table row     :282-350   (same four expressions a third time)
```

Plus two independent filter implementations for the same list — `:107-109` (`filteredTests`) and the
inline re-filter inside the table body at `:279-281`; a change to the filter semantics silently
affects only one of them. `clamp`-style `as any` escapes at `:60`, `:64`, `:174`, `:190` are new
`any` (banned by `AGENTS.md` §`any`), and `assertion: (control?.assertions || []).join(', ')`
(a string) disagrees with the table's per-assertion badges (`:304-307`) — one dataset, two
presentations, no shared owner.

The 11-column export config (`:80-92`) and the 10 `<TableHead>` cells (`:266-275`) are also
maintained separately, and a **second** TOD/TOE export for the same data exists with a *different*
column list and filename in `src/pages/testing/TestWorkbench.tsx:93-130` (7 columns,
`TOD_TOE_Kertas_Kerja_<year>.xlsx`). Two regulatory workpaper exports of the same universe cannot
drift independently without an audit finding.

**Deletion test** — delete a `buildTestResultRows` + column-config module and the four derivations
plus the two Excel column lists reappear across 4 call sites (mobile card, desktop row, page Excel,
`TestWorkbench` Excel).

**Dependency category** — in-process (pure mapping/derivation over arrays already in scope). The
`api()` fetch stays where it is.

**Proposed narrow interface** (`src/pages/reports/testing-rows.ts`):

```ts
export interface TestingRowContext { controls: Control[]; rcms: RCM[] }
export interface TestingResultRow { no: number; process: string; control: string; assertion: string; type: TestType; method: string; criteria: string; sample: string | number; result: TestResult; notes: string; date: string }
export function buildTestingRows(tests: readonly TestRecord[], ctx: TestingRowContext, opts: { filter?: (t: TestRecord) => boolean; dateFormat: (d: number) => string }): TestingResultRow[];
export function testingColumns(t: (k: string, o?: { defaultValue?: string }) => string): ExcelColumn[];
```

Explicitly **not** in the interface: the `<Table>`/card JSX, the filter *state* (`useState` stays in
the page), `date-fns`, i18n plumbing beyond the injected `t`, or the filename/title strings.

**Blast radius** — 2 files (`ReportsPage.tsx`, `TestWorkbench.tsx`). Neither is >400 LOC, but both
must **shrink** (the page loses ~60 lines of duplicated derivation). Decide explicitly whether the
two Excel exports converge to one column set or stay separate-but-single-sourced; the PR must state
which, because auditors care.

**Test plan** — new `src/pages/reports/__tests__/testing-rows.test.ts`: assertion-count mapping
including `evaluationAttributes` absent, TOE vs TOD sample cell, control/rcm lookup on a missing
`controlId` (`'-'`/`'N/A'` fallbacks), column key order equals the header order, and the filter
predicate applied once. Add one `getAllByText`-style dual-render assertion for the card/table pair
per `AGENTS.md`. No legacy test to delete (none exists); `src/components/testing/__tests__/
testing-compliance-engine.test.ts` is a different seam and stays.

**Risk** — low-medium (pure mapping, but it feeds the regulatory workpaper; the "one export or two"
decision is the only judgement call). **Expected LOC delta** −80..−100 in the pages, +~70 module,
+~80 test.

**Confidence** — verified by reading both files; the `TestWorkbench` column-set divergence is
verified by diffing `ReportsPage.tsx:111-126` against `TestWorkbench.tsx:111-126`.

---

## C4. Money is formatted eight different ways across the client, including one locale-less grouping bug

**Files (call-site census, LOC of the container)**

| file:line | form |
| --- | --- |
| `src/components/reports/dod/dod-format.ts:1-7` (`formatIDR`, LOC 35) | `Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 })` |
| `src/components/reports/regulatory/findings-helpers.ts:14-16` (21) | `new Intl.NumberFormat('id-ID').format(v)` |
| `src/components/reports/WBSPage.tsx:42` | `Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' })` |
| `src/components/import/CrossCheckPanel.tsx:40` | `toLocaleString('id-ID', { style:'currency', currency:'IDR' })` |
| `src/components/deficiencies/DoDHeaderSummary.tsx:69` | `Intl.NumberFormat('id-ID', { currency:'IDR' })` |
| `src/components/deficiencies/DoDEvidenceContextCard.tsx:85,91` | ditto |
| `src/pages/scoping/ApprovalPage.tsx:145,146,198,202` | `Rp {x.toLocaleString('id-ID')}` |
| `src/pages/scoping/components/ScopingEditorHeader.tsx:121,134` | `Rp {x.toLocaleString('id-ID')}` |
| `src/pages/scoping/components/MaterialityParamsCard.tsx:229` | `Rp {x.toLocaleString('id-ID')}` |
| `src/components/scoping/GLDataGridColumns.tsx:194`, `GLDataGrid.tsx:261` | `x.toLocaleString('id-ID')` |
| `src/components/scoping/SetBenchmarkModal.tsx:199,220` | `Rp {x.toLocaleString('id-ID')}` |
| `src/components/scoping/ScopingHealthDashboard.tsx:68,195` | `Rp {x.toLocaleString('id-ID')}` |
| `src/components/scoping/SimulationListTable.tsx:76,135` | `Rp {x.toLocaleString('id-ID')}` |
| `src/components/scoping/SignificantLocationModal.tsx:140,207-210,244` | `toLocaleString('id-ID')` |
| `src/components/bpm/TransactionSamplingTab.tsx:202` | `Intl.NumberFormat('id-ID').format` |
| `src/components/scoping/smart-import/MaterialitySummary.tsx:24,33` | `Rp {x.toLocaleString()}` ← **no locale** |
| `src/components/scoping/smart-import/BenchmarkSelect.tsx:45,81` | `Rp {x.toLocaleString()}` ← **no locale** |

The last two drop the `id-ID` locale argument, so grouping follows the browser locale — the same OM/PM
benchmark renders `Rp 1.234.567` on one screen and `Rp 1,234,567` on another, which for an
audit-by-figures product is a defect, not a style preference. And `formatIDR` exists **already**
(`dod-format.ts:1-7`) but is scoped to the DoD report folder (2 callers, `DoDTable.tsx:115`,
`DoDMobileCards.tsx:32`) while 17 other places hand-roll their own. This is the
`CODING_STANDARDS.md:25-42` "Normalizers … are single-sourced like codes" rule applied to number
rendering: `Intl` currency vs bare grouping, dot vs comma, `,00` vs truncated.

**Deletion test** — delete a shared formatter and the locale/currency/rounding decision reappears
at 19 sites, which is precisely how `MaterialitySummary`/`BenchmarkSelect` lost their locale.

**Dependency category** — in-process (pure `Intl` formatting; Node ships full ICU in the test
runner, so results are deterministic and assertable).

**Proposed narrow interface** (`src/lib/format-money.ts` — 19 call sites, first-party):

```ts
export type MoneyStyle = 'full' | 'compact';      // 'full' = Rp 1.234.567 ; 'compact' = Rp 1,2 jt (only if a caller needs it)
export function formatIdr(value: number | null | undefined, style?: MoneyStyle): string; // ''/'-' for null
export function formatIdrPlain(value: number | null | undefined): string;               // no "Rp", id-ID grouping (table cells)
```

Explicitly **not** in the interface: the `Rp` JSX prefix stays the caller's choice only where a
prefix is already part of a layout string — better: forbid it and let `formatIdr` own the prefix so
there is exactly one owner. Not in the interface either: percent formatting (`toFixed(1)` sites are
a separate concern and are **not** part of this candidate) or Excel cell formatting.

**Blast radius** — ~14 files to touch for the *new* call sites, +1 new module. None is >400 LOC, so
no split is forced; but the PR should adopt the module in at least the two locale-less files
(the actual bug) rather than "add the module and leave the rest", otherwise the deletion test still
passes for the duplicates. Recommended split of work: (a) add module + migrate the 5 sites that use
`Intl currency` (dod-format, WBSPage, CrossCheckPanel, DoDHeaderSummary, DoDEvidenceContextCard,
findings-helpers), (b) migrate the `toLocaleString()`-without-locale pair, (c) boy-scout the
`Rp {x.toLocaleString('id-ID')}` cluster on touch.

**Test plan** — new `src/lib/__tests__/format-money.test.ts`: `formatIdr(1234567)` → `'Rp 1.234.567'`
for any ambient locale (assert after `Intl.NumberFormat` resolution, not against a hardcoded
`toLocaleString()` echo — otherwise the test becomes tautological, the C1 mistake); null/`undefined`
→ `'-'`; negative exposure values; zero. Then delete the local formatter re-implementations inside
`findings-helpers.ts:14-16` and `dod-format.ts:1-7` (replace-don't-layer) so the existing
`regulatory-helpers.test.ts:38` assertion starts asserting the shared owner.

**Risk** — low. Cosmetic/visual only, no data change; the one real bug (locale drift) is fixed
rather than preserved. **Expected LOC delta** −30..−60 duplicated lines, +~25 module, +~40 test.

**Confidence** — verified by reading `dod-format.ts`, `findings-helpers.ts` and grepping every
`Intl.NumberFormat` / `toLocaleString` occurrence in `src/**`.

---

## C5. `useCSA` writes year-scoped keys with a bare key, and a test locks the wrong behaviour

**Files**

| file | LOC |
| --- | --- |
| `src/hooks/use-csa.ts` | 334 |
| `src/components/bpm/CSATabContent.tsx` | 391 |
| `src/hooks/csa/use-evidence-upload.ts` | 141 |
| `src/hooks/use-csa.test.tsx` | test |

**Tangle evidence**

```ts
// use-csa.ts:60-66  — fetch key carries the year
queryKey: ['csa-list', bpmProcessId, year],
// use-csa.ts:213-215 and :267-269 — invalidation drops it
queryClient.invalidateQueries({ queryKey: ['csa-list'] });
queryClient.invalidateQueries({ queryKey: ['csa-worklist'] });   // CODING_STANDARDS:61 says this must carry workingYear
```

`CODING_STANDARDS.md:61-75` documents this exact anti-pattern using `csaWorklistKey(workingYear)` as
the precedent; the deepened `CSAWorklistTab` uses `['csa-worklist', workingYear]`
(`CSAWorklistTab.tsx:190`) while `use-csa.ts` busts all years. `year` is an **optional prop**
(`use-csa.ts:23,26`) rather than the store value, so a caller that omits it fetches
`/api/csa?bpmProcessId=…` with no year at all — `CSATabContent.tsx:106` happens to pass
`workingYear`, but nothing enforces it.

Worse, the existing test pins the bug in place:

```ts
// use-csa.test.tsx:85
expect(spy).toHaveBeenCalledWith({ queryKey: ['csa-worklist'] });
// and both render sites never pass year:  :61, :78  useCSA({ bpmProcessId: 'p1' })
```

Two more drifts in the same seam:

- `deleteMutation` has no `onError` (`use-csa.ts:263-271`) while `createMutation` does (`:228-234`) —
  a failed delete is silent (the missing-PUT post-mortem class, `CODING_STANDARDS.md:77-86`).
- Evidence upload exists **twice**: `use-csa.ts:237-261` compresses via
  `compressEvidenceImage` (`use-evidence-upload.ts:27-53`) and builds its own `FormData`, while
  `CSATabContent.tsx:36-62` re-declares the *same* downscaler as `maybeCompressImage` (identical
  `MAX_EDGE = 1600`, same `0.82` quality, same `.jpg` rename) — minus the
  `typeof createImageBitmap !== 'function'` guard that the original has, so the copy is the one that
  throws where canvas/`createImageBitmap` is unavailable. `CSATabContent.tsx:231` then compresses
  again before `use-csa.ts:239` compresses a second time: double work, two owners.

**Deletion test** — delete the year-aware key helpers / the duplicated compressor and complexity
reappears at 4 seams: `['csa-list']` and `['csa-worklist']` writers here, `CSAWorklistTab`,
`csa-record-detail.ts` (`saveDual`), and the compressor in `use-evidence-upload` vs here.

**Dependency category** — remote-owned (`api()` over REST) + a local-substitutable store
(`useFiscalYearStore`). Test strategy: React Query test client with a mocked `api()`, exactly the
shape `use-csa.test.tsx` already uses — assert the key tuples and the error surface through the hook.

**Proposed narrow interface** (keep it a hook, add the missing seam — no new file needed for the
keys, they belong with the other key factories):

```ts
// src/hooks/csa/csa-keys.ts  (extend the existing key-factory family next to csaWorklistKey)
export const csaListKey = (bpmProcessId: string, year: string) => ['csa-list', bpmProcessId, year] as const;
export function invalidateCsaForYear(qc: QueryClient, year: string): Promise<void>; // list + schedules + worklist, all year-scoped

// use-csa.ts — make the year non-optional in the interface
export function useCSA(props: UseCSAProps & { year: string }): UseCSA;
```

Explicitly **not** in the interface: the two view-transition effects (`csa-view-transition.ts`
already owns the decision functions), the form schema (`use-csa-form.ts` owns it), tanstack
mutation objects exposed to the view (the page keeps calling `onSaveDraft`/`onSubmit`).

**Blast radius** — 3 files (`use-csa.ts`, `CSATabContent.tsx`, `use-csa.test.tsx`) plus one new
key-factory module; `CSATabContent.tsx` (391) must lose the duplicate compressor and the
`bpmProcessId!` non-null assertion (`:102`) — `AGENTS.md:81` bans `!` on server data. No touched
file >400 LOC.

**Test plan** — rewrite `src/hooks/use-csa.test.tsx` (replace, don't layer): (a) after a successful
save, `invalidateQueries` was called with **`['csa-worklist', '2026']`** and `['csa-list', 'p1', '2026']`
(the current assertion is the thing being deleted); (b) a failed `DELETE` calls `toast.error`
(the missing `onError`); (c) the fetch URL contains `year=`. Delete the two tautological-by-omission
assertions at `:71-86`. Add `src/hooks/csa/__tests__/csa-keys.test.ts` for the tuple shape if the
factory is extracted. `use-evidence-upload.test.tsx:41` already locks the non-image passthrough and
stays.

**Risk** — medium: touching invalidation can leave the Belum-Dinilai tab stale if the year tuple is
wrong in the other direction (`docs/agents/csa-hub.md` warns exactly about this), and `useCSA` is on
the CSA hub hot path. Mitigation: land the key factory + failing-then-passing test first, keep the
prop `year` optional only for the duration of the PR.
**Expected LOC delta** −30 (`CSATabContent.tsx`), −20 (`use-csa.ts`), +~25 key module, +~40 test.

**Confidence** — verified by reading `use-csa.ts`, `CSATabContent.tsx`, `use-evidence-upload.ts`,
`use-csa.test.tsx`, `docs/agents/csa-hub.md`.

---

## C6. `SettingsPage` mirrors `useQuery` into `useState` and duplicates the webhook card three times

**Files**

| file | LOC |
| --- | --- |
| `src/pages/admin/SettingsPage.tsx` | 478 |
| `src/hooks/useUserPreferences.ts` | (pattern reference) |

**Tangle evidence**

```ts
// SettingsPage.tsx:45-51 — classic mirror server-state (AGENTS.md:82)
const [localSettings, setLocalSettings] = React.useState<Partial<Settings>>({});
React.useEffect(() => { if (settings) setLocalSettings(settings); }, [settings]);
```

Every edit then goes through an untyped `any` setter (`:53-55 handleChange(field: keyof Settings,
value: any)`), and the whole `Partial<Settings>` is PUT on save — so a stale copy of another
admin's edit is written back wholesale.

The Slack / Teams / Generic webhook cards are three copies of the same ~40-line block:

```
:335-371  Slack      (localSettings.slackEnabled / slackWebhookUrl)
:373-409  MS Teams   (localSettings.msTeamsEnabled / msTeamsWebhookUrl)
:411-447  Generic    (localSettings.genericWebhookEnabled / genericWebhookUrl)
```

`AGENTS.md:77` is explicit: "blok JSX yang diduplikasi ≥3x wajib config-driven" (the precedent is the
14× `TooltipProvider` violation). The provider union `'slack' | 'msTeams' | 'generic'` is also spelled
out twice — as the literal argument to `handleTestWebhook` at each action site and in the
`testingWebhook: string | null` state (`:58`), so a fourth provider silently gets no state handling.

**Deletion test** — delete the config array and 120 lines of duplicated JSX reappear with three
independent implementations of enable-toggle + badge + test-button; delete the draft hook and the
`useQuery → useState + useEffect` mirror returns (which is also what makes the page untestable
without a live query result).

**Dependency category** — in-process (settings draft shape + provider config) + remote-owned
(`GET/PUT /api/settings`, `POST /api/settings/test-webhook` via `api()`).

**Proposed narrow interface**

```ts
// src/pages/admin/settings-webhooks.ts
export type WebhookProvider = 'slack' | 'msTeams' | 'generic';
export interface WebhookField { provider: WebhookProvider; enabledKey: keyof Settings; urlKey: keyof Settings; titleKey: string; descKey: string; placeholderKey: string }
export const WEBHOOK_FIELDS: readonly WebhookField[];
// src/pages/admin/useSettingsDraft.ts
export function useSettingsDraft(): { draft: Partial<Settings>; isDirty: boolean; set<K extends keyof Settings>(k: K, v: Settings[K]): void; save(): void; isSaving: boolean };
```

Explicitly **not** in the interface: the `<Card>` chrome, `Switch`/`Input`/`Badge` usage, the
`testingEmail`/`testingWebhook` spinners (stay in the page), or anything about the organization
profile / key-personnel sections.

**Blast radius** — 1 file + 2 new small modules. `SettingsPage.tsx` is 478 LOC (grandfathered): this
change must **shrink** it below the trend — removing ~120 lines of duplicate JSX plus the mirror
effect does that on its own, but the PR should also split the org-profile / personnel / cycle-control
cards into their own components so the page becomes an orchestrator.
`useUserPreferences.ts` shows the existing happy path for the draft hook if the pattern is reusable.

**Test plan** — new `src/pages/admin/__tests__/settings-webhooks.test.tsx`: render the webhook
section for N providers from `WEBHOOK_FIELDS` and assert (a) one card per config entry, (b) toggling
the switch writes exactly `enabledKey` and nothing else, (c) the test button is disabled without a
URL and POSTs `{ provider, webhookUrl }` with the URL from `urlKey`. Plus
`src/pages/admin/__tests__/settings-draft.test.ts` for the draft hook (dirty flag, save payload =
draft only). No legacy test exists here, so nothing to delete; `useUserPreferences` keeps its own.

**Risk** — low (isolated admin surface), but the mirror-state removal changes save semantics
(whole-object PUT) — keep that behaviour explicitly and add an assertion so it is a decision, not a
side effect. **Expected LOC delta** `SettingsPage` −140..−170, +~40 config, +~60 hook, +~90 tests.

**Confidence** — verified by reading the file end-to-end.

---

## C7. `SOCMonitoringPage`: 513-LOC god page whose mobile card and desktop row each re-derive the same badges

**Files** — `src/pages/rcm/SOCMonitoringPage.tsx` (513, no test).

**Tangle evidence** — every status→colour decision exists twice, once per view:

```tsx
// significance badge
:130-133 (card)  app.isSignificant ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs shrink-0" : "bg-slate-50 ..."
:222-225 (row)   app.isSignificant ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs" : "bg-slate-50 ..."
// ITGC status
:143-144 (card)  Effective→green / Ineffective→red / other→muted
:280-281 (row)   same three branches, different strings
// SOC status         :409-411 (card) vs :455-457 (row)
```

plus six `useState` (`:36-41`, at the 7-cap), a mutation with no `onError` (`:51-58`,
`deleteAppMutation` — silent failure), mixed indentation, and a duplicated `Yes/No` ternary
(`:135`, `:227`). No test file exists, so none of this is locked.

**Deletion test** — delete an `application-badges.ts` and a Row/Card adapter pair and the
significance/ITGC/SOC colour matrices reappear in both views; a future status rename (`'Valid'` →
anything) drifts between the card and the table.

**Dependency category** — in-process (badge derivation) for the pure part; the page's queries stay
where they are. Presentational split is adapter-level, tested via render.

**Proposed narrow interface**

```ts
// src/pages/rcm/application-badges.ts
export function itgcStatusBadge(status: string | undefined): { label: string; className: string };
export function significanceBadge(isSignificant: boolean): { label: string; className: string };
export function socStatusBadge(status: string): { label: string; className: string };
```

Explicitly **not** in the interface: `useQuery`, the dialog open/close state (the six `useState`
stay but move behind a `useSocMonitoring()` hook), the tab markup, or the `MobileDesktopBanner`.

**Blast radius** — 1 file split into ~4 (`useSocMonitoring.ts` ≤150, `ApplicationRow.tsx`,
`ApplicationCard.tsx`, `SocReportRow/Card.tsx`) + the badge module + a test. 513 → each file ≤350.

**Test plan** — new `src/pages/rcm/__tests__/application-badges.test.ts` (all branches of the three
functions) and `src/pages/rcm/__tests__/SOCMonitoringPage.test.tsx` asserting the dual render with
`getAllByText(...)` + `toHaveLength(2)` per `AGENTS.md` §Responsive Dual-Render Testing, the empty
and loading states, and that a failed DELETE surfaces a toast. No legacy test to delete.

**Risk** — low. **Expected LOC delta** −40 duplicates, +~45 badge module, +~250 split components,
+~80 tests; `SOCMonitoringPage.tsx` drops to ≤150 (orchestrator).

**Confidence** — verified by reading the file end-to-end (badge duplication is verbatim).

---

## C8. Deficiency severity → tone / label / class exists in five modules (strictly harder second pass)

**Files** — `src/components/reports/dod/dod-format.ts` (35), `…/dod/useDoDReport.ts` (243),
`src/components/reports/regulatory/findings-helpers.ts` (21),
`…/regulatory/severity-badge.tsx` (12), `…/regulatory/lampiran11-helpers.ts` (28),
`src/components/deficiencies/DeficiencyCard.tsx` (230).

**Tangle evidence** — two identical unions and two identical functions with different names:

```ts
// dod-format.ts:9-15                          // findings-helpers.ts:18-24
export type SeverityTone = 'mw'|'sd'|'cd';     export type FindingSeverityTone = 'mw'|'sd'|'cd';
export function getSeverityTone(sev: string): SeverityTone { … }
                                               export function findingSeverityTone(severity: string|undefined): FindingSeverityTone { … }
```

…and the class strings are copy-pasted between `dod-format.ts:22,27,32` and `severity-badge.tsx:5-7`
(`'bg-red-50 text-red-700 border-red-300 font-semibold text-xs rounded-md'` appears in both, byte
for byte), while the labels disagree (`'MW (Kelemahan Material)'` vs `'MW'`). Counts of the same
three severities are recomputed in `useDoDReport.ts:175-177`, `lampiran11-helpers.ts:14-17` and
`ReportsPage.tsx:102`; the severity is branched on again in `DoDConclusionFooter.tsx:29-43`;
`DeficiencyCard.tsx:61-63` holds a fourth colour map, and `ManagementAssessment.tsx:108-115` a fifth
inline ternary.

This is *beyond* the previously deepened `findings-helpers.ts` (which only unified the
findings-module seam); the remaining multiplicity crosses three folders and is the reason
`findingSeverityTone` needed to exist in the first place.

**Deletion test** — delete `src/lib/deficiency-severity.ts` and the tone/label/class decision plus
the mw/sd/cd tally reappear in 6 modules.

**Dependency category** — in-process pure. Test directly.

**Proposed narrow interface** (`src/lib/deficiency-severity.ts`):

```ts
export type SeverityTone = 'mw' | 'sd' | 'cd';
export function severityTone(severity: string | undefined): SeverityTone;
export function severityMeta(severity: string | undefined): { tone: SeverityTone; shortLabel: 'MW'|'SD'|'CD'; longLabelKey: string; className: string };
export function countBySeverity(items: readonly { severity?: string }[]): Record<SeverityTone, number>;
export function isSignificant(severity: string | undefined): boolean; // !== 'Control Deficiency'
```

Explicitly **not** in the interface: the `ReportSeverityBadge` component (keep it a thin adapter over
`severityMeta`), the DoD box decision tree (`useDoDReport.ts:115-118`), or the conclusion switch.

**Blast radius** — 6 files; all <400 LOC. Migrate `dod-format.ts` and `findings-helpers.ts` first
(smallest), then `DeficiencyCard`/`ManagementAssessment`.

**Test plan** — new `src/lib/__tests__/deficiency-severity.test.ts` with the known-good literals from
the spec (`'Material Weakness'`→mw, `'Significant Deficiency'`→sd, `'Control Deficiency'`→cd, unknown
→cd) plus `countBySeverity` on a mixed list. Then delete the local re-implementations
(`dod-format.ts:9-35`, `findings-helpers.ts:18-24`) and keep `regulatory-helpers.test.ts:40-42`
asserting the shared owner.

**Risk** — low-medium (visual + report-facing labels; the label-string divergence must be resolved
deliberately because both strings are currently shown in different reports).
**Expected LOC delta** −60 duplicates, +~45 module, +~50 test.

**Confidence** — verified by reading the four producer modules and grepping all severity literals.

---

## C9. `CustomizableDashboard` keeps server preferences in `useState` and holds ~100 lines of untested layout algebra

**Files** — `src/components/reports/CustomizableDashboard.tsx` (488, no test).

**Tangle evidence**

```ts
// :109-115 — mirror server pref into local state
useEffect(() => { if (savedPrefs?.layout) setLayouts(savedPrefs.layout); else if (currentUser?.role) setLayouts(defaultLayouts); }, [savedPrefs, currentUser]);
```

then five handlers (`:122-220`) each re-implement the same "spread all breakpoints, recompute
`maxPrevY`, patch per-breakpoint width" algebra — `:133-149` and `:161-177` are near-identical
blocks — plus a third derivation layer inside `renderWidgetContent` (`:224-328`, 100 lines) that
re-derives `dataSource`/`vizType` from `item.i` while three module-level `getDefault*` helpers
(`:51-68`) do the same thing. Everything is `any` (`:70 defaultLayouts: any`, `:119,128,134,162,186,203,224,228,270,314`).
No test file.

**Deletion test** — delete `dashboard-layout.ts` and the widget-catalog/layout algebra reappears
inline in 5 handlers + the catalog list; delete the mirror and the "prefs arrive after first render"
race returns to every handler.

**Dependency category** — in-process (pure layout algebra) + remote-owned (`useUserPreferences`).
The algebra is unit-testable with no adapter; the mirror removal is testable through a mocked
preferences hook.

**Proposed narrow interface**

```ts
// src/components/reports/dashboard-layout.ts
export interface WidgetLayout { i: string; x: number; y: number; w: number; h: number; minW?: number; title?: string; dataSource: string; vizType: string }
export const BREAKPOINTS = ['lg','md','sm'] as const;
export function defaultLayouts(): Record<Breakpoint, WidgetLayout[]>;
export function toggleWidget(layouts: Layouts, id: string): Layouts;
export function addCustomWidget(layouts: Layouts, id: string, meta: WidgetMeta): Layouts;
export function patchWidget(layouts: Layouts, id: string, patch: Partial<WidgetLayout>): Layouts;
export function reconcileLayout(layouts: Layouts, incoming: Layouts): Layouts;
```

Explicitly **not** in the interface: React state, the preferences mutation, the grid component, or
the widget render switch (keep `renderWidgetContent` as a component map in the view).

**Blast radius** — 1 file + 1 module. 488 LOC must drop (the algebra and the `getDefault*` trio move
out; the page becomes orchestrator + config map).

**Test plan** — new `src/components/reports/__tests__/dashboard-layout.test.ts`: toggle removes from
**all** breakpoints, add appends below the lowest widget per breakpoint with `sm→6 / md→5 / lg→meta.defaultW`,
patch touches only the target id, reconcile preserves `title/dataSource/vizType` for unknown ids and
fills defaults for new ones, and `defaultLayouts()` returns fresh objects (mutation safety). Add one
render test asserting the prefs value (not the default) is rendered after a mocked `useUserPreferences`
resolves — that is the mirror-state regression lock.

**Risk** — medium (grid layout is fiddly, and RGL's `allLayouts` callback shape must be preserved).
**Expected LOC delta** −120, +~120 module, +~100 test, page 488 → ~250.

**Confidence** — verified by reading the file end-to-end.

---

## C10. The 4 IPO + 7 assertion field set is declared in eight modules with three different label schemes

**Files** — `src/components/rcm/RCMComplianceTab.tsx` (110), `src/components/rcm/properties/TLCForm.tsx` (60),
`src/components/bpm/BPMAccountAssertion.tsx` (133), `src/components/csa/TODDesignContextFields.tsx` (256),
`src/pages/rcm/RCMTLCPage.tsx` (353), `src/pages/rcm/RCMITGCPage.tsx`, `src/pages/rcm/VerificationDesignPage.tsx` (427),
`src/components/rcm/VerificationEditDialog.tsx` (440), `src/components/rcm/AssessmentFormTabs.tsx`,
`src/components/rcm/rcm-form-schema.ts`.

**Tangle evidence**

```ts
// RCMComplianceTab.tsx:14-29 — the canonical list (as-const, i18n tip keys)
const ASSERTION_ITEMS = [{ name:'assertionE', label:'E/O', tip:'eo' }, … { name:'assertionPd', label:'PD', tip:'pd' }] as const;
// csa/TODDesignContextFields.tsx:250-257 — derived by string mangling
{['assertionE','assertionC','assertionA','assertionCo','assertionVa','assertionRo','assertionPd'].map(f => (
  <FormField name={f as any} … <FormLabel>{f.replace('assertion','').toUpperCase()}</FormLabel> // → E, C, A, CO, VA, RO, PD
```

So the same seven regulatory assertions render as `E/O, C, A, CO, V/A, R&O, PD` in the RCM tab and as
`E, C, A, CO, VA, RO, PD` in the CSA TOD form (plus `name={f as any}` — a *new* escape cast, banned
by `AGENTS.md:80`). The IPO quartet is likewise re-declared in `TLCForm.tsx:16-21` (with `fullName`
+ tooltips), `BPMAccountAssertion.tsx:38-46` (assertions with colours), `RCMTLCPage.tsx:100-101` and
`RCMITGCPage.tsx:80-81` (bare name arrays), `VerificationDesignPage.tsx:300-320` and
`rcm-form-schema.ts:67-71`. Note `shared/types/common.ts:11,16` already defines the authoritative
unions (`ControlAssertion` with 9 members, `InformationProcessingObjective` with 5) which none of
these lists derive from — so a new assertion in the union is invisible to every screen.

**Deletion test** — delete the shared field-set and 8 modules re-declare it; the label drift (and the
`as any` escalation) is already visible today, which is the strongest possible proof that the module
earns its keep.

**Dependency category** — in-process pure config.

**Proposed narrow interface** (`shared/assertion-fields.ts` — cross-cutting `rcm` + `csa` + `bpm`,
importable by both sides per `AGENTS.md` §Import Layering):

```ts
export interface AssertionField { name: AssertionFieldName; shortLabel: string; i18nKey: string }
export const IPO_FIELDS: readonly (AssertionField & { name: IpoFieldName })[];      // 4
export const ASSERTION_FIELDS: readonly AssertionField[];                            // 7
export type IpoFieldName = 'ipoC'|'ipoA'|'ipoV'|'ipoRa';
export type AssertionFieldName = 'assertionE'|'assertionC'|'assertionA'|'assertionCo'|'assertionVa'|'assertionRo'|'assertionPd';
```

Explicitly **not** in the interface: the `<FormField>`/`<Switch>`/`<CheckboxField>` renderers (each
surface keeps its own), the excel/column headers, or the icons/colours (pass them in, or leave the
BPM card's palette inline).

**Blast radius** — 8-10 files. `VerificationEditDialog.tsx` (440) is grandfathered and contains six
near-identical pilar `FormField` blocks (`:197-262`); it must **shrink** here by rendering
`PILAR_FIELDS.map(...)`, otherwise the touch is a regression. `AddAssessmentDialog.tsx` (401) can
reuse the same list. `RCMComplianceTab`, `TLCForm`, `BPMAccountAssertion`, `TODDesignContextFields`
switch to `.map`.

**Test plan** — new `shared/assertion-fields.test.ts`: exactly 4 IPO + 7 assertion entries, names are
unique, `shortLabel` matches the vetted literal table from the spec (MW-style known-good literals,
never recomputed from the module), and one round-trip test per consumer (render a surface, assert the
label text) so the dropout of `assertionCo` in any consumer fails loudly. Add one test to
`src/components/rcm/rcm-form-schema.test.ts`-adjacent coverage that every `AssertionFieldName` exists
on `RcmFormValues` (type-level, compile-time).

**Risk** — medium: 10 files, and label text changes are user-visible in the Ejecution Hub / RCM
matrix. Do it in two PRs (RCM trio first, then CSA set) if the diff gets long.
**Expected LOC delta** −120 duplicates, +~50 module, +~80 test.

**Confidence** — verified by reading `RCMComplianceTab.tsx`, `TLCForm.tsx`, `BPMAccountAssertion.tsx`,
`TODDesignContextFields.tsx` and grepping all re-declarations.

---

## Ranked table

| ID | Title | Impact | Risk | Files to touch | New test file |
| --- | --- | --- | --- | --- | --- |
| C1 | Worksheet control-scope matcher triplicated + tautological test | high (which controls get tested; drift already live) | med | 4 | `shared/worksheet-control-scope.test.ts` |
| C2 | `UserRole`/`UserLevel` option literals drift (`Komisaris` vs `Commissioner`, no `Director`) | high (authorization + dead sidebar badge) | low-med | 3 (+2 discriminants fixed) | `src/pages/admin/__tests__/user-options.test.ts` |
| C3 | `ReportsPage` test-row derivation ×3 + two disagreeing export column sets | high (regulatory workpaper) | low-med | 2 | `src/pages/reports/__tests__/testing-rows.test.ts` |
| C4 | IDR money formatted 8 ways, one without a locale | high (audited figures render differently per screen) | low | ~14 (staged) | `src/lib/__tests__/format-money.test.ts` |
| C5 | `useCSA` bare year-less invalidations + duplicated evidence compressor, wrong behaviour locked by its own test | high (stale Belum-Dinilai tab; silent delete failure) | med | 4 | rewrite `src/hooks/use-csa.test.tsx` + `csa-keys.test.ts` |
| C6 | `SettingsPage` mirror server-state + 3× webhook card | med (mandated config-driven; stale whole-object PUT) | low | 1 + 2 new | `src/pages/admin/__tests__/settings-webhooks.test.tsx` |
| C7 | `SOCMonitoringPage` 513 LOC, badge matrices duplicated per view, no `onError` | med | low | 1 → ~5 | `src/pages/rcm/__tests__/application-badges.test.ts` + page test |
| C8 | Severity tone/label/class in 5 modules (second pass) | med | low-med | 6 | `src/lib/__tests__/deficiency-severity.test.ts` |
| C9 | `CustomizableDashboard` layout algebra untested + mirror prefs | med | med | 1 + 1 | `src/components/reports/__tests__/dashboard-layout.test.ts` |
| C10 | 4 IPO + 7 assertion field set declared 8 times, three label schemes, `as any` | med-high (regulatory vocabulary) | med | 8-10 | `shared/assertion-fields.test.ts` |

---

## Environment ideas (for the retro step)

Guardrails that would have caught these mechanically, cheapest first:

1. **`check:single-source` (duplication gate, delta-scoped).** Min-hash over non-empty
   lines (window ≥ 12) across `src/**` + `shared/**`; fail when a window appears in ≥2 files and
   did not appear at base. Catches C1 (three copies), C3 (three row builders), C5
   (`maybeCompressImage` vs `compressEvidenceImage`), C6 (three webhook blocks), C8 (identical class
   strings), C4 (repeated `Intl.NumberFormat` lines). Extend it in the **src↔test** direction too
   (`BPMModalScoping.test.ts:48-84` vs `BPMModal.tsx:112-138`) — a test that embeds a ≥10-line copy of
   production code is the C1 bug and nothing currently notices.
2. **`check:union-literals`.** For each `export type X = "a" | "b" …` in `shared/types/**`, fail on a
   **new** JSX `value="…"` / options-array literal in `src/**` that is not a member of any union
   (whitelist for genuinely free strings). Catches C2 (`value="Komisaris"`, missing `Director`) and
   C10 (field-name arrays that no longer match `ControlAssertion`).
3. **`check:no-test` warning tier in `check-loc.mjs`.** File >250 non-empty LOC with no sibling
   `__tests__/<name>.test.*` and no `src/test/<name>.test.*` → WARN naming the expected path. Flags
   C3, C6, C7, C9 (and `UserManagementPage`).
4. **`check:query-keys` (year-scope).** Pair each `api('/api/…?year=')`/`workingYear` argument with
   the enclosing `queryKey` array and with every `invalidateQueries` for the same base key; fail when
   the invalidation omits the year element. Catches C5 — including the test that asserts the bare key.
   Extend it to `check:i18n`-style base-vs-HEAD deltas so pre-existing offenders are grandfathered.
5. **Lint rule: `local/no-tautological-test`** (extend the existing `eslint-local/` plugins). Flag a
   test file that declares a `function` whose body is a line-normalised match for a `function` in a
   non-test file. Cheaper to build than the min-hash gate and it is precisely the C1 failure mode.
6. **`CODING_STANDARDS.md` addition — "number, money and percentage rendering is single-sourced".**
   The normalizer rule (`:25-42`) covers keys and codes; money/percent is the same bug class and is
   currently unstated, which is why 17 sites survived. Add the owner path (`src/lib/format-money.ts`)
   next to the existing precedents.
7. **`docs/agents/seam-registry.md` (short table).** One row per single-owner module
   (`trimText`, `hashStable`/`buildSuggestContextHash`, `dedupeMatrixControls`,
   `resolveWorkflowAction`, `formatIdr`, `severityTone`, `filterWorksheetControls`,
   `ASSERTION_FIELDS`) → so an architecture review stops re-proposing a second copy and a reviewer
   can point at the owner. This report's rejected list is the same device applied once; the registry
   makes it permanent.
8. **i18n gate widening.** `check:i18n` only sees `toast.*("…")`. C6/C7 are full of raw English JSX
   (`"Significant Application Inventory"`, `"Service Organization Control (SOC) Repository"`,
   `"Save Global Changes"`). A warn-only mode that lists new raw text nodes in touched `src/**/*.tsx`
   would make the drift visible without a big-bang migration.

---

## Rejected / not worth it (deletion test applied)

| Candidate | Why not |
| --- | --- |
| `src/utils/bpm-auto-layout.ts` (471) | Already the single owner (AGENTS.md:83 names it) and tested by `src/test/bpm-auto-layout.test.ts`; deletion test → 1 module, no second copy. Grandfathered only. |
| `src/components/reports/AIAnalyticsMockup.tsx` (545) | Demo/mockup surface with its own test; no production call site reaches the interesting parts, and no second caller of any helper. Extracting a seam would be a hypothetical one (ADR-0002). |
| `src/pages/csa/TodoListPage.tsx` (538) | Has a dedicated test and the whole CSA hub row/view seam was deepened in the last sessions; what remains is JSX bulk. Boy-scout shrink on touch, not a candidate. |
| `src/lib/compliance-utils.ts` (384) | Already the owner for GL/RCM column mapping + Benford + test-result labels, and it has `compliance-sorting.test.ts`; its size comes from four unrelated mapping tables, not from a tangled seam. Splitting it is churn with no behaviour change. |
| `src/components/rcm/VerificationEditDialog.tsx` (440) six duplicated pilar blocks | Real ≥3× JSX duplication, but the win is the same `PILAR_FIELDS` map as C10 — folded into C10 rather than proposed twice (its LOC must still drop when touched). |
| `src/components/rcm/AddAssessmentDialog.tsx` (401) duplicated `form.reset({…})` default block (`:123-157` vs `:172-206`) | One file, one duplication pair (below the ≥3 threshold), and it disappears once C10's field map owns the defaults. Merged into C10. |
| `src/pages/testing/TestWorkbench.tsx` (343) third TOD/TOE export | Folded into C3 as a call site: its column list must come from the same single owner, otherwise C3 only halves the drift. |
| Extracting a shared **wizard shell** for `SmartImportWizard`/`RCMImportWizardModal` | Explicitly forbidden by `docs/adr/0006-wizard-shell-no-shared-module.md`; no new shared behaviour appeared since. |
| `src/store/useFiscalYearStore.ts` (58) URL/localStorage triple source | `RootLayout.tsx:20-28` + the store `merge` + `use-csa-form.ts:26-28` read the year from three places, but the fix is the year-key seam in C5 plus reading the store instead of `window.location` in the form — one line each. A module would be a hypothetical seam (ADR-0002). Listed here so the next reviewer does not re-propose it. |
| Replacing `Intl` percent formatting (`(x*100).toFixed(1)`, ~9 sites) | Same family as C4 but all sites agree on the format today (one decimal, `%` suffix) and none is locale-sensitive. No realised drift → no deletion-test payoff yet. |
| Backend route splits (`worker/routes/**`) | Out of scope for a client-side batch; the repo already has the barrel/sub-app pattern. |
