## Context

See `proposal.md` for background and motivation. The current canvas implementation stores a single diagram (`nodes` and `edges`) per row in `bpm_diagrams`. Both columns are `jsonb`, and there is an additional `metadata` column (`jsonb`). The frontend orchestrator `BPMEditor.tsx` delegates state handling to `useBPMEditorState.ts`, loader to `useBPMDiagramLoader.ts`, and PDF export to `src/components/rcm/editor/utils/export-bpm-pdf.ts`.

## Goals / Non-Goals

**Goals:**
- Provide zero-downtime, non-breaking multi-sheet data structuring stored in `bpm_diagrams.metadata.sheets`.
- Enable full CRUD for canvas sheets (Add, Rename, Delete, Reorder, Switch).
- Provide interactive off-page connector configuration linking outgoing nodes (`Ke hal X`) to target incoming nodes (`Dari hal X`) with in-canvas jump navigation.
- Implement multi-page PDF generation with `jsPDF` using `pdf.addPage()` and clickable internal link annotations (`pdf.link(x, y, w, h, { pageNumber })`).
- Keep all touched and new source files strictly within repository quality constraints (LOC limits: soft 400 LOC, hard 600 LOC, institutional design styling).

**Non-Goals:**
- DDL database migrations (existing `jsonb` fields are sufficient).
- Changing RCM control ID structure or altering database table `bpm_node_rcms`.
- Cross-diagram linking across separate `diagramId`s (connector links remain scoped to sheets within the same sub-process diagram).

## Decisions

### Decision 1: Metadata Sheet Adapter vs Schema DDL
- **Choice**: Store multi-sheet state under `diagram.metadata.sheets: BPMDiagramSheet[]` with runtime adapter fallback in frontend/service.
- **Rationale**: Prevents destructive database migrations and allows immediate zero-downtime backward compatibility. If `metadata.sheets` is empty or undefined, the loader automatically wraps `diagram.nodes` and `diagram.edges` into a single virtual sheet (`Sheet 1`).
- **Alternative considered**: Adding a new PostgreSQL table `bpm_diagram_sheets`. Rejected because it introduces migration complexity and breaks existing JSON snapshot restores.

### Decision 2: Dedicated Sheet Tab Bar Component
- **Choice**: Extract sheet tabs into an isolated presentation component `BPMCanvasSheetTabBar.tsx` rather than cluttering `BPMCanvasToolbar.tsx` or `BPMEditor.tsx`.
- **Rationale**: Respects single-responsibility and keeps `BPMEditor.tsx` within LOC bounds (<350 LOC).

### Decision 3: PDF Internal Link Generation via `jsPDF.link`
- **Choice**: Capture each sheet snapshot sequentially using `toPng` on `#bpm-document-canvas` while keeping track of `off-page-ref` node bounding boxes in canvas space, scaling them into millimeter coordinates on the PDF page, and calling `pdf.link(x, y, w, h, { pageNumber })`.
- **Rationale**: Enables native clickable navigation in standard PDF readers (Adobe Acrobat, Chrome/Edge PDF viewer) without external heavy libraries.

## Risks / Trade-offs

- **[Risk] High canvas node counts across multiple sheets memory consumption** → Mitigation: Only mount and render the active sheet's nodes in React Flow DOM. Keep other sheets in memory as plain JSON data arrays until switched.
- **[Risk] PDF snapshot rendering delay for multiple sheets** → Mitigation: Show progressive export modal progress indicators (e.g. "Rendering sheet 1 of 3...") and sequential headless snapshot rendering before saving PDF.
- **[Risk] Broken Off-Page connector references if a target sheet is deleted** → Mitigation: When deleting a sheet, detect referring connectors and show a confirmation prompt, clearing or flagging orphan links.
