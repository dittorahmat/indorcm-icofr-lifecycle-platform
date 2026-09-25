## 1. Backend Snapshot Enrichment

- [x] 1.1 In `worker/services/control-service.ts`, verify that `create`, `update`, and `approve` actions capture `bpmProcessId` and `subProcess` in `dataAfter`/`dataBefore` audit records.
- [x] 1.2 In `worker/routes/audit.ts`, verify query support for subProcess or fetch endpoint handling, ensuring both Line 1 and Line 2 have appropriate RBAC read access to `/api/change-logs`.

## 2. Frontend Component Refactoring

- [x] 2.1 In `src/components/bpm/Lampiran6LogView.tsx`, update `Lampiran6LogViewProps` to accept `bpmProcessId`, `subProcessName`, `year`, and optional `entityId`.
- [x] 2.2 In `src/components/bpm/Lampiran6LogView.tsx`, refactor the query filter logic to match logs by `subProcessName`, `bpmProcessId`, or `entityId`, adhering strictly to anti-slop guidelines (solid surfaces, min 12px font, enterprise badges).
- [x] 2.3 In `src/components/bpm/BPMModal.tsx`, update the `<Lampiran6LogView>` invocation to pass `bpmProcessId={bpmProcessId}`, `subProcessName={subProcessName}`, and `year={year}`.

## 3. Verification & Compliance Validation

- [x] 3.1 Run `npm run type-check` and verify TypeScript compilation passes with zero errors.
- [x] 3.2 Run `npm run lint` and verify code style checks pass cleanly.
- [x] 3.3 Run `npm test` and verify that all test suites pass without regression.
