## 1. Multi-Page PDF Extraction Utilities

- [x] 1.1 Implement `renderAllPdfPagesToImages` in `src/utils/diagram-parser.ts` to detect `numPages` and extract all pages with progress callback, and verify with unit tests
- [x] 1.2 Implement `pairOffPageConnectors` utility in `src/components/rcm/editor/utils/connector-link-matcher.ts` to parse "Ke hal X" / "Dari hal X" and link sheet IDs, and verify with unit tests


## 2. Multi-Page OCR Staging & API Batching

- [x] 2.1 Extend `useOcrStaging.ts` to support multi-page parsed results (`pages: OcrParsedPage[]`), active review page pagination, and sequential OCR API calls
- [x] 2.2 Update `BPMOcrModal.tsx` and review tabs to include page switcher (`Halaman 1`, `Halaman 2`, etc.) and processing progress indicators
- [x] 2.3 Wire multi-sheet batch apply from `BPMOcrModal` to `BPMEditor.tsx` / `useBPMSheets.ts` and verify multi-sheet canvas population

## 3. Verification & Compliance Gates


- [x] 3.1 Verify unit test suite for multi-page extraction and connector matcher
- [x] 3.2 Verify LOC bounds (`npm run check:loc`), TypeScript compile (`npm run type-check`), and build (`npm run build`)

