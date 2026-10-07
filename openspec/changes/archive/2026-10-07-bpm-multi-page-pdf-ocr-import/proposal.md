## Why

Currently, the BPM OCR / Diagram Import system only processes the first page of uploaded PDF files (`renderPdfPageToImage(file, 1)`). In corporate BUMN and KAP audit practice, business processes are typically documented as multi-page PDFs where each page corresponds to a discrete phase or swimlane view interconnected with Off-Page connectors ("Ke hal X" / "Dari hal X").

Users who upload a multi-page PDF currently lose pages 2 and onward. They need the system to parse all pages of a multi-page PDF, generate corresponding discrete sheets in the diagram, and automatically link Off-Page Reference connectors across pages based on recognized connector labels.

## What Changes

- **Multi-Page PDF Parsing Pipeline**:
  - Enhance `diagram-parser.ts` to detect `pdf.numPages` and extract all pages sequentially into base64 images.
  - Implement batch / sequential OCR extraction across pages with progress indicators ("Memproses halaman 1 dari N...").
- **Multi-Page OCR Review & Staging**:
  - Update `BPMOcrModal.tsx` and staging state to support page pagination in review mode (`Halaman 1`, `Halaman 2`, dst.).
  - Allow users to review and adjust extracted nodes and edges per page before applying.
- **Auto-Linking Off-Page Connectors**:
  - Parse connector labels (e.g. "Ke hal 2", "Ke Sheet 2", "Dari hal 1") and automatically set `targetSheetId` / `targetSheetName` linking outgoing and incoming connectors across generated sheets.
- **Multi-Sheet Canvas Application**:
  - When the user applies the OCR result, populate each PDF page into its respective diagram sheet and switch between them smoothly.

## Capabilities

### New Capabilities
- `bpm-multi-page-ocr`: End-to-end multi-page PDF diagram extraction, per-page review modal, and automatic Off-Page connector link pairing across sheets.

### Modified Capabilities
<!-- No requirement changes to existing specs -->

## Impact

- **Frontend**:
  - `src/utils/diagram-parser.ts`: `renderAllPdfPagesToImages` utility with progress callback.
  - `src/components/rcm/editor/ocr/useOcrStaging.ts`: multi-page state, per-page parsed diagram storage, and batch apply.
  - `src/components/rcm/editor/BPMOcrModal.tsx` & subcomponents: multi-page review navigation and progress indicators.
  - `src/components/rcm/BPMEditor.tsx`: receive multiple sheets on OCR apply.
- **Backend**:
  - `/api/bpm-diagrams/ocr`: remains compatible, invoked per page image.
