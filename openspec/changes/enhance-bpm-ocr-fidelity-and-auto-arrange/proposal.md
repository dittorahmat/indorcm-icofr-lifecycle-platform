# Proposal

## Why

When users upload realistic BUMN process flowcharts (e.g. `BPM_Persetujuaan_Kredit_KUR_20260831.pdf`), diagrams with dense unlinked documents or multi-branch flows still suffer from layout clumping on initial OCR import. Crucially, the toolbar currently features an "Auto Arrange" button that calls an obsolete layout algorithm (`bpm-auto-layout.ts`), which destroys manual adjustments and scrambles the entire canvas; removing this redundant button eliminates visual regressions and immediately reclaims toolbar horizontal space. Furthermore, the toolbar action cluster containing the "Save Workflow" CTA gets pushed outside the viewport on laptop screens without easy scrolling. Storing input images with a side-by-side verification foundation will allow users and AI to visually audit diagram extraction quality against original documents.

## What Changes

- **Remove Redundant "Auto Arrange" Button & Obsolete Layout Code**:
  - Remove the Auto Arrange button from `BPMCanvasToolbar.tsx` and deprecate/retire `src/utils/bpm-auto-layout.ts`. Auto-layout occurs once deterministically on OCR import; manual canvas reorganization is driven by user intention and Fit to Screen (`fitView`).
- **Toolbar Responsiveness & Save CTA Visibility**:
  - Reclaim toolbar width by removing Auto Arrange, and isolate the primary action cluster (Locked status & Save button) into a fixed right cluster (`shrink-0`) so the Save CTA is permanently visible and reachable across laptop screens.
- **Support Unlinked Document Bundles in OCR Lane Layout**:
  - Enhance `ocr-lane-geometry.ts` and `ocr-layout.ts` to detect unlinked document nodes (e.g., KTP, KK, Formulir clusters in KUR) and distribute them with adequate vertical and horizontal clearance even when no direct edge connects them.
- **Original Document / Image Persistence & Side-by-Side Review**:
  - Persist source image/preview URLs in diagram staging and metadata so users can inspect original input documents alongside generated diagrams for visual fidelity verification.

## Capabilities

### New Capabilities
- `bpm-visual-comparison`: Capability for persisting source diagram images/documents and providing split-view or reference comparison against rendered canvas nodes.

### Modified Capabilities
- `bpm-multi-page-ocr`: Expand OCR layout to gracefully handle unlinked document clusters and guarantee persistent visibility of primary workflow actions.

## Impact

- Modified files:
  - `src/components/rcm/editor/BPMCanvasToolbar.tsx` (remove Auto Arrange, isolate Save CTA)
  - `src/components/rcm/editor/hooks/useBPMEditorHistory.ts` & `src/components/rcm/BPMEditor.tsx` (clean up unused auto-arrange handler)
  - `src/utils/bpm-auto-layout.ts` (retire obsolete auto-layout logic)
  - `src/utils/ocr-lane-geometry.ts` & `src/utils/ocr-layout.ts` (unlinked document cluster clearance)
  - `src/components/rcm/editor/ocr/useOcrStaging.ts` & `src/components/rcm/editor/BPMOcrModal.tsx` (source document persistence and comparison view)
  - Unit tests across `src/test/` and `src/components/rcm/`
