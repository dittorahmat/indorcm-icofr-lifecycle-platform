# Design

## Context

Current limitations observed on real-world multi-page BUMN workflows (`BPM_Persetujuaan_Kredit_KUR_20260831.pdf`):
1. **Redundant & Destructive Auto-Arrange Button**:
   `autoArrangeBpmDiagram` in `src/utils/bpm-auto-layout.ts` uses an outdated topological BFS layout. Clicking "Auto Arrange" on an imported diagram scrambles the diagram, destroying manual adjustments and creating cross-edge tangles. Layout should happen once during import; manual reorganization is handled by users with `Fit View` for camera navigation.
2. **Toolbar Overflow**:
   `src/components/rcm/editor/BPMCanvasToolbar.tsx` has numerous action buttons placed inline. On viewports around 1280px with scaling, the rightmost action cluster (Save button) gets pushed off-screen.
3. **Unlinked Document Stacking in OCR Import**:
   In process starts, OCR engines identify multiple input documents (e.g., KTP, KK, Surat Usaha) with no direct edge between them. When incoming/outgoing degrees are zero, topological depth defaults to 0 for all of them, causing them to stack on top of one another unless sequential clearance is enforced.
4. **Visual Comparison Need**:
   Users need a visual anchor to compare recognized nodes with original scanned PDFs.

## Goals / Non-Goals

**Goals:**
- Remove the destructive "Auto Arrange" button from the canvas toolbar and codebase (YAGNI & dead code removal).
- Pin the Save CTA and primary actions in `BPMCanvasToolbar.tsx` using responsive layout (`flex-1` scrollable tool area with sticky/isolated primary action right-bar).
- Guarantee proper vertical and horizontal separation for unlinked sibling document nodes during OCR layout.
- Retain the source document preview URL in review staging and provide side-by-side reference verification.

**Non-Goals:**
- Completely rewriting the OCR vision extraction backend prompt.
- Automated pixel-by-pixel computer vision alignment tool in this phase (focus on human-inspectable side-by-side reference view + layout stability).

## Decisions

### 1. Removal of Auto-Arrange Button (YAGNI & Anti-Regression)
- **Decision**: Remove the Auto Arrange button and handler (`handleAutoArrange`) from `BPMCanvasToolbar.tsx`, `useBPMEditorHistory.ts`, and `BPMEditor.tsx`.
- **Rationale**: Auto-layout is deterministic upon import. Providing an ad-hoc button that resets manual arrangements is a user-experience hazard and wastes valuable toolbar space.

### 2. Toolbar Sticky/Split Layout
- **Decision**: In `BPMCanvasToolbar.tsx`, split the toolbar into:
  - Left/Center area (`overflow-x-auto min-w-0 flex-1`): Undo/Redo, Fit to Screen, Zoom, Document View, GL Context, Import tools.
  - Right cluster (`shrink-0 flex items-center gap-2 pl-2 border-l border-slate-200 bg-background`): Locked indicator and **Save button**.
  This guarantees the Save button is permanently visible regardless of screen width.

### 3. Clearance for Unlinked Sibling Documents in OCR Layout
- **Decision**: In `buildDepthMap` (`ocr-lane-geometry.ts`), unlinked nodes without edges should not all get assigned rank 0 simultaneously. Instead, sort unlinked nodes by initial Y/X coordinates and increment their assigned depth rank sequentially, ensuring each document gets its own vertical row with $\ge 50\text{px}$ clearance.

### 4. Side-by-Side Review Split View
- **Decision**: In `src/components/rcm/editor/BPMOcrModal.tsx`, ensure the source preview image is displayed in a collapsible or split panel beside the parsed node/edge review tabs, allowing direct visual fidelity checks before applying to canvas.

## Risks / Trade-offs

- **[Risk]** Users missing an auto-arrange function after manual edits.
  → *Mitigation*: Users who want to start clean can simply re-import or re-stage via the OCR wizard, which applies optimal layout deterministically.
