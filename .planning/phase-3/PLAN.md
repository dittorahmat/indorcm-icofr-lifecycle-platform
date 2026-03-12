# Phase 3: Testing & CSA - Implementation Plan

## Step 1: Complete CSA Validation Backend
- [ ] Implement `POST /api/csa/:id/validate` route in `worker/user-routes.ts`.
- [ ] Ensure validation updates `line2Status`, `line2Comments`, and `line2ValidatedDate`.
- [ ] Add audit trail entry for CSA validation.

## Step 2: Finalize Testing Workbench Persistence
- [ ] Verify `POST /api/tests` correctly saves `evaluationAttributes` (6 pilars).
- [ ] Implement `GET /api/tests` route to allow viewing testing history.
- [ ] Update `TestWorkbench.tsx` to display previously submitted test results.

## Step 3: Hardening Regulatory Logic
- [ ] Refactor `src/lib/compliance-utils.ts` to ensure `getSuggestedSampleRange` perfectly matches Table 22 for all frequencies (Daily, Weekly, Monthly, etc.).
- [ ] Ensure `isReadyForRemediationTest` (Table 23) correctly calculates waiting periods based on control frequency.
- [ ] Add visual indicators in `TestWorkbench.tsx` when a sample size deviates from Table 22 suggestions.

## Step 4: Line 1 / Line 2 / Line 3 Handover UI
- [ ] Add a "Submit for Review" status to controls after Line 1/2 complete CSA.
- [ ] Implement a "Ready for Testing" filter in `TestWorkbench.tsx` so Line 3 only tests validated controls.

## Verification Plan
- [ ] E2E Test: Line 1 Assessment -> Line 2 Validation -> Line 3 TOD/TOE.
- [ ] Logic Audit: Verify sample size suggestions against Table 22 for all frequencies.
- [ ] Persistence Check: Verify 6 pilar attributes are correctly saved and retrieved from the worker.
