## Why

To comply with **Regulation SK-5/DKU.MBU/11/2024**, every CSA (Control Self-Assessment) must be documented in a formal "Kertas Kerja Evaluasi" (Appendix 7a). Currently, the system stores assessment data digitally but lacks a standardized printout mechanism and template-based test procedures. This change introduces formal reporting layouts, a centralized way to manage standard test procedures for each business process, and professional branding with company logos in the report headers.

## What Changes

- **Appendix 7a Reporting**: New export feature in `CSATabContent` with two distinct layouts:
  - **Detailed Layout**: Full matrix of samples vs. controls with evidence and remarks.
  - **Summary Layout**: Aggregated effectiveness conclusions and deficiency list only.
- **Branded Headers**: Integration of company logo (fetched from settings) and professional metadata in the PDF headers, consistent with `BPMCanvasHeader`.
- **Master Test Procedure Templates**: Ability to define and maintain standard test procedures within the BPM Workflow Editor/Worksheet.
- **Enhanced CSA Form**: New fields for `Test Procedures` (auto-populated from master) and `Archive Location` (free text).
- **Smart Entry Points**: Context-aware assessment loading:
  - Todo List: Automatically opens the specific draft or new record linked to the `scheduleId`.
  - BPM/RCM Page: Defaults to the Assessment History List for research.
- **Resilient Navigation**: Fix for the "infinite loop" navigation bug where "Back to List" would sometimes fail due to aggressive auto-population logic.
- **Navigation Stability**: Ensuring manual navigation actions (Batal/Back) explicitly override automated state transitions to prevent users from getting "trapped" in assessment views.
- **Resilient Navigation State**: Implementation of a session-stable tracking mechanism (using Refs) to prioritize explicit user navigation choices over automated background redirects.
- **Context Isolation**: Guaranteed reset of all internal state machines and navigation overrides whenever the business process or schedule context changes.
- **Housekeeping (Housekeeping)**: New ability to delete assessment records to facilitate clean testing during development.
- **Audit Traceability**: Integration of QR codes for document verification on the generated reports.
- **Persistence**: Migration to store these new fields in the `csa_records` and `bpm_processes` tables.

## Capabilities

### New Capabilities
- `csa-appendix-7a-export`: The ability to generate formal audit workpapers in standardized, branded PDF formats.
- `test-procedure-management`: Centralized management of standard audit procedures per business process.

### Modified Capabilities
- `csa-management`: Update to include new data fields and template auto-population logic.
- `bpm-execution-hub`: Integrate reporting buttons and template maintenance UI.

## Impact

- `worker/db/schema.ts`: New columns for `standard_test_procedure` (bpm_processes) and `test_procedure`, `archive_location` (csa_records).
- `src/components/bpm/CSATabContent.tsx`: UI expansion for new inputs and export triggers.
- `src/components/bpm/BPMWorksheet.tsx`: UI for maintaining standard procedures.
- `src/lib/report-utils.ts`: PDF generation logic for Lampiran 7a.
- `src/i18n/`: Localization for new report labels and status strings.
- `src/hooks/useSettings.ts`: Fetching logo and company name for the reports.
