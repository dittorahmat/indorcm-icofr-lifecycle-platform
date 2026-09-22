## 1. Swimlane Header Clearance & Safe Altitude Enforcement

- [x] 1.1 In `BridgeEdge.tsx`, introduce `SAFE_HEADER_CEILING` constant ($Y \ge 95\text{px}$) and ensure all backward-loop, exit, and intermediate waypoints never rise above this ceiling. Verify via visual inspection and unit tests.
- [x] 1.2 In `ocr-layout.ts`, update `HEADER_OFFSET` to ensure first-row nodes are placed at least $100\text{px}$ below swimlane top, preventing edges from hugging the header boundary.

## 2. Anti-Overlap Bus Channel Routing for Parallel Edges

- [x] 2.1 In `BridgeEdge.tsx`, implement parallel edge detection and channel offset allocation so that collinear horizontal or vertical segments between nodes receive an indexed offset of 18px–24px.
- [x] 2.2 Verify that multiple cross-swimlane lines (such as documents to approval, or approvals to archive) do not overlap or render as single merged lines.

## 3. Directional Handle Selection & OCR Prompt Alignment

- [x] 3.1 In `ocr-layout.ts`, optimize cross-lane handle pairing so horizontal flows prefer `right` -> `left` ports and decision outputs (`SETUJU` / `TIDAK`) cleanly exit from left/right/bottom without cutting through node shapes.
- [x] 3.2 In `worker/routes/bpm.ts`, reinforce OCR prompt guidance for bundling stacked documents (e.g. Formulir + KTP + Emas) and assigning clean directionality.

## 4. Verification & Regression Testing

- [x] 4.1 Update `src/test/ocr-layout.test.ts` to assert that all node Y positions respect header clearance and cross-lane edges have distinct non-colliding coordinates.
- [x] 4.2 Run full validation suite (`npm run type-check`, `npm run lint`, `npm run build`, `npm test`) and verify that all checks pass without errors.
