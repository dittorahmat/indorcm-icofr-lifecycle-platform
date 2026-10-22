# Design

## Context

See `proposal.md` — Why. Two constraints shape the approach:

1. `layoutOcrDiagram` is the single entry point used by both the review staging and the canvas landing (`stageRawDiagram` in `src/components/rcm/editor/ocr/ocr-node-normalize.ts`), so replacing its internals fixes both surfaces at once.
2. The repo forbids ad-hoc client-side auto-layout that overwrites manual coordinates (`AGENTS.md`, BPM Layout Architecture). The new layout must therefore be deterministic, run once at import, and live in `src/utils/` beside the existing `ocr-layout.ts` / `ocr-lane-geometry.ts`.

Current layout output is fully synthetic: lanes get a fixed 400×1000 box, each lane's nodes are assigned per-lane BFS depth and stacked from `HEADER_OFFSET`, and the model's `y` is only used as a tie-breaker. Node height is read from the registry (56px for activity) while the rendered node grows with the wrapped label (82–97px in the reported diagram).

## Goals / Non-Goals

**Goals:**

- Make the imported diagram recognisably the same drawing: same lane order, same intra-lane order, and nodes that share a source row share a canvas row.
- Guarantee the invariants that were violated: no overlap, content-sized lanes, and no non-loop cross-lane edge that points backwards.
- Keep the existing pipeline contract (`OcrLayoutResult` → `normalizeLaidOutNodes`) unchanged so staging, apply, append, sheets and export keep working untouched.
- Stay under 400 non-blank LOC per file and 350 for new files.

**Non-Goals:**

- Pixel-accurate replication of the source drawing, computer-vision edge tracing, or inferring rows from arrow geometry.
- Replacing the existing orthogonal edge router or swimlane interaction model.
- Re-laying out already-saved diagrams.

## Decisions

### 1. Two engines behind one selector

`layoutOcrDiagram` becomes an orchestrator: validate → resolve lanes/parents → select engine → normalize edges → return. Engines:

- `ocr-layout-rows.ts` — coordinate-anchored (default).
- `ocr-layout-rank.ts` — the current per-lane depth algorithm, moved verbatim behind the same input/output contract.

*Alternative considered*: patch the rank algorithm with a global BFS. Rejected: it still discards horizontal position, still produces long cross-lane edges, and cannot restore the source's row alignment (the requirement that failed twice already).

### 2. Rows come from clustered source `y`, not from edge topology

Take every child node's source centre `y`. Sort ascending, then merge neighbours whose gap is within `ROW_MERGE_TOLERANCE = 36` normalized units (≈3.6% of the 0–1000 space). Each cluster becomes a global row shared by all lanes. Row height = `max(estimateNodeBox(node).height)` in that row + `ROW_GAP = 40`. Row `y` is the cumulative sum starting at `HEADER_H + 50`.

Node `x` inside its lane follows the source order and proportional spread within the lane's content box, clamped to padding; a single node in a lane/row is centred. This keeps the drawing faithful horizontally without trusting raw pixel distances.

*Alternative considered*: map raw `y` linearly into canvas pixels. Rejected: a blank area in the source becomes dead space, and a tight cluster can shrink below the rendered node height (the exact failure we are fixing).

### 3. Lanes are sized by their content

Lane width = `max(LANE_MIN_W=400, widest row in that lane + 2*LANE_PADDING)`; lane height = `last row bottom + LANE_FOOTER (80)`, shared uniformly across lanes so the canvas stays a clean band. Lane order stays `orderLanes` (median x). The fixed 1000px height and the 400px empty right band disappear.

### 4. Label-aware node box is a pure estimator

`src/utils/ocr-node-box.ts` exposes `estimateNodeBox(type, label)`:

- width from `nodeDimensionsOf(type)` (single registry source).
- characters per line = `floor((width - 32) / 6.6)` for the 12px semibold label; line count from a deterministic word wrap; height = role row (18) + `lines * 16` + box padding (24), floored at the registry height.

*Alternative considered*: measure the rendered DOM after mount and re-run layout. Rejected: layout is consumed by `stageRawDiagram` before render (and under jsdom, where layout is zero), so measurement would make the result non-deterministic and untestable.

### 5. De-overlap sweep as a safety net, not the primary placement

After rows are assigned, `ocr-layout-deoverlap.ts` sorts nodes per lane by `(row, x)` and pushes down any node whose box intersects the previous one, then spreads horizontally when two nodes in the same lane/row still collide (widening the lane if needed). The sweep is bounded by node count and has no randomness, so the same input always yields the same canvas.

### 6. Validity gate

Coordinate mode is used only when:

- at least 50% of child nodes have distinct `y`, and
- the `y` interquartile range is at least 15% of the drawing's vertical span, and
- at least two rows are produced.

Otherwise the orchestrator delegates to `ocr-layout-rank.ts`. The gate is pure and locked by tests, so a bad vision response degrades to today's behaviour instead of a collapsed diagram.

### 7. Extraction contract follows the geometry

`worker/services/bpm/bpm-ocr.ts` gains explicit prompt clauses: `position` is the shape's top-left, `width`/`height` are in the same 0–1000 space, swimlanes must include their column bounds, and the model must not reflow shapes to the top of a column. `sourceHandle`/`targetHandle` are added to `BPM_OCR_RESPONSE_SCHEMA` (they are already parsed and canonicalized downstream, so this closes an existing contract gap). All new fields stay optional, so parsing remains backward compatible.

### 8. Landing camera is explicit, not fit-all

`handleApplyOcr` stops calling plain `fitView`. A pure helper `computeLandingViewport(bounds)` (in `src/utils/ocr-landing-viewport.ts`, unit-tested) returns `{x, y, zoom}` anchored to the diagram's top-left at `zoom = 0.75`; the handler applies it via `setViewport`. `BPMCanvas` `minZoom` stays 0.02 so "Fit to Screen" still works on demand. The review preview (`OcrReviewView`) grows from 200px to `min-h-[320px] lg:h-[420px]` with `fitView({ minZoom: 0.5 })`.

*Alternative considered*: `fitView({ minZoom: 0.7 })`. Rejected: it centres the viewport, so on a tall 4-lane diagram the start node scrolls off-screen.

### 9. Module split (LOC budget)

| File | Budget (non-blank LOC) | Role |
| --- | --- | --- |
| `src/utils/ocr-layout.ts` | ≤150 | orchestrator, lane resolution, edge handles |
| `src/utils/ocr-layout-rows.ts` | ≤200 | row clustering, row offsets, coordinate placement |
| `src/utils/ocr-layout-deoverlap.ts` | ≤120 | overlap sweep |
| `src/utils/ocr-layout-rank.ts` | ≤190 | legacy rank engine (moved) |
| `src/utils/ocr-node-box.ts` | ≤70 | label-aware box estimate |
| `src/utils/ocr-landing-viewport.ts` | ≤50 | landing camera math |

`ocr-lane-geometry.ts` keeps `orderLanes` / `groupNodesByRank` but loses `computeUniformHeight` (rank engine imports what it needs from `ocr-layout-rank.ts`).

## Risks / Trade-offs

- **[Risk] Model coordinates are noisy or systematically biased** → the validity gate plus the de-overlap sweep absorb noise; the fallback preserves today's output. Calibrate `ROW_MERGE_TOLERANCE` after the first real run.
- **[Risk] Taller rows make the diagram larger than before** → camera now lands at 0.75 instead of 0.22, and lanes no longer reserve 1000px; the visible area still shows the first lanes, and "Fit to Screen" remains one click away.
- **[Risk] Existing tests assume the rank grid** (staggering, per-lane rank) → those assertions move to `ocr-layout-rank.test.ts` and keep guarding the fallback; `ocr-layout.test.ts` asserts the new invariants on the KUR fixture.
- **[Risk] Prompt changes shift extraction output for existing users** → only additive/optional schema fields and clarifications; no field is removed or renamed. `bpm-ocr.test.ts` locks parsing of old responses.
- **[Risk] Loop edges (retry/rejection branches) legitimately point upwards** → the "no upward edge" invariant applies only to non-loop edges; the router already handles back edges via channel offsets.
- **[Trade-off] Rows are banded, not proportionally spaced** → some visual rhythm of the source (large gaps) is normalized. Accepted: legibility and no-overlap take priority over blank-space fidelity.

## Migration Plan

- Frontend-only: no schema, API-shape (beyond additive OCR response fields) or database migration.
- Layout runs only during OCR import, so existing diagrams are untouched. Rollback = revert the change with no data cleanup.
- Deployment order: worker prompt/schema and frontend layout can ship independently; the frontend works with old responses because all new geometry fields are optional.

## Open Questions

- The raw `POST /api/bpm-diagrams/ocr` payload for the KUR PDF has not been captured yet (only the saved diagram list was available). Tolerance values above are derived from the rendered result; if the first real import shows merged or over-split rows, tune `ROW_MERGE_TOLERANCE` in a follow-up without changing specs.
