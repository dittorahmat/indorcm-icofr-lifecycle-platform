## Context

See `proposal.md` for background. The existing `renderPdfPageToImage(file, 1)` only processes the first page. The OCR endpoint `/api/bpm-diagrams/ocr` receives `{ image: base64DataUrl }` and returns `{ nodes, edges }`. The frontend staging hook `useOcrStaging.ts` manages review state.

## Goals / Non-Goals

**Goals:**
- Extract all pages of a multi-page PDF into images in browser memory sequentially.
- Perform sequential OCR requests per page with a responsive progress indicator.
- Automatically link Off-Page Reference nodes matching "Ke hal X" / "Dari hal X" regex to their target sheets.
- Deliver an array of sheets directly to the BPM Editor on apply.
- Keep components under the repository 400 LOC soft limit.

**Non-Goals:**
- Heavy backend PDF rasterization dependencies (client-side `pdfjs-dist` already does this reliably).
- Merging nodes from different pages into a single horizontal canvas (they are explicitly partitioned into multi-sheets).

## Decisions

### Decision 1: Sequential Page Rendering & OCR API Pipeline
- **Choice**: Loop through pages `1..numPages` client-side, sending each page to `/api/bpm-diagrams/ocr` sequentially.
- **Rationale**: Prevents hitting Cloudflare Workers body payload limits or Gemini Vision timeout limits if sending multiple large images at once. Shows granular progress per page.

### Decision 2: Connector Regex Link Matcher
- **Choice**: Pure utility function `pairOffPageConnectors(sheets: BPMDiagramSheet[])` that matches `/(?:ke\s*hal(?:aman)?|to\s*page)\s*(\d+)/i` and attaches `targetSheetId: sheets[targetIdx].id`.
- **Rationale**: Decouples logic from UI, enabling 100% unit test coverage.

## Risks / Trade-offs

- **[Risk] High memory usage for PDFs with 10+ pages in browser** → Mitigation: Limit batch processing to max 10 pages per upload, and release canvas memory immediately after generating data URLs.
- **[Risk] Rate limits or latency on Gemini Vision API for multiple pages** → Mitigation: Sequential requests with 300ms pause between pages and clear cancel button.
