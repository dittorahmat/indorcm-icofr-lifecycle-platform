## 1. Setup

- [x] 1.1 Add `VITE_ENABLE_WORKFLOW_APPROVAL` to `.env` (default to true)
- [x] 1.2 Update `vite-env.d.ts` to include the new environment variable for type safety

## 2. WorkflowPanel Implementation

- [x] 2.1 Update `WorkflowPanel.tsx` to read `VITE_ENABLE_WORKFLOW_APPROVAL`
- [x] 2.2 Implement the Demo Mode UI (Amber banner/warning)
- [x] 2.3 Implement the "Bypass Approval" button that calls `onApprove`
- [x] 2.4 Ensure the standard workflow UI is hidden when bypass mode is active

## 3. Verification

- [x] 3.1 Verify bypass functionality in ScopingPage
- [x] 3.2 Verify bypass functionality in BPMPage
- [x] 3.3 Verify bypass functionality in RemediationForm
- [x] 3.4 Verify that setting the env var to `true` restores original behavior
