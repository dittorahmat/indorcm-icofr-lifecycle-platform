## 1. Data Backfill Tooling

- [x] 1.1 Create `scripts/backfill-controls-bpm.ts` with multi-step matching logic (name + GL + diagram link), `--dry-run` and `--apply` flags, and detailed console output.
- [x] 1.2 Test `scripts/backfill-controls-bpm.ts --dry-run` against the database and verify matching metrics without mutations.
- [x] 1.3 Add a run script entry in `package.json` (`npm run db:backfill-bpm`) and document execution steps for On-Premise VPS deployment.

## 2. Backend Scoping Fixes

- [x] 2.1 In `worker/services/rcm-matrix-service.ts`, update `getTlcMatrix` to enforce `noGL` filtering concurrently with `bpmProcessId` and `year`.
- [x] 2.2 In `worker/routes/rcm.ts`, verify `/rcm-matrix/itgc` supports application ID filtering or relevant BPM scoping.

## 3. Frontend BPM Modal Scoping

- [x] 3.1 In `src/components/bpm/BPMModal.tsx`, remove the loose orphan fallback (`!c.bpmProcessId && !cSub && c.fsliCodes?.includes(noGL)`), and require strict matching on `(bpmProcessId || (cSub === targetSub && c.fsliCodes.includes(noGL)))` along with `year`.
- [x] 3.2 In `src/components/bpm/BPMWorksheet.tsx`, apply identical strict filtering to prevent unlinked controls from appearing in the table.
- [x] 3.3 In `src/components/bpm/TransactionSamplingTab.tsx`, ensure `noGL`, `bpmProcessId`, and `year` are all passed and that reset only targets the scoped process.
- [x] 3.4 In `src/components/bpm/Lampiran6LogView.tsx`, eliminate blanket GL-level fallback so that only change logs for the active sub-process/BPM context are displayed.
- [x] 3.5 In `src/pages/rcm/RCMELCPage.tsx` and `src/pages/rcm/RCMITGCPage.tsx`, accept filtering props in embedded mode to restrict display to relevant controls/applications.

## 4. Verification & QA

- [x] 4.1 Run `npm run type-check` to verify zero TypeScript compilation issues.
- [x] 4.2 Run `npm run lint` to ensure strict code style compliance.
- [x] 4.3 Run `npm test` to verify no regressions in existing test suites.
- [x] 4.4 Add unit tests for `BPMModal` and `BPMWorksheet` control filtering to assert that controls with different `bpmProcessId` or different `noGL` never appear together.
