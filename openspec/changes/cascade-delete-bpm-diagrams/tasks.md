## 1. Backend Implementation

- [x] 1.1 Update `deleteDiagram` in `worker/services/bpm-service.ts` to decouple `rcms.diagramId = null` and clean up `bpm_node_rcms` before deleting `bpm_diagrams`.
- [x] 1.2 Update `deleteProcess` in `worker/services/bpm-service.ts` to check for remaining processes sharing the sub-process name, and cascade delete associated diagrams if none exist.
- [x] 1.3 Ensure `bpm_process_gl_codes` are explicitly deleted when deleting `bpm_processes`.

## 2. Testing & Verification

- [x] 2.1 Add or update unit tests in `test/bpm-service.test.ts` (or relevant test suite) covering cascade diagram deletion and foreign key decoupling.
- [x] 2.2 Run full validation suite (`npm run type-check`, `npm run lint`, `npm test`, `npm run build`).
