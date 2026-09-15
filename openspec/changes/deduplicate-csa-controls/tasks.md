## 1. Deduplicate Controls in CSA Review Matrix

- [x] 1.1 In `src/pages/csa/CSAPage.tsx`, wrap `matrixData?.items` with a memoized deduplication filter by `controlId` so that each unique control appears only once per sub-process, and verify in the table that repeated controls are collapsed into a single row.

## 2. Improve Transaction Sample Reference Presentation

- [x] 2.1 In `src/components/csa/CSAReviewMatrix.tsx`, update sample column headers in `TableHead` to display transaction reference badges with adequate min-width and clear typography, and verify headers render without excessive truncation.

## 3. Validation & Quality Checks

- [x] 3.1 Run `npm run type-check` and ensure no TypeScript errors exist.
- [x] 3.2 Run `npm run lint` and verify code passes linter rules.
- [x] 3.3 Run `npm run build` and ensure successful production build.
- [x] 3.4 Run `npm test` and verify automated tests pass without regression.
