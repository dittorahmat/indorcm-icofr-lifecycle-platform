## Why

The current implementation of the Change Log (Lampiran 6) is a simplified audit trail that lacks the regulatory compliance required by **Regulation SK-5/DKU.MBU/11/2024**. The existing log view in the BPM modal only displays a simplified audit history (Timestamp, Staff, Change, and Approver), and the change log report tab under the main reports page is a dummy placeholder with static text. 

To achieve compliance, the application must capture and present the change management log matching the exact 11-column format specified in Lampiran 6 of the regulation, including classifying changes under the four regulatory factors (standards/regulation updates, policy changes, personnel changes, and IT system changes) and supporting digital sign-off and export functions.

## What Changes

- Add a **Change Category** field to the RCM/BPM edit and change request submission workflow to classify changes by:
  - *Faktor Eksternal* (Accounting standards or regulatory changes)
  - *Perubahan Kebijakan/Prosedur* (Internal policy/SOP changes)
  - *Perubahan Personel* (Control Owner/responsibility changes)
  - *Perubahan Sistem* (IT system/application changes)
- Extend the database schema (`audit_logs` table) and API routes to store and serve the detailed process, sub-process, before/after control references, change category, and editable effective date.
- Update the frontend **Logs** tab in `BPMModal` to render the compliant 11-column table rather than the simplified audit list.
- Replace the dummy report tab in `RegulatoryAppendices` with a fully functional, print-ready, and exportable **Lampiran 6 Change Management Log** table with proper sign-off blocks.

## Capabilities

### New Capabilities
- `lampiran-6-change-log`: Captures, validates, and reports the official 11-column Change Management Log, including categorization of changes by regulatory factors and full export capability.

### Modified Capabilities
- `regulatory-lifecycle-tracking`: Update the lifecycle tracking workflow to enforce categorization during RCM/BPM change approvals.

## Impact

- **Database**: Add `category` (enum/text) and metadata links to `audit_logs`.
- **API**: Update RCM/BPM change approval endpoints to map additional process metadata (e.g., process name, sub-process name, control references) to the generated audit logs.
- **Frontend Components**:
  - `src/components/bpm/Lampiran6LogView.tsx`: Redesign the table layout to support the 11 columns and metadata.
  - `src/components/reports/RegulatoryReportComponents.tsx`: Fully implement `ChangeLogReport` as a compliant report with export/print layouts and digital sign-off sections.
