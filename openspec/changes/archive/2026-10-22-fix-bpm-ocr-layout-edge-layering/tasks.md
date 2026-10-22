# Tasks

## 1. Dynamic Swimlane & Anti-Clumping Layout

- [x] 1.1 Update `src/utils/ocr-lane-geometry.ts` to calculate dynamic lane widths based on maximum parallel rank nodes and verify unit tests in `src/test/ocr-layout.test.ts`
- [x] 1.2 Refactor `src/utils/ocr-layout.ts` vertical rank spacing (`targetY >= lastUsedY + 50`) and horizontal sibling node distribution (spacing >= 40px)
- [x] 1.3 Add test cases in `src/test/ocr-layout.test.ts` verifying that parallel branches and dense node sets do not overlap and swimlanes expand appropriately

## 2. Edge Layer Elevation & Arrowhead Alignment

- [x] 2.1 Update `src/components/rcm/editor/canvas-hydration.ts` to standardize node `zIndex` to 5 for standard nodes while keeping swimlanes at -1 and badges at 20
- [x] 2.2 Update `src/components/rcm/editor/BPMCanvas.tsx` to elevate `.react-flow__edges` layer (`z-index: 10`) above node cards
- [x] 2.3 Verify edge arrowhead alignment in `src/components/rcm/edges/geometry/orthogonal-router.ts` and ensure edge tests pass via `npm test -- src/components/rcm/edges`

## 3. Verification & Regressions

- [x] 3.1 Run code quality checks (`npm run check:loc`, `npm run type-check`, `npm run lint`) and ensure no regressions
- [x] 3.2 Run full test suite (`npm test`) to verify all BPM layout and canvas edge tests pass
