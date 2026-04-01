## Why

The current remediation module lacks full alignment with Regulation SK-5/DKU.MBU/11/2024. Specifically, it does not support formal coordination for design remediation (Lini 1 & 2), lacks mandatory fields required for regulatory documentation (Lampiran 6 & 11), and does not track "Remediation Timing" critical for year-end effectiveness conclusions.

## What Changes

- **Remediation Plan Structure**: Add mandatory regulatory fields: `Fungsi Terkait`, `Penanggung Jawab`, `Deskripsi Rencana vs Detail Aktivitas`, and `Status Persetujuan`.
- **Workflow Coordination**: Implement a "Request for Review" flow for Lini 1 to Lini 2 for design remediation.
- **Timing & Tracking**: Add tracking for whether remediation is completed "on or before year-end" to support Appendix 11 reporting.
- **UI Enhancements**: Update the `ActionPlan` data model and UI to reflect these regulatory fields and status transitions.

## Capabilities

### New Capabilities
- `remediation-coordination`: Formal workflow for Lini 1 and Lini 2 coordination on control design fixes.
- `regulatory-remediation-tracking`: Enhanced data capture for remediation plans as per Lampiran 6.

### Modified Capabilities
- `deficiency-management`: Update requirements for deficiency state transitions based on remediation timing and verification.

## Impact

- **Shared Types**: `shared/types.ts` will need updates to `ActionPlan` and `Deficiency` interfaces.
- **Components**: `DeficiencyBoard.tsx`, `DeficiencyCard.tsx`, and potential new remediation form components.
- **API**: Updates to `/api/actionplans` and `/api/deficiencies` endpoints to handle new regulatory fields.
