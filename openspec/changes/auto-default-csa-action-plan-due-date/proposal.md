# Proposal: integrate-csa-ineffective-remediation-lifecycle

## Why
Under **Regulation SK-5/DKU.MBU/11/2024 (BAB IV And VA)**, when a control evaluation in CSA (Lini 1) or TOD verification (Lini 2) concludes as **Ineffective / Tidak Efektif**, the regulation mandates a connected lifecycle across defense lines:
1. *Auto-Trigger Remediation Lifecycle**: When CSA concludes as Ineffective, the system must formally record a Deficiency and trigger an Action Plan for the Control Owner.
2. **Audit Gatekeeper (BAB V.1.2 Hal. 54 point 3)**: Lini 3 (Internal Audit / Testing Workbench) must NOT perform testing (TOE) on controls that are Ineffective in CSA until they have been remediated and confirmed Effective.
3. **Realistic Timeline Default (BAB VI & VII)**: Since CSA worksheets test control execution without asking for future remediation deadlines, default remediation due dates must automatically fall back to the fiscal year-end (31 December of the working year) rather than resulting in 1/1/1970 epoch bugs.
4. **Actionable UI / Terminology**: In the Deficiency Kanban board, the button for Ineffective action plans must clearly read **Action Plan** instead of "Edit Plan".

## What Changes

3
## 1. End-to-End CSA Ineffective Lifecycle & Auto-Creation
- Ensure that whenever CSA or TOD concludes with Ineffective:
  - A `deficiencies` record is created/linked (source: "Lini 1 - CSA" or "Lini 2 - TOD Review").
  - An `action_plans` record is created in `workflowStatus: 'Ineffective'`.
  - Direct linkage to Kanban board in `/deficiencies`.

### 2. Audit Gatekeeper (Lini 3 Testing Freeze)
- In `src/pages/testing/TestWorkbench.tsx`, check if a control has an unresolved CSA ineffective deficiency:
  - Freeze / disable submission for Lini 3 TOE testing on that control.
  - Display a clear regulatory al¡ert: "Pengendalian Inefektif pada CSA. Menunggu penyelesaian remediasi Lini 1/2 sebelum dapat diuji Lini 3 (SK-5 BAB V Hal. 54)".

3## 3. Year-End Fallback for Action Plan Due Date
- In `worker/services/deficiency-service.ts`:
  - When auto-creating an `action_plans` record, default `dueDate` and `targetDate` to 31 December of the active fiscal year.
- In `src/components/deficiencies/DeficiencyCard.tsx`:
  - Safely guard against empty/null dates to eliminate the 1/1/1970 epoch glitch.
  - Fix `isOverdue` so it only triggers for valid past dates.

### 4. Kanban UI & Action Plan Terminology
- In `src/pages/deficiencies/DeficiencyBoard.tsx`, rename the action button from "Edit Plan" to "Action Plan".
- Update all associated localization keys in `src/i18n/locales/*/deficiency.json`.


## Verification Plan
1. Automated Unit Tests:
   - Verify `DeficiencyService.createAutoDeficiency` assigns 31 December default due date.
   - Verify Lini 3 testing gatekeeper skips/flags controls with active CSA deficiencies.
2. Frontend UI Verification:
  - Verify submitting an ineffectual CSA reflects in the Kanban board.
  - Verify due date displays 31 December (no 1970) and button displays "Action Plan".
  - Verify Test Workbench shows regulatory lock/warning on that control.
3. Mandat Penyelesaian Tahap: type-check, lint, test, build.