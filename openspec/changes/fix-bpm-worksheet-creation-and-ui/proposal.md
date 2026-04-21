## Why

Users are unable to successfully add new rows to the BPM Control Worksheet because the backend fails to persist the link to the BPM process (`bpmProcessId`). Additionally, UI translation keys are being displayed as literal strings, and Line 1 users are currently blocked from contributing to the worksheet.

## What Changes

- **Backend Persistence**: Modify `POST /api/controls` to save the `bpmProcessId` received from the frontend.
- **Access Control**: Update `POST /api/controls` to allow `Line 1` users to create controls (currently restricted to Line 2/Admin).
- **Workflow Endpoints**: Implement missing `/api/controls/:id/submit-for-approval` and `/api/controls/:id/reject` endpoints.
- **UI Localization**: Fix `i18n` namespace usage in `BPMWorksheet.tsx` to correctly load the `bpm` namespace.
- **UI Enhancement**: Update the Worksheet header to display more granular details including the Account Name and Account Code (`noGL`).
- **Terminology**: Rename "Add New Row" to "Add Row In Worksheet" in translation files.

## Capabilities

### New Capabilities
- `bpm-worksheet-management`: Comprehensive lifecycle of control activity mapping within the BPM worksheet, including row creation, cross-department access for Lini 1, and regulatory sign-off workflow.

### Modified Capabilities
- None

## Impact

- **Backend**: `worker/user-routes.ts` API logic.
- **Frontend**: `BPMWorksheet.tsx` component and `bpm.json` translation files.
- **Database**: The `controls` table (field persistence).
