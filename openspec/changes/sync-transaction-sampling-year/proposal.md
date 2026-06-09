## Why

Currently, the transaction sampling module in the BPM workspace displays data from the year 2024, which does not align with the system's global working year (2026). Additionally, the frontend-backend communication for transaction uploads is mismatched, as the frontend sends batch data while the backend expects single records.

## What Changes

- **Year Alignment**: Bump all existing transaction sampling data from 2024 to 2026 via a database migration/repair script.
- **Dynamic Filtering**: Update the `TransactionSamplingTab` to filter displayed transactions based on the globally selected `workingYear` from `useFiscalYearStore`.
- **Batch Upload Support**: Refactor the transaction upload API to handle batch insertions and support `replace` or `append` modes correctly.
- **Backend Filtering**: Update the GET API for transactions to support year-based filtering.

## Capabilities

### New Capabilities
- `transaction-sampling-year-sync`: Implements the logic to synchronize transaction sampling display with the global fiscal year and ensures robust batch uploads.

### Modified Capabilities
- (None - requirement is a new synchronization layer)

## Impact

- **Frontend**: `src/components/bpm/TransactionSamplingTab.tsx`, `src/components/bpm/TransactionUploadModal.tsx`.
- **Backend**: `worker/routes/transactions.ts`.
- **Database**: `transaction_details` table rows update.
