## Why

To enhance audit precision and data isolation, transaction samples must be explicitly linked to specific business processes (BPM IDs). Currently, transactions are only linked to GL Accounts, causing ambiguity when multiple sub-processes share the same account. This change ensures auditors only see relevant transactions for the specific sub-process they are assessing.

## What Changes

- **BPM Code Management**: Add the ability to input and edit human-readable codes (e.g., BPM-FIN-01) for business processes within the Worksheet UI. Enforce uniqueness per organization to prevent identification conflicts.
- **Database Schema Update**: Add `bpm_process_id` to the `transaction_details` table and a unique index for `bpm_code` in the `bpm_processes` table.
- **Enhanced Filtering & Linkage**: 
  - Update backend APIs and frontend sampling tabs to filter transaction details by both `noGL` and `bpm_process_id`.
  - Support automatic linkage of transactions to BPM processes using a `bpmCode` column in CSV uploads.
- **UI Refinements**: 
  - Integrate BPM Code input in the Execution Hub (Worksheet tab).
  - Update Transaction Sampling tab to pass the current `bpmProcessId`.
- **Safety & Stability**: Ensure consistent usage of `UnsavedChangesDialog` and full localization for new UI elements.

## Capabilities

### New Capabilities
- `bpm-code-management`: Management of human-readable process identifiers (BPM Codes) within the RCM worksheet.
- `transaction-bpm-linkage`: Explicit association of transaction line items with specific business process headers.

### Modified Capabilities
- `csa-management`: Update the CSA assessment workflow to fetch and display process-specific transaction samples.

## Impact

- **Database**: Schema migration for `transaction_details` table.
- **Backend**: Update `GET /api/transaction-details` and upload logic to support `bpm_process_id`.
- **Frontend**: `BPMWorksheet.tsx`, `TransactionSamplingTab.tsx`, and `CSATabContent.tsx` components.
- **Localization**: New strings in `csa_hub.json` and `rcm.json`.
