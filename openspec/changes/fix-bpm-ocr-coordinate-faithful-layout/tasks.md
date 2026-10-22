# Tasks

## 1. Label-aware node box and landing viewport helpers

- [x] 1.1 Create `src/utils/ocr-node-box.ts` with `estimateNodeBox(type, label)` (registry width, deterministic word-wrap line count, role row + padding, floored at registry height); verify with `npx vitest run src/utils/__tests__/ocr-node-box.test.ts`
- [x] 1.2 Write `src/utils/__tests__/ocr-node-box.test.ts` covering: short label returns registry height, `MEMBUAT PERTIMBANGAN DAN PERSETUJUAN` returns ≥90, document/decision types keep their fixed height, identical input returns identical output; verify the test file passes
- [x] 1.3 Create `src/utils/ocr-landing-viewport.ts` with `computeLandingViewport(bounds, zoom = 0.75)` returning an anchored `{x, y, zoom}` viewport; verify `npx vitest run src/utils/__tests__/ocr-landing-viewport.test.ts`
- [x] 1.4 Write `src/utils/__tests__/ocr-landing-viewport.test.ts` covering: top-left node lands inside the viewport at 0.75, zoom is never below 0.7, empty bounds fall back to zoom 1 at origin; verify the test file passes
- [x] 1.5 Run `npm run check:loc -- src/utils/ocr-node-box.ts src/utils/ocr-landing-viewport.ts src/utils/__tests__/ocr-node-box.test.ts src/utils/__tests__/ocr-landing-viewport.test.ts` and confirm every file is ≤350 LOC

## 2. Coordinate-anchored row layout

- [x] 2.1 Create `src/utils/ocr-layout-rows.ts` with `clusterRows(nodes, tolerance)` (merge source centres within `ROW_MERGE_TOLERANCE = 36`) and `computeRowOffsets(rows, estimateNodeBox)` (row height = tallest node + 40, first row at `HEADER_H + 50`); verify exported functions are pure and importable by `npx tsx -e "import('./src/utils/ocr-layout-rows.ts').then(m => console.log(typeof m.clusterRows))"`
- [x] 2.2 Add `placeNodesInLanes(rows, lanes, childMap)` to `ocr-layout-rows.ts`: intra-lane ordering by source `x`, proportional spread clamped to padding, single node per lane/row centred; verify with unit tests
- [x] 2.3 Create `src/utils/ocr-layout-deoverlap.ts` with a deterministic per-lane sweep (push down, then spread horizontally, widen lane when needed) and a hard iteration bound; verify it terminates and returns the same output for the same input
- [x] 2.4 Write `src/utils/__tests__/ocr-layout-rows.test.ts` covering: nodes sharing a source row get one row across lanes, row order follows source `y`, no two rows closer than the tallest node + 40, single-node lane centres horizontally; verify the test file passes
- [x] 2.5 Write `src/utils/__tests__/ocr-layout-deoverlap.test.ts` covering: two nodes in the same lane/row end with ≥40px horizontal clearance, vertically stacked colliding nodes end with ≥40px clearance, sweep is idempotent on already-clean input; verify the test file passes
- [x] 2.6 Run `npm run check:loc -- src/utils/ocr-layout-rows.ts src/utils/ocr-layout-deoverlap.ts src/utils/__tests__/ocr-layout-rows.test.ts src/utils/__tests__/ocr-layout-deoverlap.test.ts` and confirm ≤350 LOC per new file

## 3. Rank fallback engine and orchestrator

- [x] 3.1 Move the current per-lane depth algorithm out of `src/utils/ocr-layout.ts` into `src/utils/ocr-layout-rank.ts` without behaviour change (fixed dims height, `ROW_HEIGHT`, stagger for unlinked roots); verify the moved behaviour by running the pre-existing layout tests against it
- [x] 3.2 Move the rank-only assertions from `src/test/ocr-layout.test.ts` into `src/utils/__tests__/ocr-layout-rank.test.ts` (unlinked-document staggering, per-lane depth, top-level row) and keep them green
- [x] 3.3 Add the validity gate (`hasUsableGeometry`: ≥50% distinct `y`, IQR ≥15% of span, ≥2 rows) to `src/utils/ocr-layout-rows.ts` and verify it with unit tests for degenerate and usable fixtures
- [x] 3.4 Rewrite `src/utils/ocr-layout.ts` as the ≤150-LOC orchestrator: validate → lane resolution/snapping → engine selection → coordinate placement → de-overlap → content-sized lane bounds → edge handles; verify `src/test/ocr-layout.test.ts` passes
- [x] 3.5 Replace the KUR fixture in `src/test/ocr-layout.test.ts` with the real 4-lane / 15-node / 15-edge coordinates from the reported PDF and assert: lane order preserved, each lane's node order follows source `y`, `memberitahu nasabah` sits below `KEPUTUSAN`, no non-loop cross-lane edge points upward, lane height = content + footer, zero overlaps; verify the suite passes
- [x] 3.6 Add a locking test that a degenerate response (all `y = 0`) produces the rank layout instead of a collapsed one; verify it fails when the gate is bypassed and passes with the gate
- [x] 3.7 Run `npx vitest run src/test/ocr-layout.test.ts src/utils/__tests__/ocr-layout-rank.test.ts src/utils/__tests__/ocr-layout-rows.test.ts src/utils/__tests__/ocr-layout-deoverlap.test.ts` and confirm all green
- [x] 3.8 Run `npm run check:loc -- src/utils/ocr-layout.ts src/utils/ocr-layout-rank.ts src/utils/ocr-layout-rows.ts src/utils/ocr-layout-deoverlap.ts` and confirm every file is ≤150/≤190/≤200/≤120 LOC respectively

## 4. OCR extraction contract

- [x] 4.1 Update `BPM_OCR_SYSTEM_INSTRUCTION` in `worker/services/bpm/bpm-ocr.ts` to define `position` as the shape's top-left, require normalized `width`/`height`, require lane column bounds, and forbid reflowing shapes to the top of a column; verify `npx vitest run worker/services/bpm/__tests__/bpm-ocr.test.ts`
- [x] 4.2 Add `sourceHandle`/`targetHandle` to `BPM_OCR_RESPONSE_SCHEMA`; verify the schema still accepts a response without those fields (backward compatibility) via the existing parser tests
- [x] 4.3 Extend `worker/services/bpm/__tests__/bpm-ocr.test.ts` to lock the new prompt clauses and the optional handle fields; verify the worker test file passes
- [x] 4.4 Run `npm run check:loc -- worker/services/bpm/bpm-ocr.ts` and confirm the file stays within its grandfather budget (must not increase)

## 5. Review preview and landing camera

- [x] 5.1 In `src/components/rcm/editor/hooks/useBPMCanvasHandlers.ts`, replace the post-apply `fitView` with `computeLandingViewport` + `setViewport`; verify no other caller depends on the removed call (`npx eslint` on the file)
- [x] 5.2 In `src/components/rcm/editor/ocr/OcrReviewView.tsx`, raise the preview to `min-h-[320px] lg:h-[420px]` and pass `fitViewOptions={{ minZoom: 0.5 }}`; verify at 320px/1024px/1440px that the dialog footer stacks and no page horizontal scroll appears
- [x] 5.3 Add a component test locking the landing viewport call (zoom ≥0.7) and the taller preview container; verify `npx vitest run` on the new test file
- [x] 5.4 Run `npm run check:i18n -- src/components/rcm/editor/ocr/OcrReviewView.tsx src/components/rcm/editor/hooks/useBPMCanvasHandlers.ts` and confirm no new hardcoded strings
- [x] 5.5 Apply the design-taste-frontend and better-interface checklists (no `text-[10px]`, no glassmorphism, mobile-first grid, 44px touch targets) on the touched JSX; record `no visual change` if only classes/measurements moved

## 6. Documentation and governance gates

- [x] 6.1 Write `docs/adr/0010-ocr-layout-coordinate-anchored.md` recording the two-engine decision, the validity gate thresholds, and why pixel-linear mapping was rejected
- [x] 6.2 Verify the delta spec with `openspec validate fix-bpm-ocr-coordinate-faithful-layout --strict` (the main spec is updated by `/opsx-archive`, not hand-copied, so the archive step does not re-apply an already-merged delta)
- [x] 6.3 Update `src/components/rcm/editor/README.md` with a one-paragraph note pointing at the new layout modules and their ownership
- [x] 6.4 Run `npm run type-check`, `npm run lint`, and `npm run check:any-delta -- src/utils/ocr-layout.ts src/utils/ocr-layout-rows.ts src/utils/ocr-layout-deoverlap.ts src/utils/ocr-layout-rank.ts src/utils/ocr-node-box.ts src/utils/ocr-landing-viewport.ts worker/services/bpm/bpm-ocr.ts src/components/rcm/editor/hooks/useBPMCanvasHandlers.ts src/components/rcm/editor/ocr/OcrReviewView.tsx`; confirm zero errors and zero new `any`/escape-cast/non-null findings
- [x] 6.5 Run `npm run check:loc -- --all` and confirm no touched file crosses 400 LOC and no repository file crosses 600

## 7. Integration verification

- [x] 7.1 Run `npm run build` and confirm the production build succeeds
- [x] 7.2 Run `npm test` (full suite) and confirm green, with explicit timeouts where the suite is slow
- [x] 7.3 Build the automated PDF check (reuses the production path): `src/test/ocr-pdf-e2e.test.ts` renders page 1 with `pdfjs-dist` (the engine `diagram-parser.ts` uses, its Node build + `@napi-rs/canvas`), calls `buildOcrPrompt` + `BPM_OCR_RESPONSE_SCHEMA` + `AIService` + `parseOcrResponse`, then `layoutOcrDiagram` + `auditOcrLayout` + `auditSourceOrder`; it skips unless `OCR_LIVE=1`, a PDF, and a Gemini key are present
- [x] 7.4 Run 7.3 against `BPM_Persetujuaan_Kredit_KUR_20260831.pdf` (raster 1684x1191 via pdfjs) — passing run: 4 lanes (KOMITE KREDIT → MARKETING → CALON DEBITUR → LEGAL), 15 shapes, 15 edges, audit 0 violations, order 0, fitZoom 0.756 vs landing 0.75
- [x] 7.5 Keep a deterministic regression of that real response: `fixtures/ocr/BPM_Persetujuaan_Kredit_KUR.ocr.json` + `src/test/ocr-real-snapshot.test.ts` (no network, runs in CI)
- [x] 7.6 Re-run 7.4 with a second, non-KUR sample (`BPM_Penerimaan_Setoran_Tunai_20260507.pdf`, flow chart + sign-off table) - passing run: 1 lane, 7 shapes, 7 edges, audit 0 violations, order 0, fitZoom 1 vs landing 0.75. The sample exposed two defects, now fixed and locked: the rank fallback kept a 1000px empty lane band (now content-sized, min 300) and shapes outside lanes were pinned in one horizontal row below the lanes (now they keep the source arrangement, and the block that is higher in the sheet stays on top); snapshot `fixtures/ocr/BPM_Penerimaan_Setoran_Tunai.ocr.json`

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- [x] 7.7 Run the OCR extraction at `temperature: 0` (opt-in `temperature` on `AIService.generateChatResponse`; only the OCR route passes it, every other AI feature keeps the provider default) - locked by `worker/services/bpm/__tests__/bpm-ocr.test.ts` (seam value) and `worker/services/ai-service.test.ts` (payload plumbing)
