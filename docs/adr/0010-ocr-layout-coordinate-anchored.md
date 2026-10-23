# 0010 - Coordinate-anchored OCR layout with a rank fallback

- **Status:** Accepted
- **Date:** 2026-10-22
- **Context:** OCR import of multi-lane BUMN flowcharts (`BPM_Persetujuaan_Kredit_KUR_20260831.pdf`).

## Problem

`layoutOcrDiagram` received `x`/`y` from the vision model and then discarded them:
each lane's nodes were re-flowed into a synthetic per-lane BFS rank, lanes were
fixed at 400x1000, and node height came from the registry minimum (56px for an
activity) while the activity renderer grows with a wrapped label (82-97px).

Consequences in the saved `Persetujuan KUR` diagram:

- six KOMITE KREDIT nodes occupied `y=80..686` of a 1000px lane (content crammed at
  the top);
- MARKETING nodes sat at `y=182/308/434` while the source drawing places them far
  lower, so `<KEPUTUSAN (y=686)> -> memberitahu nasabah (y=308)` climbed 378px
  across the CALON DEBITUR lane;
- lanes reserved 400px of width while their content used `x=41..225`.

Two earlier changes (`fix-bpm-ocr-layout-edge-layering`,
`enhance-bpm-ocr-fidelity-and-auto-arrange`) tuned gaps inside the same rank grid,
so the defect survived both.

## Decision

1. **Two engines, one selector.** `layoutOcrDiagram` is an orchestrator. The
   coordinate engine (`ocr-layout-rows.ts`) is the default; the previous rank
   algorithm is preserved verbatim in `ocr-layout-rank.ts` as a fallback. Both
   return the same `EngineResult`, so lane assembly, edge handles and the public
   `OcrLayoutResult` contract are shared.
2. **Rows come from clustered source `y`.** Source-space `y` values within
   `ROW_MERGE_TOLERANCE = 36` (3.6% of the 0-1000 space) form one global row shared
   by every lane. Row height is the tallest `estimateNodeBox` in that row plus
   `ROW_GAP = 40`. Nodes keep their source left-to-right order within the lane and
   are spread proportionally inside the content box; a lone node is centred.
3. **Lane bounds follow content.** Lane width = `max(400, widest row + 2*40)`;
   lane height = deepest placed node + 80 footer, shared uniformly across lanes.
   The fixed 1000px band is gone.
4. **Label-aware sizing is a pure estimator** (`ocr-node-box.ts`): registry width,
   deterministic word wrap at 12px, `+20px` per additional line over the registry
   height. DOM measurement was rejected because layout runs before render and
   jsdom reports zero layout, which would make the result non-deterministic.
5. **Validity gate.** Coordinates are trusted only when >=50% of child nodes have
   distinct `y`, the `y` interquartile range is >=15% of the drawing span, and at
   least two rows form. Otherwise the rank engine runs, so a bad vision response
   degrades to the legacy output instead of a collapsed diagram.
6. **De-overlap sweep** (`ocr-layout-deoverlap.ts`) spreads same-row boxes
   horizontally then pushes colliding boxes down, bounded by the node count and
   fully deterministic. It is a safety net behind the placement, not the placer.
7. **Landing camera.** After apply, the canvas lands at zoom 0.75 anchored to the
   drawing's top-left (`computeLandingViewport`) instead of `fitView`, which landed
   near 22% on a four-lane sheet. "Fit to Screen" still zooms out on demand.

## Rejected alternatives

- **Linear pixel mapping of raw `y`.** Blank areas become dead space, and a tight
  source cluster can shrink below the rendered node height - the exact failure
  being fixed.
- **Patching the rank grid with a global BFS.** Still discards horizontal position
  and still produces long cross-lane edges; cannot restore row alignment.
- **Third-party graph layout (dagre/elk).** New dependency for behaviour this repo
  needs to control deterministically under a regulation-driven layout spec.

## Consequences

- Imported diagrams are visibly larger and taller; the camera starts readable and
  panning replaces fit-all.
- `ROW_MERGE_TOLERANCE` may need calibration after the first real import; it is a
  single constant in `ocr-layout-rows.ts` and is covered by unit tests.
- The OCR prompt now specifies `position` as the shape's top-left with normalized
  `width`/`height` and forbids reflowing shapes upward (`worker/services/bpm/bpm-ocr.ts`).
- Locked by `src/test/ocr-layout.test.ts` (4 lanes / 15 nodes / 15 edges),
  `src/utils/__tests__/ocr-layout-{rows,deoverlap,rank,edges}.test.ts`, and
  `src/utils/__tests__/ocr-node-box.test.ts`.
