## Why

Currently, BPM (Business Process Mapping) diagrams in IndoGRC are modeled within a single canvas. For complex business processes with numerous sequential activities across multiple roles, the diagram stretches excessively to the right horizontally. This makes viewing on typical screens cumbersome (requiring extreme zoom-out that renders text unreadable) and produces poorly scaled or clipped PDF exports when adhering to standard BUMN regulatory reporting formats.

KAP (Kantor Akuntan Publik) audit documentation addresses this by scoping each PDF page / print sheet to a discrete phase or swimlane view, connecting sequential sheets using **Off-Page Connectors** (as defined in **Lampiran 3 SK-5/DKU.MBU/11/2024**). Introducing multi-sheet modular diagrams with interactive off-page connectors solves the horizontal sprawl problem while remaining fully backward compatible with legacy single-canvas diagrams.

## What Changes

- **Multi-Sheet BPM Canvas Data Model**: Support diagrams containing multiple sheets (`sheets: [{ id, name, nodes, edges }]`) stored seamlessly in `bpm_diagrams.metadata` with transparent fallback for legacy single-canvas diagrams.
- **Interactive Sheet Tab Bar**: Provide an intuitive tab bar (`Sheet 1`, `Sheet 2`, `[+] Tambah Sheet`) within `BPMEditor` enabling switching, renaming, adding, and removing sheets.
- **Interactive Off-Page Reference Node (Lampiran 3 SK-5)**: Upgrade the existing pentagonal `OffPageRefNode` ("Ke hal X" / "Dari hal X") with linking capabilities:
  - Select target sheet and optional destination node.
  - Interactive click navigation in canvas: clicking the connector instantly switches to the target sheet and focuses/highlights the target node.
- **Multi-Page PDF Export with Hyperlinks (Lampiran 4 SK-5)**:
  - Sequentially export each sheet to a discrete landscape page (with compliant headers: "Hal 1 dari N", "Hal 2 dari N").
  - Embed clickable internal PDF link annotations (`pdf.link(...)`) over Off-Page Reference nodes so auditors reviewing exported PDFs in Adobe Acrobat or web browsers can click connectors to navigate between pages.
- **BPM OCR / Import Mode Differentiation**: Differentiate between Single-Canvas (legacy multi-swimlane) and Multi-Sheet imports during diagram upload and OCR processing.

## Capabilities

### New Capabilities
- `bpm-multi-sheet`: Multi-sheet BPM diagram architecture, tab navigation, Off-Page reference node linking, and interactive multi-page PDF generation with internal jump links.

### Modified Capabilities
<!-- No requirement changes to existing specs -->

## Impact

- **Frontend**:
  - `src/components/rcm/BPMEditor.tsx` and sub-hooks (`useBPMEditorState`, `useBPMDiagramLoader`, `useBPMEditorPersistence`).
  - `src/components/rcm/nodes/ProcessNodes.tsx` (OffPageRefNode interactivity and target sheet binding).
  - `src/components/rcm/editor/BPMCanvasToolbar.tsx` or dedicated `BPMCanvasSheetTabBar.tsx`.
  - `src/components/rcm/editor/utils/export-bpm-pdf.ts` (multi-page rendering and internal PDF hyperlink annotations).
  - `src/components/rcm/editor/BPMOcrModal.tsx` & OCR staging components.
- **Backend / Database**:
  - Zero DDL schema changes: leverages existing `jsonb` columns (`nodes`, `edges`, `metadata`) on `bpm_diagrams`.
  - RCM mapping linkages (`bpm_node_rcms`) remain intact as `nodeId` integrity is preserved.
