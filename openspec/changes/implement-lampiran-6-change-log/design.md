## Context

The current Change Log (Lampiran 6) does not comply with the strict regulatory reporting requirements of Regulation SK-5/2024. In the database, the `audit_logs` table has basic logging capabilities, but it lacks categorization based on the 4 mandatory regulatory factors and process/sub-process context. In the frontend, the UI uses a simplified list and a dummy placeholder on the Reports page.

We need to implement a fully compliant end-to-end Change Management workflow, database updates, API routing, and print-ready report views.

## Goals / Non-Goals

**Goals:**
- Add a mandatory `category` selector to RCM/Control modification and approval actions.
- Update the `audit_logs` database schema to include a `change_category` field.
- Enhance the change logging service to capture the required metadata (Process, Sub-process, Control References, and Control Owner).
- Redesign `Lampiran6LogView` in the BPM Modal to display the compliant 11-column table.
- Implement the actual `ChangeLogReport` component under the Reports workspace with print styling, Excel/CSV exporting, and digital sign-off blocks.

**Non-Goals:**
- Automated extraction or mapping of process diagrams from third-party BPM tools.
- Logging of non-regulatory changes (e.g. user login, setting changes) in the Lampiran 6 report view.

## Decisions

### 1. Database Schema Extension
Extend `auditLogs` table in the database schema:
- Add `changeCategory` column: `text("change_category")` (Values: `'Regulatory'`, `'Policy'`, `'Personnel'`, `'System'`).
- The fields `descriptionBefore` and `descriptionAfter` will be populated with the full descriptions of the process/control elements before and after modification to satisfy the Lampiran 6 requirements.

*Alternatives considered:*
- *Creating a separate `change_management_log` table:* Rejected because `audit_logs` already has `isRegulatory`, `effectiveDate`, and `approvedBy` columns, making schema consolidation simpler and more efficient.

### 2. Enhancing logAction with Metadata
When a change request is approved, the RCM or Control service will fetch the related Process name, Sub-process name, and Control Owner details, and pass them as part of the `dataBefore` and `dataAfter` JSON structures inside the audit log. The frontend will parse these structures to populate the 11-column table.

### 3. Change Log Report Page Implementation
Replace the placeholder `ChangeLogReport` in `src/components/reports/RegulatoryReportComponents.tsx` with a component that:
- Fetches all regulatory logs using `/api/change-logs?isRegulatory=true` (or filtering the active change logs).
- Displays them in an 11-column HTML table with specific print-friendly CSS utilities (e.g. `no-print`, `print:hidden`).
- Features a printable footer block showing:
  - "Disetujui oleh: (Pemilik Pengendalian)" (populated from the logging user)
  - "Diketahui oleh: (Lini Kedua Fungsi ICOFR)" (populated from the approver)
- Standardizes export options (CSV/Excel) using existing utility frameworks.

## Risks / Trade-offs

- **[Risk] Retroactive Compatibility**: Existing audit logs lack the `changeCategory` or full Process/Sub-process names.
  - *Mitigation*: The frontend table will display default fallback text (e.g. `"-"` or `"Manual baseline"`) for historical logs, and we will ensure the seed script maps basic values.
- **[Risk] 11-Column Layout Overflow**: Rendering 11 columns in the BPM Modal tab can cause layout breaks on small screens.
  - *Mitigation*: The table will be enclosed in a scrollable horizontal container (`overflow-x-auto`) inside the modal. The main report tab will feature a print-optimized stylesheet to ensure it scales correctly on standard A4 paper.
