## 1. Backend OCR Extraction Enhancement

- [x] 1.1 Update `worker/routes/bpm.ts` system prompt to enforce column boundary partitioning (assigning `parentId` accurately based on horizontal lane slices) and verify with typescript type-check.
- [x] 1.2 Update `worker/routes/bpm.ts` prompt to consolidate stacked documents into single `multi-document` nodes with multiline text labels, and clarify SOP shapes (inverted trapezoid = `manual-operation`, inverted triangle = `archive`).

## 2. Frontend Deterministic Layout Hardening

- [x] 2.1 Implement spatial geometric snapping in `src/utils/ocr-layout.ts` (fallback snapping node to swimlane if `parentId` is absent or mismatched using normalized horizontal coordinates) and verify unit test passes.
- [x] 2.2 Increase row height spacing and adaptive collision prevention in `src/utils/ocr-layout.ts` (ensure dynamic vertical clearance based on node height to eliminate overlapping text) and verify layout output.
- [x] 2.3 Refine decision branch edge label styling and offset routing in `src/utils/ocr-layout.ts` to prevent crossing overlaps.

## 3. Verification & Compliance Mandate

- [x] 3.1 Run `npm run type-check` to verify complete type safety across frontend and worker.
- [x] 3.2 Run `npm run lint` and `npm test` to ensure zero regressions in diagram and OCR test suites.
- [x] 3.3 Verify build with `npm run build`.
