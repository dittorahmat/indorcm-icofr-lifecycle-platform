## Why

In the ICOFR lifecycle (aligned with Regulation SK-5/DKU.MBU/11/2024), automated controls and hybrid ITDM controls in business processes often rely on specific enterprise IT systems (Significant Applications). Currently, the application linkage in the Control Editor/BPM Worksheet is disconnected from the inventory on the `/applications` page, and the `/applications` page lacks interactive drilldown capabilities to inspect linked TLC/ITGC controls and audit evidence libraries per ITGC domain.

This change introduces optional Significant Applications linkage during control definition with quick inline creation, along with an interactive 6-tab modal on `/applications` to view linked TLC controls, linked ITGC controls, and ITGC evidence file repositories (Access to Program & Data, Program Changes, Program Development, Computer Operations) with upload history logs and file preview.

## What Changes

- **BPM / Control Editor Enhancement**:
  - Add an optional "Significant Applications" selection between `Sifat Pengendalian (controlNature)` and `Frekuensi (frequency)` in the Control Editor / Regulatory Property Sheet.
  - Populate the dropdown from `/api/applications` with inline "+ Add New Application" capability so users don't need to leave the BPM editor.
  - Maintain data independence: deleting a control does not delete or alter the application record.
- **Revamp `/applications` Page & Application Detail Modal**:
  - Clicking an application row opens a comprehensive detail modal with 6 tabs:
    - **Tab 1: RCM TLC** - All transaction-level controls linked to this application.
    - **Tab 2: RCM ITGC** - All ITGC controls linked to this application.
    - **Tab 3: Access to Program and Data** - Document library with upload, uploader & timestamp logs, download, and file preview (PDF & Images).
    - **Tab 4: Program Changes** - Document library for changes (RFC, UAT, CAB, etc.) with upload, logs, and preview.
    - **Tab 5: Program Development** - Document library for SDLC/development with upload, logs, and preview.
    - **Tab 6: Computer Operations** - Document library for operations (jobs, backup/restore, DRP) with upload, logs, and preview.
  - Seamless navigation to jump to the corresponding RCM/BPM view with return navigation / open in new tab support.
- **Backend & Persistence**:
  - Schema support for application evidence documents (`application_documents` / ITGC evidence repository) with organization isolation, file metadata, uploader audit, and timestamps.
  - API endpoints for listing and uploading application-specific evidence documents across the 4 ITGC domains.

## Capabilities

### New Capabilities
- `rcm/significant-applications`: Covers Significant Application linking in BPM/Control editor with inline creation, and the 6-tab application detail modal with TLC/ITGC filtering and ITGC evidence document libraries with preview and audit logs.

### Modified Capabilities

## Impact

- **Frontend**:
  - `src/components/rcm/properties/RegulatoryPropertySheet.tsx` & `src/components/rcm/ControlEditorGeneralSection.tsx`: Add Significant Applications field and inline creation dropdown.
  - `src/pages/rcm/SOCMonitoringPage.tsx`: Implement clickable application rows opening the 6-tab detail dialog.
  - New component `src/components/rcm/ApplicationDetailDialog.tsx`: 6 tabs for TLC, ITGC, and 4 ITGC evidence file libraries.
  - Localization files (`src/i18n/locales/en/rcm.json`, `src/i18n/locales/id/rcm.json`).
- **Backend**:
  - `worker/db/schema.ts`: `applicationDocuments` table for ITGC domain evidence.
  - `worker/routes/infrastructure.ts`: Endpoints for managing and uploading application documents and querying linked controls.
