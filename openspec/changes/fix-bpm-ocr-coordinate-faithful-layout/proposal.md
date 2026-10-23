# Proposal

## Why

OCR import of real BUMN flowcharts still lands as a cramped, tangled diagram: every node is stacked from the top of its swimlane and cross-lane arrows climb backwards across other lanes. The cause is structural, not cosmetic — `layoutOcrDiagram` throws away the vision model's `x/y` and re-flows nodes into a synthetic per-lane rank grid. Two earlier changes (`fix-bpm-ocr-layout-edge-layering`, `enhance-bpm-ocr-fidelity-and-auto-arrange`) only increased gaps inside that same grid, so the defect survived.

Measured on the saved result of `BPM_Persetujuaan_Kredit_KUR_20260831.pdf` (`Persetujuan KUR` diagram):

| Symptom | Evidence |
| --- | --- |
| Content crammed in the lane's top band | KOMITE KREDIT lane: 6 nodes at `y=80…686` inside a 1000px lane |
| Cross-lane alignment destroyed | MARKETING lane nodes at `y=182/308/434`; the source places them at ≈500/1050/1150 |
| Backwards edges across other lanes | `KEPUTUSAN (y=686) → memberitahu nasabah (y=308)` climbs 378px over the CALON DEBITUR lane; `KEPUTUSAN (y=294) → LEGAL (y=80)` climbs 214px |
| Lane width wasted | 400px lane, content occupies `x=41…225` (≈60% empty) |
| Label-aware clearance missing | `MEMBUAT PERTIMBANGAN DAN PERSETUJUAN` renders 97px tall (saved node height) but the layout reserves 56px, leaving a 29px gap to the next node |
| Unreadable landing view | canvas `minZoom` is 0.02, so `fitView` lands near 22% zoom and 12px labels render at ≈2.6px |

OCR extraction itself is good (4 lanes, labels, types, YES/NO edges are correct); only the layout and the landing camera are wrong.

## What Changes

- **Coordinate-anchored layout mode (default)**: cluster the model's `y` values into global rows shared across lanes, keep each node's lane and intra-lane horizontal order, size lanes to their content, then run a deterministic de-overlap sweep. Result: nodes that are side by side in the source stay side by side, so cross-lane edges are horizontal instead of long diagonals.
- **Validity gate with fallback**: use coordinate mode only when the extracted geometry is usable (distinct `y` values, non-degenerate spread); otherwise fall back to today's rank algorithm, which is retained as a separate, tested module.
- **Label-aware node box**: one pure estimator (`estimateNodeBox(type,label)`) supplies the height used for row spacing, so wrapped labels can never overlap the next node.
- **Extraction contract**: define `position` as the shape's top-left, require normalized `width/height` and lane bounding boxes, require the model to preserve the drawing's geometry instead of reflowing it, and request `sourceHandle`/`targetHandle` in the response schema (currently read but never asked for).
- **Readable landing view**: after applying OCR, stop fitting the whole diagram into the viewport; land at a legible zoom (clamped `minZoom` ≈0.7) and make the review preview taller. "Fit to Screen" remains available.
- **Module split** to respect the 400-LOC soft limit: orchestrator plus `ocr-layout-rows`, `ocr-layout-deoverlap`, `ocr-layout-rank`, `ocr-node-box`.
- **Locking tests** built on the real KUR fixture (4 lanes / 15 nodes / 15 edges) covering row alignment, no upward cross-lane edges, clearance under wrapped labels, content-sized lanes, zero overlaps, and the fallback gate.

**Non-goals**: pixel-perfect tracing or computer-vision alignment; adopting a third-party graph-layout library (dagre/elk); changing manual drag/resize behaviour, RCM linkage, or export.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bpm-multi-page-ocr`: replaces the rank-grid layout requirements with geometry-faithful layout (global rows, content-sized lanes, label-aware clearance), adds the coordinate-validity fallback, the extraction contract for coordinates, and a legible landing view after import.

## Impact

- Frontend layout: `src/utils/ocr-layout.ts` (rewritten orchestrator), new `src/utils/ocr-layout-rows.ts`, `src/utils/ocr-layout-deoverlap.ts`, `src/utils/ocr-layout-rank.ts`, `src/utils/ocr-layout-edges.ts`, `src/utils/ocr-node-box.ts`, `src/utils/ocr-landing-viewport.ts`, and the test oracle `src/utils/ocr-layout-audit.ts` (no production caller).
- OCR staging/import: `src/components/rcm/editor/ocr/ocr-node-normalize.ts`, `useOcrStaging.ts`, `ocr/OcrReviewView.tsx`. Adds the i18n keys `bpm:ocr.pageLabel`, `bpm:ocr.pageNumber`, `bpm:ocr.sourceAlt` (id + en).
- Canvas camera: `src/components/rcm/editor/hooks/useBPMCanvasHandlers.ts` (one landing path for both canvas and multi-sheet apply).
- Backend extraction contract: `worker/services/bpm/bpm-ocr.ts` (system prompt + response schema + `temperature: 0`) and `worker/services/bpm/__tests__/bpm-ocr.test.ts`; `worker/services/ai-service.ts` gains an optional `temperature` on `generateChatResponse` (other AI features keep the provider default).
- Tests: `src/utils/__tests__/ocr-layout*.test.ts` (unit), `src/test/ocr-real-snapshot.test.ts` (captured responses), opt-in `src/test/ocr-pdf-e2e.test.ts` (real PDF → model → audit), `src/components/rcm/editor/ocr/__tests__/ocr-import-adapter.test.ts`.
- Fixtures: `fixtures/BPM_Persetujuaan_Kredit_KUR_20260831.pdf`, `fixtures/BPM_Penerimaan_Setoran_Tunai_20260507.pdf` (537 KB total) plus their captured responses under `fixtures/ocr/`.
- Spec/ADR docs: `openspec/specs/bpm-multi-page-ocr/spec.md`, `docs/adr/0010-ocr-layout-coordinate-anchored.md`.
- No database, HTTP API-contract, or dependency changes.
