## Why

When users open the BPM Worksheet (Execution Hub modal) for a specific Sub-Process, GL account, and working fiscal year, several tabs leak cross-BPM data or fail to scope data to the active context. Specifically:
- **Verification Design tab** fails to filter by BPM process because of a frontend/backend query parameter mismatch (`?bpmId=` vs `?bpmProcessId=`), causing all controls across the entire organization to be shown. It also lacks `year` and `noGL` scoping.
- **Worksheet tab** receives `workingYear` prop but does not pass it into the controls query or filter, risking cross-year data display and multi-year leakage.
- **RCM tab (TLC matrix)** does not pass `noGL` to the query, and ITGC does not pass `year`.
- **Logs tab (Lampiran 6)** only filters by `entityId=noGL`, missing `year` and sub-process scoping.

Standardizing and fixing the scoping ensures compliance with Regulation SK-5/DKU.MBU/11/2024 and prevents audit data contamination across processes, accounts, and reporting periods.

## What Changes

- **Fix Verification Design Filtering**: Align query parameter name to `bpmProcessId` in `VerificationDesignPage.tsx` and ensure backend endpoint `/api/rcm-matrix/verification-design` scopes properly by `bpmProcessId`, `year`, and optionally `noGL`.
- **Enforce Fiscal Year Scoping in Worksheet Tab**: Pass `workingYear` into `/api/controls` query key and request params, ensuring the worksheet only displays controls effective for the selected fiscal year.
- **Scope TLC & ITGC Matrix in RCM Tab**: Pass `workingYear` and `noGL` into `RCMTLCPage` and `RCMITGCPage` within `BPMModal.tsx`.
- **Scope Audit Trail Logs (Lampiran 6)**: Filter change logs by fiscal year and related process context in addition to `noGL`.

## Capabilities

### Modified Capabilities
- `bpm-execution-hub`: Add strict context isolation requirements ensuring all Execution Hub tabs (Worksheet, Sampling, RCM, CSA, Verification Design, Logs) strictly scope data by `bpmProcessId`, `noGL`, and `workingYear`.

## Impact

- **Frontend**:
  - `src/components/bpm/BPMModal.tsx`
  - `src/components/bpm/BPMWorksheet.tsx`
  - `src/pages/rcm/VerificationDesignPage.tsx`
  - `src/pages/rcm/RCMTLCPage.tsx`
  - `src/pages/rcm/RCMITGCPage.tsx`
  - `src/components/bpm/Lampiran6LogView.tsx`
- **Backend API**:
  - `worker/routes/rcm.ts` (`/rcm-matrix/verification-design`, `/rcm-matrix/itgc`, `/rcm-matrix/tlc`)
  - `worker/routes/controls.ts` (`/controls` year filter support)
