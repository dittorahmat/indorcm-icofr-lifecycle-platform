## Why

Currently, importing process flows via OCR in `BPMEditor` strictly overwrites the entire existing canvas. In enterprise ICOFR governance workflows, users frequently need to digitize multi-page process flows, append newly drafted swimlanes or sub-processes, or ingest diagram fragments sequentially into an existing canvas. Forcing an overwrite either causes accidental data loss of previously mapped nodes or forces users to manually redraw sections. Providing a clear, configurable import mode (Overwrite vs. Append with direction options: Vertical / Below or Horizontal / Right) alongside collision-free layout offsets protects existing work while speeding up diagram digitization.

## What Changes

- Add configurable import mode selection in the OCR review flow (`BPMOcrModal` / `useOcrStaging`):
  - **Overwrite**: Replaces the canvas diagram with the newly recognized elements (preserves existing behavior).
  - **Append**: Retains existing nodes and edges, appending new elements without overlap.
- When **Append** is selected, expose direction selection:
  - **Below (Vertical)**: Places new nodes below the maximum Y boundary of existing canvas nodes.
  - **Right (Horizontal)**: Places new nodes to the right of the maximum X boundary of existing canvas nodes.
- Implement collision prevention and unique ID isolation for appended nodes and edges:
  - Calculate safe bounding-box offsets with standard margins.
  - Re-map node IDs (and adjust edge source/target references) so imported items do not collide with existing element IDs.
- Preserve canvas undo/redo history (`pushState`) and dirty state tracking across both Overwrite and Append operations.
- Full localization (id/en) for all modal selector labels, descriptions, and tooltips.

## Capabilities

### New Capabilities
- `bpm-ocr-import-mode`: Configurable OCR diagram import mode allowing users to choose between Overwrite and Append (Below or Right) with automated collision-free layout and ID isolation.

### Modified Capabilities
<!-- None -->

## Impact

- Affected Frontend Components & Hooks:
  - `src/components/rcm/editor/BPMOcrModal.tsx`
  - `src/components/rcm/editor/ocr/useOcrStaging.ts`
  - `src/components/rcm/editor/ocr/OcrReviewView.tsx` (or review footer)
  - `src/components/rcm/editor/hooks/useBPMCanvasHandlers.ts`
  - Pure calculation utility for bounding box offset and ID re-mapping.
  - Localization files: `src/i18n/locales/en/bpm.json` and `src/i18n/locales/id/bpm.json`.
