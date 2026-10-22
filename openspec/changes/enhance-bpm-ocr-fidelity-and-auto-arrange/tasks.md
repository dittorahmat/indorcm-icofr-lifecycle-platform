# Tasks

## 1. Remove Auto-Arrange & Secure Save CTA Visibility

- [x] 1.1 Remove the Auto-Arrange button and obsolete references from `src/components/rcm/editor/BPMCanvasToolbar.tsx`, `useBPMEditorHistory.ts`, and `BPMEditor.tsx`
- [x] 1.2 Restructure `src/components/rcm/editor/BPMCanvasToolbar.tsx` to isolate the Save action into a dedicated right cluster (`shrink-0`) and make tool items scroll independently in the left cluster
- [x] 1.3 Verify toolbar layout across 1024px, 1280px, and 1440px viewports ensuring the Save button is always fully visible

## 2. Unlinked Document Clearance & Layout Anti-Clumping

- [x] 2.1 Update `buildDepthMap` in `src/utils/ocr-lane-geometry.ts` to space unlinked sibling nodes sequentially by coordinate order instead of collapsing to rank 0
- [x] 2.2 Add unit test in `src/test/ocr-layout.test.ts` for multiple unlinked initial documents (e.g. KUR requirements: KTP, KK, Surat Usaha) verifying non-overlapping placement

## 3. Visual Comparison Reference in OCR Review

- [x] 3.1 Update `src/components/rcm/editor/BPMOcrModal.tsx` / `OcrReviewView.tsx` to provide split-view preview of the original source image alongside element review
- [x] 3.2 Verify source preview rendering and unit tests in `src/components/rcm/editor/ocr/__tests__/`

## 4. Verification & Regressions

- [x] 4.1 Run all repo guardrails (`npm run check:loc`, `npm run type-check`, `npm run check:any-delta`, `npm run lint`)
- [x] 4.2 Run complete test suite (`npm test`) to ensure zero regressions
