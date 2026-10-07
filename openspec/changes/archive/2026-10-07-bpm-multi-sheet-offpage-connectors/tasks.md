## 1. Domain Types & State Adapters

- [x] 1.1 Define `BPMDiagramSheet` and multi-sheet metadata types in `shared/types/rcm-bpm.ts` and verify unit test passes
- [x] 1.2 Implement `normalizeDiagramSheets` adapter for transparent single-sheet / multi-sheet fallback in `src/components/rcm/editor/utils/diagram-sheet-adapter.ts` and verify with unit tests

- [x] 1.3 Extend `useBPMEditorState` to support multi-sheet state, active sheet switching, sheet additions/renaming, and verify state preservation across switches

## 2. Canvas UI & Sheet Management

- [x] 2.1 Implement `BPMCanvasSheetTabBar.tsx` with institutional styling, tab switching, sheet renaming, and add/delete actions, and verify responsive layout
- [x] 2.2 Integrate `BPMCanvasSheetTabBar` into `BPMEditor.tsx` without violating file LOC limits (under 350 LOC) and verify render
- [x] 2.3 Upgrade `OffPageRefNode` in `src/components/rcm/nodes/ProcessNodes.tsx` with sheet link configuration properties and click-to-jump trigger, and verify in-canvas tab switching

## 3. Multi-Page PDF Export with Hyperlinks

- [x] 3.1 Refactor `exportBpmToPdf` in `src/components/rcm/editor/utils/export-bpm-pdf.ts` to sequentially render each sheet onto an A4 landscape page and verify page numbers
- [x] 3.2 Calculate Off-Page node bounding box coordinates in PDF millimeter space and attach `pdf.link(...)` internal page jump annotations, and verify with automated tests
- [x] 3.3 Add progress toast/indicator during multi-sheet PDF rendering to ensure smooth UX and verify error handling

## 4. OCR / Import Mode Differentiation & Verification

- [x] 4.1 Update `BPMOcrModal.tsx` and staging selectors to distinguish between single-canvas and multi-sheet import modes and verify mode selection
- [x] 4.2 Verify full test suite, LOC bounds (`npm run check:loc`), and TypeScript compile (`npm run type-check`)


