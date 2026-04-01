## 1. Data Model & Backend Sync

- [x] 1.1 Update `ActionPlan` interface in `shared/types.ts` with new regulatory fields.
- [x] 1.2 Update `ActionPlanStatus` type to include `In Review`.
- [x] 1.3 Add `isBeforeYearEnd` helper utility in `lib/compliance-utils.ts`.

## 2. UI Foundation Updates

- [x] 2.1 Update `KANBAN_COLUMNS` in `DeficiencyBoard.tsx` to reflect the new 5-state workflow.
- [x] 2.2 Modify `DeficiencyCard.tsx` to display `PIC` and `Function` badges.
- [x] 2.3 Implement role-based visibility for "Approve/Reject" buttons in `DeficiencyBoard.tsx`.

## 3. Remediation Workflow Implementation

- [x] 3.1 Create `RemediationForm` component with Zod validation for mandatory fields.
- [x] 3.2 Implement "Submit for Review" mutation logic for Lini 1.
- [x] 3.3 Implement "Approve/Reject" mutation logic for Lini 2.
- [x] 3.4 Update `planMutation` in `DeficiencyBoard.tsx` to handle new status transitions and timing capture.

## 4. Verification & Validation

- [x] 4.1 Verify mandatory field validation prevents saving incomplete plans.
- [x] 4.2 Validate that Deficiency status syncs correctly when Action Plan reaches `Verified`.
- [x] 4.3 Ensure year-end timing is correctly calculated and stored.

